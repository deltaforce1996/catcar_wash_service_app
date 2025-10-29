import { Injectable, Logger } from '@nestjs/common';
import { EventManagerService } from '../event-manager.service';
import { DeviceEventLogsService } from './device-event-logs.service';
import { SqlScriptService } from '../sql-script.service';

// Event map interface for typed events
export interface DeviceEventLogsEventMap {
  'events-uploaded': {
    device_id: string;
    count: number;
    timestamp: Date;
  };
  'view-refreshed': {
    device_id: string;
    views: string[];
    duration_ms: number;
    timestamp: Date;
  };
  'view-refresh-failed': {
    device_id: string;
    error: string;
    timestamp: Date;
  };
}

// Adapter interface for the service to use
export interface IDeviceEventLogsEventAdapter {
  emitEventsUploaded(payload: DeviceEventLogsEventMap['events-uploaded']): void;
  emitViewRefreshed(payload: DeviceEventLogsEventMap['view-refreshed']): void;
  emitViewRefreshFailed(payload: DeviceEventLogsEventMap['view-refresh-failed']): void;
}

@Injectable()
export class DeviceEventLogsEventAdapter implements IDeviceEventLogsEventAdapter {
  private readonly logger = new Logger(DeviceEventLogsEventAdapter.name);
  private readonly domainEmitter;

  constructor(
    private readonly eventManager: EventManagerService,
    private readonly deviceEventLogsService: DeviceEventLogsService,
    private readonly sqlScriptService: SqlScriptService,
  ) {
    // Create typed domain emitter with domain prefix 'device.events'
    this.domainEmitter = this.eventManager.createDomainEmitter<DeviceEventLogsEventMap>('device.events');

    // Set this adapter as the event emitter for the service
    this.deviceEventLogsService.setAdapter(this);

    // Set up event listeners
    this.setupEventListeners();

    this.logger.log('DeviceEventLogsEventAdapter initialized');
  }

  /**
   * Emit event when device events are uploaded
   */
  emitEventsUploaded(payload: DeviceEventLogsEventMap['events-uploaded']): void {
    this.domainEmitter.emit('events-uploaded', payload);
    this.logger.log(
      `Event emitted: device.events.events-uploaded - Device: ${payload.device_id}, Count: ${payload.count}`,
    );
  }

  /**
   * Emit event when materialized views are refreshed successfully
   */
  emitViewRefreshed(payload: DeviceEventLogsEventMap['view-refreshed']): void {
    this.domainEmitter.emit('view-refreshed', payload);
    this.logger.log(
      `Event emitted: device.events.view-refreshed - Device: ${payload.device_id}, Duration: ${payload.duration_ms}ms`,
    );
  }

  /**
   * Emit event when materialized view refresh fails
   */
  emitViewRefreshFailed(payload: DeviceEventLogsEventMap['view-refresh-failed']): void {
    this.domainEmitter.emit('view-refresh-failed', payload);
    this.logger.error(
      `Event emitted: device.events.view-refresh-failed - Device: ${payload.device_id}, Error: ${payload.error}`,
    );
  }

  /**
   * Set up event listeners for internal event handling
   */
  private setupEventListeners(): void {
    // Listen to events-uploaded and trigger materialized view refresh
    this.domainEmitter.on('events-uploaded', async (data: DeviceEventLogsEventMap['events-uploaded']) => {
      this.logger.log(
        `Event received: device.events.events-uploaded - Device: ${data.device_id}, Count: ${data.count}`,
      );

      try {
        const startTime = Date.now();
        await this.sqlScriptService.refreshAllViews();
        const duration = Date.now() - startTime;

        this.emitViewRefreshed({
          device_id: data.device_id,
          views: [
            'mv_device_payments_hour',
            'mv_device_payments_day',
            'mv_device_payments_month',
            'mv_device_payments_year',
          ],
          duration_ms: duration,
          timestamp: new Date(),
        });

        this.logger.log(
          `Successfully refreshed materialized views after device events upload - Device: ${data.device_id}, Duration: ${duration}ms`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.emitViewRefreshFailed({
          device_id: data.device_id,
          error: errorMessage,
          timestamp: new Date(),
        });

        this.logger.error(
          `Failed to refresh materialized views after device events upload - Device: ${data.device_id}`,
          error instanceof Error ? error.stack : String(error),
        );
        // Fire-and-forget: Don't throw the error to avoid blocking the event flow
      }
    });
  }

  /**
   * Get statistics about events (for monitoring/debugging)
   */
  getStats() {
    return {
      domain: 'device.events',
      events: ['events-uploaded', 'view-refreshed', 'view-refresh-failed'],
      active: true,
    };
  }

  /**
   * Health check for the adapter
   */
  healthCheck() {
    return {
      status: 'healthy',
      adapter: 'DeviceEventLogsEventAdapter',
      timestamp: new Date(),
    };
  }
}
