import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventManagerService, SSEEventHandler } from '../event-manager.service';
import { DeviceRegistrationService, DeviceRegistrationSession } from './device-registration.service';

// Define event types for device registration domain
export interface DeviceRegistrationEventMap {
  requested: DeviceRegistrationSession;
  completed: DeviceRegistrationSession;
  cancelled: { pin: string; timestamp: Date };
  expired: { pin: string; timestamp: Date };
}

export interface IDeviceRegistrationEventAdapter {
  emitRegistrationRequested(session: DeviceRegistrationSession): void;
  emitRegistrationCompleted(session: DeviceRegistrationSession): void;
  emitRegistrationCancelled(pin: string): void;
  emitRegistrationExpired(pin: string): void;
}

@Injectable()
export class DeviceRegistrationEventAdapter implements IDeviceRegistrationEventAdapter {
  private readonly logger = new Logger(DeviceRegistrationEventAdapter.name);
  private domainEmitter;

  constructor(
    private readonly eventManager: EventManagerService,
    private readonly deviceRegistrationService: DeviceRegistrationService,
  ) {
    // Create typed domain emitter
    this.domainEmitter = this.eventManager.createDomainEmitter<DeviceRegistrationEventMap>('device.registration');

    // Set this adapter as the event emitter for the service
    this.deviceRegistrationService.setAdapter(this);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Emit device registration events
   */
  emitRegistrationRequested(session: DeviceRegistrationSession): void {
    this.domainEmitter.emit('requested', session);
  }

  emitRegistrationCompleted(session: DeviceRegistrationSession): void {
    this.domainEmitter.emit('completed', session);
  }

  emitRegistrationCancelled(pin: string): void {
    this.domainEmitter.emit('cancelled', { pin, timestamp: new Date() });
  }

  emitRegistrationExpired(pin: string): void {
    this.domainEmitter.emit('expired', { pin, timestamp: new Date() });
  }

  /**
   * Create SSE Observable for device registration events
   */
  createSSEStream(): Observable<{ data: string }> {
    const eventHandlers: SSEEventHandler[] = [
      {
        eventName: 'device.registration.requested',
        handler: (data: DeviceRegistrationSession) => ({
          type: 'registration_requested',
          data: {
            pin: data.pin,
            chip_id: data.chip_id,
            mac_address: data.mac_address,
            firmware_version: data.firmware_version,
            created_at: data.created_at,
            expires_at: data.expires_at,
          },
        }),
      },
      {
        eventName: 'device.registration.completed',
        handler: (data: DeviceRegistrationSession) => ({
          type: 'registration_completed',
          data: {
            pin: data.pin,
            chip_id: data.chip_id,
            mac_address: data.mac_address,
            firmware_version: data.firmware_version,
            device_id: data.device_id,
            created_at: data.created_at,
            expires_at: data.expires_at,
          },
        }),
      },
      {
        eventName: 'device.registration.cancelled',
        handler: (data: { pin: string; timestamp: Date }) => ({
          type: 'registration_cancelled',
          data: {
            pin: data.pin,
            timestamp: data.timestamp,
          },
        }),
      },
      {
        eventName: 'device.registration.expired',
        handler: (data: { pin: string; timestamp: Date }) => ({
          type: 'registration_expired',
          data: {
            pin: data.pin,
            timestamp: data.timestamp,
          },
        }),
      },
    ];

    return this.eventManager.createSSEObservable(
      eventHandlers,
      // Initial data provider
      () => {
        const activeSessions = this.deviceRegistrationService.getActiveSessions();
        return {
          type: 'initial',
          data: {
            sessions: activeSessions.map((session) => ({
              pin: session.pin,
              chip_id: session.chip_id,
              mac_address: session.mac_address,
              firmware_version: session.firmware_version,
              device_id: session.device_id,
              created_at: session.created_at,
              expires_at: session.expires_at,
            })),
            timestamp: new Date(),
          },
        };
      },
      // Heartbeat every 30 seconds
      30000,
    );
  }

  /**
   * Set up event listeners for device registration service
   */
  setupEventListeners(): void {
    // TODO: Add event listeners for device registration service events
  }

  /**
   * Get registration event statistics
   */
  getStats() {
    const allStats = this.eventManager.getEventStats();
    const registrationStats = Object.entries(allStats)
      .filter(([eventName]) => eventName.startsWith('device.registration.'))
      .reduce(
        (acc, [eventName, count]) => {
          acc[eventName] = count;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalListeners: Object.values(registrationStats).reduce((sum, count) => sum + count, 0),
      eventBreakdown: registrationStats,
    };
  }

  /**
   * Health check for device registration events
   */
  healthCheck() {
    const stats = this.getStats();
    const eventSystemHealth = this.eventManager.healthCheck();
    const activeSessions = this.deviceRegistrationService.getActiveSessions();

    return {
      status: eventSystemHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      event_system: eventSystemHealth,
      registration_stats: stats,
      active_sessions: {
        count: activeSessions.length,
        sessions: activeSessions.map((session) => ({
          pin: session.pin,
          chip_id: session.chip_id,
          mac_address: session.mac_address,
          device_id: session.device_id,
          created_at: session.created_at,
          expires_at: session.expires_at,
          is_expired: new Date() > session.expires_at,
        })),
      },
      timestamp: new Date(),
    };
  }
}
