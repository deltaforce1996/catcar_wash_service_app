import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { MqttService } from '../mqtt/mqtt.service';
import {
  MqttCommandPayload,
  MqttCommandAckResponse,
  MqttCommandResult,
  MqttCommandType,
  MqttCommandOptions,
  ActiveCommand,
  ApplyConfigPayload,
  RestartPayload,
  UpdateFirmwarePayload,
  ResetConfigPayload,
  CommandConfig,
} from './types/mqtt-command-manager.types';

@Injectable()
export class MqttCommandManagerService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttCommandManagerService.name);
  private readonly activeCommands = new Map<string, ActiveCommand>();
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly defaultRetryAttempts = 3;
  private readonly defaultRetryDelay = 1000; // 1 second

  constructor(private readonly mqttService: MqttService) {
    super();
  }

  async onModuleInit() {
    // Subscribe to all ACK responses from devices
    await this.mqttService.subscribe('server/+/ack', 1);

    // Listen for ACK messages
    this.mqttService.on('message', (message: any) => {
      if (typeof message.topic === 'string' && message.topic.startsWith('server/') && message.topic.endsWith('/ack')) {
        this.handleAckResponse(String(message.payload));
      }
    });

    this.logger.log('MQTT Command Manager Service initialized');
  }

  onModuleDestroy() {
    // Clean up all active commands
    for (const [, activeCommand] of this.activeCommands) {
      clearTimeout(activeCommand.timeout);
      activeCommand.reject(new Error('Service shutting down'));
    }
    this.activeCommands.clear();
    this.logger.log('MQTT Command Manager Service destroyed');
  }

  /**
   * Send APPLY_CONFIG command to device
   */
  async applyConfig(
    deviceId: string,
    configs: CommandConfig,
    options: MqttCommandOptions = {},
  ): Promise<MqttCommandResult> {
    const payload: ApplyConfigPayload = { configs };
    return this.sendCommand(deviceId, 'APPLY_CONFIG', payload, {
      require_ack: true,
      ...options,
    });
  }

  /**
   * Send RESTART command to device
   */
  async restartDevice(
    deviceId: string,
    delaySeconds: number = 5,
    options: MqttCommandOptions = {},
  ): Promise<MqttCommandResult> {
    const payload: RestartPayload = { delay_seconds: delaySeconds };
    return this.sendCommand(deviceId, 'RESTART', payload, {
      require_ack: true,
      ...options,
    });
  }

  /**
   * Send UPDATE_FIRMWARE command to device
   */
  async updateFirmware(
    deviceId: string,
    firmwareInfo: UpdateFirmwarePayload,
    options: MqttCommandOptions = {},
  ): Promise<MqttCommandResult> {
    return this.sendCommand(deviceId, 'UPDATE_FIRMWARE', firmwareInfo, {
      require_ack: true,
      ...options,
    });
  }

  /**
   * Send RESET_CONFIG command to device
   */
  async resetConfig(
    deviceId: string,
    delaySeconds: number = 30,
    options: MqttCommandOptions = {},
  ): Promise<MqttCommandResult> {
    const payload: ResetConfigPayload = { delay_seconds: delaySeconds };
    return this.sendCommand(deviceId, 'RESET_CONFIG', payload, {
      require_ack: true,
      ...options,
    });
  }

  /**
   * Send custom command to device
   */
  async sendCustomCommand(
    deviceId: string,
    command: string,
    payload: any,
    requireAck: boolean = true,
    options: MqttCommandOptions = {},
  ): Promise<MqttCommandResult> {
    return this.sendCommand(deviceId, command as MqttCommandType, payload, {
      require_ack: requireAck,
      ...options,
    });
  }

  /**
   * Core method to send MQTT command
   */
  private async sendCommand(
    deviceId: string,
    command: MqttCommandType,
    payload: any,
    options: {
      require_ack: boolean;
      timeout_ms?: number;
      retry_attempts?: number;
      retry_delay_ms?: number;
    },
  ): Promise<MqttCommandResult> {
    const commandId = this.generateCommandId();
    const topic = `device/${deviceId}/command`;
    const timestamp = Date.now();

    const mqttPayload: MqttCommandPayload = {
      command_id: commandId,
      command,
      require_ack: options.require_ack,
      payload,
      timestamp,
    };

    const sentAt = new Date();

    try {
      // Send MQTT message
      await this.mqttService.publishJson(topic, mqttPayload, { qos: 1 });

      this.logger.log(`Command sent: ${commandId} (${command}) to device: ${deviceId}`);

      const result: MqttCommandResult = {
        command_id: commandId,
        device_id: deviceId,
        command,
        status: 'SENT',
        sent_at: sentAt,
      };

      // For fire-and-forget commands, return immediately
      if (!options.require_ack) {
        this.emit('command-sent', result);
        return result;
      }

      // For ACK commands, set up timeout and wait for response
      return new Promise<MqttCommandResult>((resolve, reject) => {
        const timeout = options.timeout_ms || this.defaultTimeout;
        const timeoutHandle = setTimeout(() => {
          this.activeCommands.delete(commandId);
          const timeoutResult: MqttCommandResult = {
            ...result,
            status: 'TIMEOUT',
            error: 'Device did not respond within timeout period',
            timeout_at: new Date(),
          };

          this.logger.warn(`Command timeout: ${commandId} (${command}) to device: ${deviceId}`);
          this.emit('command-timeout', timeoutResult);
          resolve(timeoutResult);
        }, timeout);

        // Store active command
        this.activeCommands.set(commandId, {
          command_id: commandId,
          device_id: deviceId,
          command,
          timeout: timeoutHandle,
          resolve,
          reject,
          sent_at: sentAt,
        });

        this.emit('command-sent', result);
      });
    } catch (error) {
      const errorResult: MqttCommandResult = {
        command_id: commandId,
        device_id: deviceId,
        command,
        status: 'ERROR',
        error: error.message,
        sent_at: sentAt,
      };

      this.logger.error(`Failed to send command: ${commandId} (${command}) to device: ${deviceId}`, error);
      this.emit('command-error', errorResult);
      return errorResult;
    }
  }

  /**
   * Handle ACK response from device
   */
  private handleAckResponse(payload: string): void {
    try {
      const ackResponse: MqttCommandAckResponse = JSON.parse(payload);
      const { command_id, device_id, command, status, error } = ackResponse;

      this.logger.log(`ACK received: ${command_id} (${command}) from device: ${device_id} - Status: ${status}`);

      const activeCommand = this.activeCommands.get(command_id);
      if (!activeCommand) {
        this.logger.warn(`Received ACK for unknown command: ${command_id}`);
        return;
      }

      // Clear timeout
      clearTimeout(activeCommand.timeout);
      this.activeCommands.delete(command_id);

      // Create result
      const result: MqttCommandResult = {
        command_id,
        device_id,
        command,
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        error: status !== 'SUCCESS' ? error || `Command failed with status: ${status}` : undefined,
        ack_response: ackResponse,
        sent_at: activeCommand.sent_at,
        ack_received_at: new Date(),
      };

      // Emit events
      if (status === 'SUCCESS') {
        this.emit('command-success', result);
      } else {
        this.emit('command-failed', result);
      }

      // Resolve promise
      activeCommand.resolve(result);
    } catch (error) {
      this.logger.error('Failed to parse ACK response:', error);
      this.emit('command-error', { error: error.message });
    }
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `cmd-${timestamp}-${random}`;
  }
}
