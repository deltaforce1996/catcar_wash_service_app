import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { connect } from 'mqtt';
import { MqttLoggerService } from '../../services/mqtt-logger.service';

export interface MqttConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  keepalive?: number;
  connectTimeout?: number;
  reconnectPeriod?: number;
  clean?: boolean;
  qos?: 0 | 1 | 2;
}

export interface MqttMessage {
  topic: string;
  payload: any;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  dup?: boolean;
}

export interface MqttSubscription {
  topic: string;
  qos?: 0 | 1 | 2;
}

export type MqttMessageHandler = (message: MqttMessage) => void;

export interface MqttConnectionStatus {
  connected: boolean;
  clientId: string;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: any = null;
  private config: MqttConfig;
  private connectionStatus: MqttConnectionStatus;
  private subscriptions: Map<string, MqttSubscription> = new Map();
  private messageHandlers: Map<string, MqttMessageHandler[]> = new Map();
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private processEventListeners: Array<{ event: string; handler: (...args: any[]) => void }> = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly mqttLoggerService: MqttLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Set up global error handling to prevent app crashes
    this.setupGlobalErrorHandling();

    this.config = {
      brokerUrl: this.configService.get<string>('app.mqttBrokerUrl', 'mqtt://localhost:1883'),
      clientId: this.configService.get<string>('app.mqttClientId', `catcar-wash-${Date.now()}`),
      username: this.configService.get<string>('app.mqttUsername'),
      password: this.configService.get<string>('app.mqttPassword'),
      keepalive: this.configService.get<number>('app.mqttKeepalive', 60),
      connectTimeout: this.configService.get<number>('app.mqttConnectTimeout', 30000),
      reconnectPeriod: this.configService.get<number>('app.mqttReconnectPeriod', 5000),
      clean: this.configService.get<boolean>('app.mqttClean', true),
      qos: this.configService.get<number>('app.mqttQos', 1) as 0 | 1 | 2,
    };

    this.maxReconnectAttempts = this.configService.get<number>('app.mqttMaxReconnectAttempts', 5);

    this.connectionStatus = {
      connected: false,
      clientId: this.config.clientId || '',
      reconnectAttempts: 0,
    };

    this.reconnectAttempts = 0;
  }

  async onModuleInit() {
    try {
      await this.connect();
    } catch (error) {
      this.logger.warn('Failed to connect to MQTT broker during startup:', error.message);
      this.mqttLoggerService.logConnectionError(
        `Failed to connect to MQTT broker during startup: ${error.message}`,
        this.config.clientId,
        error as Error,
      );
      // Don't throw error, let the app continue without MQTT
    }
  }

  async onModuleDestroy() {
    // Clean up process event listeners
    for (const { event, handler } of this.processEventListeners) {
      process.off(event, handler);
    }
    this.processEventListeners = [];

    // Clean up message handlers
    this.messageHandlers.clear();

    // Clean up subscriptions
    this.subscriptions.clear();

    // Disconnect from MQTT broker
    await this.disconnect();

    this.logger.log('MQTT Service destroyed and cleaned up');
  }

  /**
   * Connect to MQTT broker
   */
  connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client?.connected) {
        this.logger.warn('MQTT client is already connected');
        resolve();
        return;
      }

      // Check if we've exceeded max reconnect attempts
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.warn(
          `MQTT connection failed after ${this.maxReconnectAttempts} attempts. Stopping reconnection attempts.`,
        );
        this.mqttLoggerService.logConnectionError(
          `MQTT connection failed after ${this.maxReconnectAttempts} attempts. Stopping reconnection attempts.`,
          this.config.clientId,
        );
        resolve();
        return;
      }

      try {
        this.logger.log(
          `Connecting to MQTT broker: ${this.config.brokerUrl} (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
        );

        this.client = connect(this.config.brokerUrl, {
          clientId: this.config.clientId,
          username: this.config.username,
          password: this.config.password,
          keepalive: this.config.keepalive,
          connectTimeout: this.config.connectTimeout,
          reconnectPeriod: this.config.reconnectPeriod,
          clean: this.config.clean,
        });

        this.setupEventHandlers();
        resolve();
      } catch (error) {
        this.logger.error('Failed to create MQTT client:', error);
        this.mqttLoggerService.logConnectionError(
          `Failed to create MQTT client: ${error.message}`,
          this.config.clientId,
          error as Error,
        );
        // Don't reject, just resolve to allow app to continue
        resolve();
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    return new Promise((resolve) => {
      this.client!.end(true, {}, () => {
        this.logger.log('MQTT client disconnected');
        this.connectionStatus.connected = false;
        this.connectionStatus.lastDisconnected = new Date();
        this.eventEmitter.emit('mqtt.disconnected');
        resolve();
      });
    });
  }

  /**
   * Publish a message to a topic
   */
  async publish(
    topic: string,
    payload: string | Buffer,
    options?: {
      qos?: 0 | 1 | 2;
      retain?: boolean;
      dup?: boolean;
    },
  ): Promise<void> {
    if (!this.client?.connected) {
      const message = 'MQTT client is not connected - cannot publish message';
      this.logger.warn(message);
      this.mqttLoggerService.logPublishError(message, topic, this.config.clientId);
      return;
    }

    const messageOptions: any = {
      qos: options?.qos ?? this.config.qos ?? 1,
      retain: options?.retain ?? false,
      dup: options?.dup ?? false,
    };

    return new Promise((resolve) => {
      this.client!.publish(topic, payload, messageOptions, (error) => {
        if (error) {
          this.logger.error(`Failed to publish message to topic ${topic}:`, error);
          this.mqttLoggerService.logPublishError(
            `Failed to publish message to topic ${topic}: ${error.message}`,
            topic,
            this.config.clientId,
          );
          // Don't reject, just resolve to allow app to continue
          resolve();
        } else {
          this.logger.debug(`Message published to topic: ${topic}`);
          this.eventEmitter.emit('mqtt.messagePublished', { topic, payload, options: messageOptions });
          resolve();
        }
      });
    });
  }

  /**
   * Subscribe to a topic
   */
  async subscribe(topic: string, qos?: 0 | 1 | 2): Promise<void> {
    if (!this.client?.connected) {
      const message = 'MQTT client is not connected - cannot subscribe to topic';
      this.logger.warn(message);
      this.mqttLoggerService.logSubscribeError(message, topic, this.config.clientId);
      return;
    }

    const subscription: MqttSubscription = {
      topic,
      qos: qos ?? this.config.qos,
    };

    return new Promise((resolve) => {
      this.client!.subscribe(topic, { qos: subscription.qos ?? 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
          this.mqttLoggerService.logSubscribeError(
            `Failed to subscribe to topic ${topic}: ${error.message}`,
            topic,
            this.config.clientId,
          );
          // Don't reject, just resolve to allow app to continue
          resolve();
        } else {
          this.subscriptions.set(topic, subscription);
          this.logger.log(`Subscribed to topic: ${topic} (QoS: ${subscription.qos})`);
          this.eventEmitter.emit('mqtt.subscribed', subscription);
          resolve();
        }
      });
    });
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribe(topic: string): Promise<void> {
    if (!this.client?.connected) {
      const message = 'MQTT client is not connected - cannot unsubscribe from topic';
      this.logger.warn(message);
      this.mqttLoggerService.logUnsubscribeError(message, topic, this.config.clientId);
      return;
    }

    return new Promise((resolve) => {
      this.client!.unsubscribe(topic, (error) => {
        if (error) {
          this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
          this.mqttLoggerService.logUnsubscribeError(
            `Failed to unsubscribe from topic ${topic}: ${error.message}`,
            topic,
            this.config.clientId,
          );
          // Don't reject, just resolve to allow app to continue
          resolve();
        } else {
          this.subscriptions.delete(topic);
          this.logger.log(`Unsubscribed from topic: ${topic}`);
          this.eventEmitter.emit('mqtt.unsubscribed', topic);
          resolve();
        }
      });
    });
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): MqttConnectionStatus {
    return {
      ...this.connectionStatus,
      connected: this.client?.connected ?? false,
    };
  }

  /**
   * Get list of current subscriptions
   */
  getSubscriptions(): MqttSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.client?.connected === true;
  }

  /**
   * Reconnect to MQTT broker
   */
  async reconnect(): Promise<void> {
    try {
      // Reset reconnect attempts for manual reconnect
      this.reconnectAttempts = 0;
      this.connectionStatus.reconnectAttempts = 0;

      if (this.client?.connected) {
        await this.disconnect();
      }
      await this.connect();

      // Re-subscribe to all previous subscriptions
      for (const subscription of this.subscriptions.values()) {
        try {
          await this.subscribe(subscription.topic, subscription.qos);
        } catch (error) {
          this.logger.error(`Failed to re-subscribe to topic ${subscription.topic}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to reconnect to MQTT broker:', error);
      this.mqttLoggerService.logConnectionError(
        `Failed to reconnect to MQTT broker: ${error.message}`,
        this.config.clientId,
        error as Error,
      );
      // Don't throw error, let the app continue
    }
  }

  /**
   * Setup global error handling to prevent app crashes
   */
  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections related to MQTT
    const unhandledRejectionHandler = (reason: any) => {
      if (reason && typeof reason === 'object' && 'message' in reason) {
        const error = reason as Error;
        if (error.message.includes('MQTT') || error.message.includes('ECONNREFUSED')) {
          this.logger.warn('Unhandled MQTT promise rejection (suppressed):', error.message);
          this.mqttLoggerService.logConnectionError(
            `Unhandled MQTT promise rejection: ${error.message}`,
            this.config.clientId,
            error,
          );
          return; // Don't let it crash the app
        }
      }
    };

    // Handle uncaught exceptions related to MQTT
    const uncaughtExceptionHandler = (error: Error) => {
      if (error.message.includes('MQTT') || error.message.includes('ECONNREFUSED')) {
        this.logger.warn('Uncaught MQTT exception (suppressed):', error.message);
        this.mqttLoggerService.logConnectionError(
          `Uncaught MQTT exception: ${error.message}`,
          this.config.clientId,
          error,
        );
        return; // Don't let it crash the app
      }
    };

    // Store handlers for cleanup
    this.processEventListeners.push(
      { event: 'unhandledRejection', handler: unhandledRejectionHandler },
      { event: 'uncaughtException', handler: uncaughtExceptionHandler },
    );

    // Register handlers
    process.on('unhandledRejection', unhandledRejectionHandler);
    process.on('uncaughtException', uncaughtExceptionHandler);
  }

  /**
   * Setup MQTT client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Prevent unhandled error events from crashing the app
    this.client.on('error', (error) => {
      this.logger.error('MQTT client error (handled):', error);
      this.mqttLoggerService.logConnectionError(
        `MQTT client error: ${error.message}`,
        this.config.clientId,
        error as Error,
      );
      // Don't emit error to prevent app crash - just log it
    });

    // Add global error handler to prevent unhandled errors
    const originalEmit = this.client.emit;

    this.client.emit = function (event: string, ...args: any[]): boolean {
      if (event === 'error' && this.listenerCount('error') === 0) {
        // If no error listeners, just log and don't emit
        console.warn('Unhandled MQTT error event:', args[0]);
        return true;
      }
      return originalEmit.apply(this, [event, ...args]) as boolean;
    };

    this.client.on('connect', () => {
      this.logger.log('MQTT client connected successfully');
      this.connectionStatus.connected = true;
      this.connectionStatus.lastConnected = new Date();
      this.connectionStatus.reconnectAttempts = 0;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.eventEmitter.emit('mqtt.connected');
    });

    this.client.on('disconnect', () => {
      this.logger.warn('MQTT client disconnected');
      this.mqttLoggerService.logConnectionError('MQTT client disconnected', this.config.clientId);
      this.connectionStatus.connected = false;
      this.connectionStatus.lastDisconnected = new Date();
      this.eventEmitter.emit('mqtt.disconnected');
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      this.connectionStatus.reconnectAttempts = this.reconnectAttempts;

      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.logger.log(`MQTT client reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.eventEmitter.emit('mqtt.reconnecting');
      } else {
        this.logger.warn(
          `MQTT reconnection attempts exceeded maximum (${this.maxReconnectAttempts}). Stopping reconnection.`,
        );
        this.mqttLoggerService.logConnectionError(
          `MQTT reconnection attempts exceeded maximum (${this.maxReconnectAttempts}). Stopping reconnection.`,
          this.config.clientId,
        );
        // Stop the client from attempting further reconnections
        if (this.client) {
          this.client.end(true);
        }
      }
    });

    this.client.on('message', (topic: string, payload: any, packet: any) => {
      this.logger.debug(`Message received on topic: ${topic}`);

      const message: MqttMessage = {
        topic,
        payload,
        qos: packet.qos as 0 | 1 | 2,
        retain: packet.retain,
        dup: packet.dup,
      };

      // Call registered callbacks
      for (const [pattern, handlers] of this.messageHandlers.entries()) {
        if (this.topicMatches(String(topic), pattern)) {
          handlers.forEach((handler) => {
            try {
              handler(message);
            } catch (error) {
              this.logger.error(`Error in message handler for pattern ${pattern}:`, error);
            }
          });
        }
      }

      // Emit events for backward compatibility
      this.eventEmitter.emit('mqtt.message', message);
      this.eventEmitter.emit(`mqtt.message:${topic}`, message);
    });

    this.client.on('offline', () => {
      this.logger.warn('MQTT client is offline');
      this.mqttLoggerService.logConnectionError('MQTT client is offline', this.config.clientId);
      this.connectionStatus.connected = false;
      this.eventEmitter.emit('mqtt.offline');
    });

    this.client.on('end', () => {
      this.logger.log('MQTT client connection ended');
      this.connectionStatus.connected = false;
      this.eventEmitter.emit('mqtt.end');
    });
  }

  /**
   * Publish JSON data to a topic
   */
  async publishJson(
    topic: string,
    data: any,
    options?: {
      qos?: 0 | 1 | 2;
      retain?: boolean;
    },
  ): Promise<void> {
    const payload = JSON.stringify(data);
    return this.publish(topic, payload, options);
  }

  /**
   * Subscribe to multiple topics at once
   */
  async subscribeMultiple(subscriptions: MqttSubscription[]): Promise<void> {
    const promises = subscriptions.map(async (sub) => {
      try {
        await this.subscribe(sub.topic, sub.qos);
      } catch (error) {
        this.logger.error(`Failed to subscribe to topic ${sub.topic}:`, error);
        // Continue with other subscriptions even if one fails
      }
    });
    await Promise.allSettled(promises);
  }

  /**
   * Subscribe to device streaming topics
   */
  async subscribeToDeviceStreaming(): Promise<void> {
    try {
      // Subscribe to all device streaming topics using wildcard
      await this.subscribe('server/+/streaming', 1);
      this.logger.log('Subscribed to device streaming topics: server/+/streaming');
    } catch (error) {
      this.logger.error('Failed to subscribe to device streaming topics:', error);
      this.mqttLoggerService.logSubscribeError(
        `Failed to subscribe to device streaming topics: ${error.message}`,
        'server/+/streaming',
        this.config.clientId,
      );
      // Don't throw error, let the app continue
    }
  }

  /**
   * Register a callback handler for specific topic pattern
   */
  onMessage(topicPattern: string, handler: MqttMessageHandler): void {
    if (!this.messageHandlers.has(topicPattern)) {
      this.messageHandlers.set(topicPattern, []);
    }
    this.messageHandlers.get(topicPattern)!.push(handler);
    this.logger.debug(`Registered message handler for pattern: ${topicPattern}`);
  }

  /**
   * Unregister a callback handler for specific topic pattern
   */
  offMessage(topicPattern: string, handler: MqttMessageHandler): void {
    const handlers = this.messageHandlers.get(topicPattern);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.logger.debug(`Unregistered message handler for pattern: ${topicPattern}`);
      }
    }
  }

  /**
   * Check if topic matches pattern (supports wildcards)
   */
  private topicMatches(topic: string, pattern: string): boolean {
    // Convert MQTT wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\+/g, '[^/]+') // + matches any single level
      .replace(/#/g, '.*'); // # matches multiple levels
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

  /**
   * Unsubscribe from multiple topics at once
   */
  async unsubscribeMultiple(topics: string[]): Promise<void> {
    const promises = topics.map(async (topic) => {
      try {
        await this.unsubscribe(topic);
      } catch (error) {
        this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
        // Continue with other unsubscriptions even if one fails
      }
    });
    await Promise.allSettled(promises);
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.config.clientId || '';
  }

  /**
   * Update configuration (requires reconnection)
   */
  async updateConfig(newConfig: Partial<MqttConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    if (this.client?.connected) {
      await this.reconnect();
    }
  }

  /**
   * Reset reconnect attempts counter (useful for manual reconnection)
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
    this.connectionStatus.reconnectAttempts = 0;
    this.logger.log('MQTT reconnect attempts counter reset');
  }

  /**
   * Get maximum reconnect attempts setting
   */
  getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }

  /**
   * Get current reconnect attempts count
   */
  getCurrentReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Check if MQTT service has exceeded max reconnect attempts
   */
  hasExceededMaxReconnectAttempts(): boolean {
    return this.reconnectAttempts >= this.maxReconnectAttempts;
  }
}
