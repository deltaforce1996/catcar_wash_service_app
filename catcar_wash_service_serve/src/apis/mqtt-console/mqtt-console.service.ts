import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { MqttMessage } from '../../modules/mqtt/mqtt.service';

export interface MqttConsoleMessage {
  timestamp: string;
  topic: string;
  payload: string;
  qos?: number;
  retain?: boolean;
  receivedAt: Date;
}

@Injectable()
export class MqttConsoleService {
  private readonly logger = new Logger(MqttConsoleService.name);
  private messages: MqttConsoleMessage[] = [];
  private readonly maxMessages = 1000; // Keep last 1000 messages
  private subscribers: Array<(message: MqttConsoleMessage) => void> = [];

  /**
   * Listen to MQTT messages
   */
  @OnEvent('mqtt.message')
  handleMqttMessage(message: MqttMessage) {
    try {
      const timestamp = new Date().toISOString();
      const receivedAt = new Date();

      // Parse payload
      let payloadStr: string;
      if (Buffer.isBuffer(message.payload)) {
        payloadStr = message.payload.toString('utf-8');
      } else if (typeof message.payload === 'string') {
        payloadStr = message.payload;
      } else {
        payloadStr = JSON.stringify(message.payload);
      }

      const consoleMessage: MqttConsoleMessage = {
        timestamp,
        topic: message.topic,
        payload: payloadStr,
        qos: message.qos,
        retain: message.retain,
        receivedAt,
      };

      // Add to messages array
      this.messages.push(consoleMessage);

      // Keep only last N messages
      if (this.messages.length > this.maxMessages) {
        this.messages.shift();
      }

      // Notify all subscribers
      this.notifySubscribers(consoleMessage);

      this.logger.debug(`MQTT Console: Received message on topic ${message.topic}`);
    } catch (error) {
      this.logger.error('Error handling MQTT message in console:', error);
    }
  }

  /**
   * Subscribe to new messages (for SSE)
   */
  subscribe(callback: (message: MqttConsoleMessage) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(message: MqttConsoleMessage): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        this.logger.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit?: number): MqttConsoleMessage[] {
    if (limit && limit > 0) {
      return this.messages.slice(-limit);
    }
    return [...this.messages];
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
    this.logger.log('MQTT Console: All messages cleared');
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    return this.subscribers.length;
  }

  /**
   * Get list of unique topics
   */
  getUniqueTopics(): string[] {
    const topicsSet = new Set<string>();
    this.messages.forEach((msg) => topicsSet.add(msg.topic));
    return Array.from(topicsSet).sort();
  }
}
