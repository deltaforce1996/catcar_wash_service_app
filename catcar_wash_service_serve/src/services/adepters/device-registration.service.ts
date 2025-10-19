import { Injectable, Logger } from '@nestjs/common';
import { IDeviceRegistrationEventAdapter } from './device-registration-event.adapter';

export interface DeviceRegistrationSession {
  pin: string;
  chip_id: string;
  mac_address: string;
  firmware_version: string;
  device_id: string;
  created_at: Date;
  expires_at: Date;
}

@Injectable()
export class DeviceRegistrationService {
  private readonly logger = new Logger(DeviceRegistrationService.name);
  private readonly sessions = new Map<string, DeviceRegistrationSession>();
  private readonly pinToDeviceMap = new Map<string, string>(); // pin -> device_id mapping
  private readonly SESSION_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  private adapter: IDeviceRegistrationEventAdapter | null = null;

  constructor() {
    // Clean up expired sessions every minute
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 1000);
  }

  /**
   * Generate a unique 4-digit PIN code
   */
  private generatePin(): string {
    let pin: string;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.sessions.has(pin));
    return pin;
  }

  /**
   * Create a new device registration session
   */
  createRegistrationSession(
    chip_id: string,
    mac_address: string,
    firmware_version: string,
    device_id: string,
  ): DeviceRegistrationSession {
    const pin = this.generatePin();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);

    const session: DeviceRegistrationSession = {
      pin,
      chip_id,
      mac_address,
      firmware_version,
      device_id,
      created_at: now,
      expires_at: expiresAt,
    };

    // Store session
    this.sessions.set(pin, session);

    this.logger.log(`Created registration session for device ${chip_id} with PIN ${pin}`);

    // Emit SSE event to notify ALL web clients
    this.adapter?.emitRegistrationRequested(session);

    return session;
  }

  /**
   * Get registration session by PIN
   */
  getSessionByPin(pin: string): DeviceRegistrationSession | null {
    const session = this.sessions.get(pin);
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expires_at) {
      this.sessions.delete(pin);
      this.pinToDeviceMap.delete(pin);
      return null;
    }

    return session;
  }

  /**
   * Update session with device_id after successful registration
   */
  updateSessionWithDeviceId(pin: string, device_id: string): boolean {
    const session = this.getSessionByPin(pin);
    if (!session) {
      return false;
    }

    session.device_id = device_id;
    this.pinToDeviceMap.set(pin, device_id);

    // Emit SSE event to notify web clients of successful registration
    this.adapter?.emitRegistrationCompleted(session);

    this.logger.log(`Device ${device_id} registered successfully with PIN ${pin}`);

    return true;
  }

  /**
   * Get all active registration sessions
   */
  getActiveSessions(): DeviceRegistrationSession[] {
    const now = new Date();
    const activeSessions: DeviceRegistrationSession[] = [];

    for (const [pin, session] of this.sessions.entries()) {
      void pin;
      if (now <= session.expires_at) {
        activeSessions.push(session);
      }
    }

    return activeSessions;
  }

  /**
   * Remove a registration session
   */
  removeSession(sessionPin: string): boolean {
    const removed = this.sessions.delete(sessionPin);
    this.pinToDeviceMap.delete(sessionPin);

    if (removed) {
      this.logger.log(`Removed registration session with PIN ${sessionPin}`);

      // Emit SSE event to notify web clients
      this.adapter?.emitRegistrationCancelled(sessionPin);
    }

    return removed;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredPins: string[] = [];

    for (const [pin, session] of this.sessions.entries()) {
      if (now > session.expires_at) {
        expiredPins.push(pin);
      }
    }

    for (const expiredPin of expiredPins) {
      this.sessions.delete(expiredPin);
      this.pinToDeviceMap.delete(expiredPin);
      this.logger.log(`Expired registration session with PIN ${expiredPin}`);

      // Emit SSE event to notify web clients
      this.adapter?.emitRegistrationExpired(expiredPin);
    }

    if (expiredPins.length > 0) {
      this.logger.log(`Cleaned up ${expiredPins.length} expired registration sessions`);
    }
  }

  /**
   * Set adapter reference (called by adapter to avoid circular dependency)
   */
  setAdapter(adapter: IDeviceRegistrationEventAdapter): void {
    this.adapter = adapter;
  }
}
