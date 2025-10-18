import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MqttService, type MqttMessage } from '../../modules/mqtt/mqtt.service';
import {
  MqttCommandPayload,
  MqttCommandAckResponse,
  MqttCommandType,
  ActiveCommand,
  CommandConfig,
  FirmwarePayload,
} from '../../types/mqtt-command-manager.types';
import { IMqttCommandEventAdapter } from './mqtt-command-event-adepter';

@Injectable()
export class MqttCommandManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttCommandManagerService.name);
  private readonly activeCommands = new Map<string, ActiveCommand>();
  private ackMessageHandler: ((message: MqttMessage) => void) | null = null;
  private eventAdapter: IMqttCommandEventAdapter;

  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly defaultRetryAttempts = 3; // 3 attempts
  private readonly defaultRetryDelay = 1000; // 1 second between retries

  constructor(private readonly mqttService: MqttService) {}

  async onModuleInit() {
    // Subscribe to all ACK responses from devices
    await this.mqttService.subscribe('server/+/ack', 1);

    // Register callback for ACK messages
    this.ackMessageHandler = (message: MqttMessage) => {
      this.handleAckResponse(message);
    };
    this.mqttService.onMessage('server/+/ack', this.ackMessageHandler);

    this.logger.log('✅ MQTT Command Manager Service initialized');
  }

  onModuleDestroy() {
    // Unregister callback handler
    if (this.ackMessageHandler) {
      this.mqttService.offMessage('server/+/ack', this.ackMessageHandler);
      this.ackMessageHandler = null;
    }

    // Clean up all active commands
    for (const [, activeCommand] of this.activeCommands) {
      clearTimeout(activeCommand.timeout);
      activeCommand.reject(new Error('Service shutting down'));
    }
    this.activeCommands.clear();
    this.logger.log('🛑 MQTT Command Manager Service destroyed');
  }

  /**
   * Send APPLY_CONFIG command to device
   */
  async applyConfig(deviceId: string, configs: CommandConfig): Promise<MqttCommandAckResponse<CommandConfig>> {
    return this.sendCommand(deviceId, 'APPLY_CONFIG', configs, {
      require_ack: true,
    });
  }

  /**
   * Send RESTART command to device
   */
  async restartDevice(deviceId: string, delaySeconds: number = 5): Promise<MqttCommandAckResponse<any>> {
    return this.sendCommand(
      deviceId,
      'RESTART',
      { delay_seconds: delaySeconds },
      {
        require_ack: true,
      },
    );
  }

  /**
   * Send UPDATE_FIRMWARE command to device
   */
  async updateFirmware(
    deviceId: string,
    firmwareInfo: FirmwarePayload,
  ): Promise<MqttCommandAckResponse<FirmwarePayload>> {
    return this.sendCommand(deviceId, 'UPDATE_FIRMWARE', firmwareInfo, {
      require_ack: true,
    });
  }

  /**
   * Send RESET_CONFIG command to device
   */
  async resetConfig(deviceId: string, configs: CommandConfig): Promise<MqttCommandAckResponse<CommandConfig>> {
    return this.sendCommand(deviceId, 'RESET_CONFIG', configs, {
      require_ack: true,
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
  ): Promise<MqttCommandAckResponse<any>> {
    return this.sendCommand(deviceId, command as MqttCommandType, payload, {
      require_ack: requireAck,
    });
  }

  /**
   * Send payment status to device
   */
  public async sendPaymentStatus(chargeId: string, status: string): Promise<MqttCommandAckResponse<any>> {
    const commandId = this.generateCommandId();
    const topic = `device/${chargeId}/payment-status`;
    const timestamp = Date.now();
    const mqttPayload: MqttCommandPayload<any> = {
      command_id: commandId,
      command: 'PAYMENT',
      require_ack: false,
      payload: { chargeId, status: status as 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' },
      timestamp,
    };
    try {
      await this.mqttService.publishJson(topic, mqttPayload, { qos: 1 });
      this.logger.log(`💳 Payment status sent: ${commandId} (${chargeId}) to device: ${chargeId}`);
      return {
        command_id: commandId,
        device_id: chargeId,
        command: 'PAYMENT',
        status: 'SENT',
        timestamp,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send payment status: ${commandId} (${chargeId}) to device: ${chargeId}`, error);
      return {
        command_id: commandId,
        device_id: chargeId,
        command: 'PAYMENT',
        status: 'ERROR',
        error: error.message,
        timestamp,
      };
    }
  }

  /**
   * Core method to send MQTT command
   */
  private async sendCommand<T, R>(
    deviceId: string,
    command: MqttCommandType,
    payload: T,
    options: {
      require_ack: boolean;
    },
  ): Promise<MqttCommandAckResponse<R>> {
    const commandId = this.generateCommandId();
    const topic = `device/${deviceId}/command`;
    const timestamp = Date.now();

    const mqttPayload: MqttCommandPayload<T> = {
      command_id: commandId,
      command,
      require_ack: options.require_ack,
      payload,
      timestamp,
    };

    try {
      // Send MQTT message
      await this.mqttService.publishJson(topic, mqttPayload, { qos: 1 });

      this.logger.log(`📤 Command sent: ${commandId} (${command}) to device: ${deviceId}`);

      const result: MqttCommandAckResponse<R> = {
        command_id: commandId,
        device_id: deviceId,
        command,
        status: 'SENT',
        timestamp: timestamp,
      };

      // For fire-and-forget commands, return immediately
      if (!options.require_ack) {
        this.eventAdapter?.emitCommandSent(result);
        return result;
      }

      // For ACK commands, set up timeout and wait for response
      return new Promise<MqttCommandAckResponse<R>>((resolve, reject) => {
        const timeout = this.defaultTimeout;
        const timeoutHandle = setTimeout(() => {
          this.activeCommands.delete(commandId);
          const timeoutResult: MqttCommandAckResponse<R> = {
            ...result,
            status: 'TIMEOUT',
            error: 'Device did not respond within timeout period',
            timestamp: timestamp,
          };

          this.logger.warn(`⏱️ Command timeout: ${commandId} (${command}) to device: ${deviceId}`);
          this.eventAdapter?.emitCommandTimeout(timeoutResult);
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
          sent_at: timestamp,
        });

        this.eventAdapter?.emitCommandSent(result);
      });
    } catch (error) {
      const errorResult: MqttCommandAckResponse<R> = {
        command_id: commandId,
        device_id: deviceId,
        command,
        status: 'ERROR',
        error: error.message,
        timestamp: Date.now(),
      };

      this.logger.error(`❌ Failed to send command: ${commandId} (${command}) to device: ${deviceId}`, error);
      this.eventAdapter?.emitCommandError(errorResult);
      return errorResult;
    }
  }

  /**
   * Handle ACK response from device
   */
  private handleAckResponse(message: MqttMessage): void {
    try {
      const payloadStr = String(message.payload);
      const ackResponse: any = JSON.parse(payloadStr);

      if (!ackResponse.command_id) {
        this.logger.warn(`⚠️ Invalid ACK response: ${payloadStr}`);
        return;
      }

      const { command_id, device_id, command, status, error }: any = ackResponse;

      this.logger.log(
        `📥 ACK received: ${String(command_id)} (${String(command)}) from device: ${String(device_id)} - Status: ${String(status)}`,
      );

      const activeCommand = this.activeCommands.get(String(command_id));

      if (!activeCommand) {
        this.logger.warn(`⚠️ Received ACK for unknown command: ${String(command_id)}`);
        return;
      }

      // Clear timeout
      clearTimeout(activeCommand.timeout);
      this.activeCommands.delete(String(command_id));

      // Create result
      const result: MqttCommandAckResponse<any> = {
        command_id,
        device_id,
        command,
        status: status,
        error: status !== 'SUCCESS' ? error || `Command failed with status: ${status}` : undefined,
        results: ackResponse,
        timestamp: Date.now(),
      };

      // Emit events
      if (status === 'SUCCESS') {
        this.eventAdapter?.emitCommandSuccess(result);
      } else {
        this.eventAdapter?.emitCommandFailed(result);
      }

      // Resolve promise
      activeCommand.resolve(result);
    } catch (error) {
      this.logger.error('❌ Failed to parse ACK response:', error);
      this.eventAdapter?.emitCommandError({
        command_id: 'unknown',
        device_id: 'unknown',
        command: 'UNKNOWN' as MqttCommandType,
        status: 'ERROR',
        error: error.message,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Set event adapter for this service
   */
  setAdapter(adapter: IMqttCommandEventAdapter): void {
    this.eventAdapter = adapter;
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
