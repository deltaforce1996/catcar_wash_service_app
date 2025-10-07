import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventManagerService, SSEEventHandler } from '../event-manager.service';
import { MqttCommandManagerService } from './mqtt-command-manager.service';
import { MqttCommandAckResponse } from '../../types/mqtt-command-manager.types';

// Define event types for MQTT command domain
export interface MqttCommandEventMap {
  'command-sent': MqttCommandAckResponse<any>;
  'command-success': MqttCommandAckResponse<any>;
  'command-failed': MqttCommandAckResponse<any>;
  'command-timeout': MqttCommandAckResponse<any>;
  'command-error': MqttCommandAckResponse<any>;
}

export interface IMqttCommandEventAdapter {
  emitCommandSent(response: MqttCommandAckResponse<any>): void;
  emitCommandSuccess(response: MqttCommandAckResponse<any>): void;
  emitCommandFailed(response: MqttCommandAckResponse<any>): void;
  emitCommandTimeout(response: MqttCommandAckResponse<any>): void;
  emitCommandError(response: MqttCommandAckResponse<any>): void;
}

@Injectable()
export class MqttCommandEventAdapter implements IMqttCommandEventAdapter {
  private readonly logger = new Logger(MqttCommandEventAdapter.name);
  private domainEmitter;

  constructor(
    private readonly eventManager: EventManagerService,
    private readonly mqttCommandManager: MqttCommandManagerService,
  ) {
    // Create typed domain emitter
    this.domainEmitter = this.eventManager.createDomainEmitter<MqttCommandEventMap>('mqtt-command');

    // Set this adapter as the event emitter for the service
    this.mqttCommandManager.setAdapter(this);

    // Set up event listeners for MQTT command manager events
    this.setupEventListeners();
  }

  /**
   * Emit MQTT command events
   */
  emitCommandSent(response: MqttCommandAckResponse<any>): void {
    this.domainEmitter.emit('command-sent', response);
  }

  emitCommandSuccess(response: MqttCommandAckResponse<any>): void {
    this.domainEmitter.emit('command-success', response);
  }

  emitCommandFailed(response: MqttCommandAckResponse<any>): void {
    this.domainEmitter.emit('command-failed', response);
  }

  emitCommandTimeout(response: MqttCommandAckResponse<any>): void {
    this.domainEmitter.emit('command-timeout', response);
  }

  emitCommandError(response: MqttCommandAckResponse<any>): void {
    this.domainEmitter.emit('command-error', response);
  }

  /**
   * Create SSE Observable for MQTT command events
   */
  createSSEStream(): Observable<{ data: string }> {
    const eventHandlers: SSEEventHandler[] = [
      {
        eventName: 'mqtt-command.command-sent',
        handler: (data: MqttCommandAckResponse<any>) => ({
          type: 'command_sent',
          data: {
            command_id: data.command_id,
            device_id: data.device_id,
            command: data.command,
            status: data.status,
            timestamp: data.timestamp,
          },
        }),
      },
      {
        eventName: 'mqtt-command.command-success',
        handler: (data: MqttCommandAckResponse<any>) => ({
          type: 'command_success',
          data: {
            command_id: data.command_id,
            device_id: data.device_id,
            command: data.command,
            status: data.status,
            results: data.results,
            timestamp: data.timestamp,
          },
        }),
      },
      {
        eventName: 'mqtt-command.command-failed',
        handler: (data: MqttCommandAckResponse<any>) => ({
          type: 'command_failed',
          data: {
            command_id: data.command_id,
            device_id: data.device_id,
            command: data.command,
            status: data.status,
            error: data.error,
            timestamp: data.timestamp,
          },
        }),
      },
      {
        eventName: 'mqtt-command.command-timeout',
        handler: (data: MqttCommandAckResponse<any>) => ({
          type: 'command_timeout',
          data: {
            command_id: data.command_id,
            device_id: data.device_id,
            command: data.command,
            status: data.status,
            error: data.error,
            timestamp: data.timestamp,
          },
        }),
      },
      {
        eventName: 'mqtt-command.command-error',
        handler: (data: MqttCommandAckResponse<any>) => ({
          type: 'command_error',
          data: {
            command_id: data.command_id,
            device_id: data.device_id,
            command: data.command,
            status: data.status,
            error: data.error,
            timestamp: data.timestamp,
          },
        }),
      },
    ];

    return this.eventManager.createSSEObservable(
      eventHandlers,
      // Initial data provider
      () => {
        return {
          type: 'initial',
          data: {
            message: 'MQTT Command Event Stream initialized',
            timestamp: new Date(),
            supported_commands: ['APPLY_CONFIG', 'RESTART', 'UPDATE_FIRMWARE', 'RESET_CONFIG'],
          },
        };
      },
      // Heartbeat every 30 seconds
      30000,
    );
  }

  /**
   * Set up event listeners for MQTT command manager
   */
  setupEventListeners(): void {
    // TODO: Add event listeners for MQTT command manager events
  }

  /**
   * Get MQTT command event statistics
   */
  getStats() {
    const allStats = this.eventManager.getEventStats();
    const commandStats = Object.entries(allStats)
      .filter(([eventName]) => eventName.startsWith('mqtt-command.'))
      .reduce(
        (acc, [eventName, count]) => {
          acc[eventName] = count;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalListeners: Object.values(commandStats).reduce((sum, count) => sum + count, 0),
      eventBreakdown: commandStats,
      supportedCommands: ['APPLY_CONFIG', 'RESTART', 'UPDATE_FIRMWARE', 'RESET_CONFIG'],
    };
  }

  /**
   * Health check for MQTT command events
   */
  healthCheck() {
    const stats = this.getStats();
    const eventSystemHealth = this.eventManager.healthCheck();

    return {
      status: eventSystemHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      event_system: eventSystemHealth,
      command_stats: stats,
      timestamp: new Date(),
    };
  }
}
