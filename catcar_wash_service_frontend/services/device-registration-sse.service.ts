import { TypedSSEClient } from './bases/sse-client';
import type { DeviceRegistrationSession } from './apis/device-api.service';

// Define event map for device registration SSE
interface DeviceRegistrationEventMap {
  initial: { type: string; data: { sessions: DeviceRegistrationSession[] } };
  registration_requested: { type: string; data: DeviceRegistrationSession };
  registration_completed: { type: string; data: DeviceRegistrationSession };
  registration_cancelled: { type: string; data: DeviceRegistrationSession };
  registration_expired: { type: string; data: DeviceRegistrationSession };
  heartbeat: { type: string; data: { timestamp: string } };
}

export interface DeviceRegistrationSSECallbacks {
  onInitial?: (sessions: DeviceRegistrationSession[]) => void;
  onRegistrationRequested?: (data: DeviceRegistrationSession) => void;
  onRegistrationCompleted?: (data: DeviceRegistrationSession) => void;
  onRegistrationCancelled?: (data: DeviceRegistrationSession) => void;
  onRegistrationExpired?: (data: DeviceRegistrationSession) => void;
  onHeartbeat?: (data: { timestamp: string }) => void;
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export class DeviceRegistrationSSEService extends TypedSSEClient<DeviceRegistrationEventMap> {
  constructor(baseURL: string) {
    super({
      url: `${baseURL}/api/v1/devices/scan`,
      withCredentials: false,
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
      this.on('initial', (data) => {
        console.log('Initial event received:', data);
        console.log('Sessions data:', data.data?.sessions);
        callbacks.onInitial!(data.data?.sessions || []);
      });
    }
    
    if (callbacks.onRegistrationRequested) {
      this.on('registration_requested', (data) => {
        console.log('Registration requested event:', data);
        callbacks.onRegistrationRequested!(data.data || data);
      });
    }
    
    if (callbacks.onRegistrationCompleted) {
      this.on('registration_completed', (data) => {
        console.log('Registration completed event:', data);
        callbacks.onRegistrationCompleted!(data.data || data);
      });
    }
    
    if (callbacks.onRegistrationCancelled) {
      this.on('registration_cancelled', (data) => {
        console.log('Registration cancelled event:', data);
        callbacks.onRegistrationCancelled!(data.data || data);
      });
    }
    
    if (callbacks.onRegistrationExpired) {
      this.on('registration_expired', (data) => {
        console.log('Registration expired event:', data);
        callbacks.onRegistrationExpired!(data.data || data);
      });
    }
    
    if (callbacks.onHeartbeat) {
      this.on('heartbeat', (data) => {
        console.log('Heartbeat event:', data);
        callbacks.onHeartbeat!(data.data || data);
      });
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
