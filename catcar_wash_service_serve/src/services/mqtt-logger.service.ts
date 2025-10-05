import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface MqttLogEntry {
  type: 'connection_error' | 'publish_error' | 'subscribe_error' | 'unsubscribe_error';
  message: string;
  topic?: string;
  error?: Error;
  clientId?: string;
}

@Injectable()
export class MqttLoggerService {
  /**
   * Log MQTT connection issues to file
   */
  logMqttIssueToFile(entry: MqttLogEntry): void {
    // Use Thailand timezone (UTC+7)
    const now = new Date();
    const thailandTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const timestamp = thailandTime.toISOString().replace('T', ' ').replace('Z', ' +07:00');

    // Format log entry
    const logLine = `${timestamp} [mqtt-${entry.type}] ${entry.message}\n`;

    let details = '';
    if (entry.topic) {
      details += `Topic: ${entry.topic}\n`;
    }
    if (entry.clientId) {
      details += `Client ID: ${entry.clientId}\n`;
    }
    if (entry.error) {
      details += `Error: ${entry.error.message}\n`;
      if (entry.error.stack) {
        details += `Stack: ${entry.error.stack}\n`;
      }
    }

    const separator = details ? '\n' : '';
    const logText = logLine + details + separator + '---\n';

    // Create logging/mqtt directory structure
    const logDir = path.join(process.cwd(), 'logging', 'mqtt');
    // Use Thailand date for filename
    const dateStr = thailandTime.toISOString().split('T')[0];
    const logFileName = `mqtt-${dateStr}.txt`;
    const logFilePath = path.join(logDir, logFileName);

    try {
      // Create directories if they don't exist
      fs.mkdirSync(logDir, { recursive: true });

      // Append to daily log file
      fs.appendFileSync(logFilePath, logText);
    } catch (writeError) {
      console.error('Failed to write MQTT log to file:', writeError);
    }
  }

  /**
   * Log MQTT connection error
   */
  logConnectionError(message: string, clientId?: string, error?: Error): void {
    this.logMqttIssueToFile({
      type: 'connection_error',
      message,
      clientId,
      error,
    });
  }

  /**
   * Log MQTT publish error
   */
  logPublishError(message: string, topic?: string, clientId?: string, error?: Error): void {
    this.logMqttIssueToFile({
      type: 'publish_error',
      message,
      topic,
      clientId,
      error,
    });
  }

  /**
   * Log MQTT subscribe error
   */
  logSubscribeError(message: string, topic?: string, clientId?: string, error?: Error): void {
    this.logMqttIssueToFile({
      type: 'subscribe_error',
      message,
      topic,
      clientId,
      error,
    });
  }

  /**
   * Log MQTT unsubscribe error
   */
  logUnsubscribeError(message: string, topic?: string, clientId?: string, error?: Error): void {
    this.logMqttIssueToFile({
      type: 'unsubscribe_error',
      message,
      topic,
      clientId,
      error,
    });
  }
}
