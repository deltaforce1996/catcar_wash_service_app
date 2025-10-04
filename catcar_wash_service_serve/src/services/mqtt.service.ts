import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import { connect } from 'mqtt';

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
  payload: Buffer | string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  dup?: boolean;
}

export interface MqttSubscription {
  topic: string;
  qos?: 0 | 1 | 2;
}

export interface MqttConnectionStatus {
  connected: boolean;
  clientId: string;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
}

@Injectable()
export class MqttService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: any = null;
  private config: MqttConfig;
  private connectionStatus: MqttConnectionStatus;
  private subscriptions: Map<string, MqttSubscription> = new Map();

  constructor(private readonly configService: ConfigService) {
    super();

    this.config = {
      brokerUrl: this.configService.get<string>('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
      clientId: this.configService.get<string>('MQTT_CLIENT_ID', `catcar-wash-${Date.now()}`),
      username: this.configService.get<string>('MQTT_USERNAME'),
      password: this.configService.get<string>('MQTT_PASSWORD'),
      keepalive: this.configService.get<number>('MQTT_KEEPALIVE', 60),
      connectTimeout: this.configService.get<number>('MQTT_CONNECT_TIMEOUT', 30000),
      reconnectPeriod: this.configService.get<number>('MQTT_RECONNECT_PERIOD', 5000),
      clean: this.configService.get<boolean>('MQTT_CLEAN', true),
      qos: this.configService.get<number>('MQTT_QOS', 1) as 0 | 1 | 2,
    };

    this.connectionStatus = {
      connected: false,
      clientId: this.config.clientId || '',
      reconnectAttempts: 0,
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to MQTT broker
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        this.logger.warn('MQTT client is already connected');
        resolve();
        return;
      }

      try {
        this.logger.log(`Connecting to MQTT broker: ${this.config.brokerUrl}`);

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
        reject(new Error(`Failed to create MQTT client: ${error.message}`));
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
        this.emit('disconnected');
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
      throw new Error('MQTT client is not connected');
    }

    const messageOptions: any = {
      qos: options?.qos ?? this.config.qos ?? 1,
      retain: options?.retain ?? false,
      dup: options?.dup ?? false,
    };

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, payload, messageOptions, (error) => {
        if (error) {
          this.logger.error(`Failed to publish message to topic ${topic}:`, error);
          reject(new Error(`Failed to publish message to topic ${topic}: ${error.message}`));
        } else {
          this.logger.debug(`Message published to topic: ${topic}`);
          this.emit('messagePublished', { topic, payload, options: messageOptions });
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
      throw new Error('MQTT client is not connected');
    }

    const subscription: MqttSubscription = {
      topic,
      qos: qos ?? this.config.qos,
    };

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos: subscription.qos ?? 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
          reject(new Error(`Failed to subscribe to topic ${topic}: ${error.message}`));
        } else {
          this.subscriptions.set(topic, subscription);
          this.logger.log(`Subscribed to topic: ${topic} (QoS: ${subscription.qos})`);
          this.emit('subscribed', subscription);
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
      throw new Error('MQTT client is not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.unsubscribe(topic, (error) => {
        if (error) {
          this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
          reject(new Error(`Failed to unsubscribe from topic ${topic}: ${error.message}`));
        } else {
          this.subscriptions.delete(topic);
          this.logger.log(`Unsubscribed from topic: ${topic}`);
          this.emit('unsubscribed', topic);
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
  }

  /**
   * Setup MQTT client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.logger.log('MQTT client connected successfully');
      this.connectionStatus.connected = true;
      this.connectionStatus.lastConnected = new Date();
      this.connectionStatus.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.client.on('disconnect', () => {
      this.logger.warn('MQTT client disconnected');
      this.connectionStatus.connected = false;
      this.connectionStatus.lastDisconnected = new Date();
      this.emit('disconnected');
    });

    this.client.on('reconnect', () => {
      this.logger.log('MQTT client reconnecting...');
      this.connectionStatus.reconnectAttempts++;
      this.emit('reconnecting');
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT client error:', error);
      this.emit('error', error);
    });

    this.client.on('message', (topic, payload, packet) => {
      this.logger.debug(`Message received on topic: ${topic}`);

      const message: MqttMessage = {
        topic,
        payload,
        qos: packet.qos as 0 | 1 | 2,
        retain: packet.retain,
        dup: packet.dup,
      };

      this.emit('message', message);
      this.emit(`message:${topic}`, message);
    });

    this.client.on('offline', () => {
      this.logger.warn('MQTT client is offline');
      this.connectionStatus.connected = false;
      this.emit('offline');
    });

    this.client.on('end', () => {
      this.logger.log('MQTT client connection ended');
      this.connectionStatus.connected = false;
      this.emit('end');
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
    const promises = subscriptions.map((sub) => this.subscribe(sub.topic, sub.qos));
    await Promise.all(promises);
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
      throw error;
    }
  }

  /**
   * Unsubscribe from multiple topics at once
   */
  async unsubscribeMultiple(topics: string[]): Promise<void> {
    const promises = topics.map((topic) => this.unsubscribe(topic));
    await Promise.all(promises);
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
}
