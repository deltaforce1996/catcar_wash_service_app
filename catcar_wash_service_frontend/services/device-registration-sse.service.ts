import { TypedSSEClient } from './bases/sse-client';
import type { DeviceRegistrationSession, DeviceRegistrationEvent } from './apis/device-api.service';

// Define event map for device registration SSE
interface DeviceRegistrationEventMap {
  initial: { sessions: DeviceRegistrationSession[] };
  registration_requested: DeviceRegistrationEvent;
  registration_completed: DeviceRegistrationEvent;
  registration_cancelled: { pin: string; timestamp: string };
  registration_expired: { pin: string; timestamp: string };
  heartbeat: { timestamp: string };
}

export interface DeviceRegistrationSSECallbacks {
  onInitial?: (sessions: DeviceRegistrationSession[]) => void;
  onRegistrationRequested?: (data: DeviceRegistrationEvent) => void;
  onRegistrationCompleted?: (data: DeviceRegistrationEvent) => void;
  onRegistrationCancelled?: (data: { pin: string; timestamp: string }) => void;
  onRegistrationExpired?: (data: { pin: string; timestamp: string }) => void;
  onHeartbeat?: (data: { timestamp: string }) => void;
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export class DeviceRegistrationSSEService extends TypedSSEClient<DeviceRegistrationEventMap> {
  constructor(baseURL: string) {
    super({
      url: `${baseURL}/api/v1/devices/scan`,
      withCredentials: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
    });
  }

  /**
   * Start device registration scanning
   */
  startScanning(callbacks: DeviceRegistrationSSECallbacks): void {
    // Set up event listeners
    if (callbacks.onInitial) {
      this.on('initial', (data) => callbacks.onInitial!(data.sessions));
    }
    
    if (callbacks.onRegistrationRequested) {
      this.on('registration_requested', callbacks.onRegistrationRequested);
    }
    
    if (callbacks.onRegistrationCompleted) {
      this.on('registration_completed', callbacks.onRegistrationCompleted);
    }
    
    if (callbacks.onRegistrationCancelled) {
      this.on('registration_cancelled', callbacks.onRegistrationCancelled);
    }
    
    if (callbacks.onRegistrationExpired) {
      this.on('registration_expired', callbacks.onRegistrationExpired);
    }
    
    if (callbacks.onHeartbeat) {
      this.on('heartbeat', callbacks.onHeartbeat);
    }

    // Set general callbacks
    this.setCallbacks({
      onOpen: callbacks.onOpen,
      onError: callbacks.onError,
      onClose: callbacks.onClose,
    });

    // Connect
    this.connect();
  }

  /**
   * Stop device registration scanning
   */
  stopScanning(): void {
    this.disconnect();
  }

  /**
   * Check if currently scanning
   */
  get isScanning(): boolean {
    return this.isConnected;
  }
}
