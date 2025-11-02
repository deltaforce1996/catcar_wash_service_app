import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp?: Date;
}

export interface SSEEventHandler {
  eventName: string;
  handler: (data: any) => SSEEvent | null;
}

@Injectable()
export class EventManagerService {
  private readonly logger = new Logger(EventManagerService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit an event
   */
  emit(eventName: string, data: any): void {
    this.logger.debug(`Emitting event: ${eventName}`, data);
    this.eventEmitter.emit(eventName, data);
  }

  /**
   * Listen to an event
   */
  on(eventName: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(eventName, listener);
  }

  /**
   * Remove event listener
   */
  off(eventName: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(eventName, listener);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName?: string): void {
    this.eventEmitter.removeAllListeners(eventName);
  }

  /**
   * Create SSE Observable for multiple events
   */
  createSSEObservable(
    eventHandlers: SSEEventHandler[],
    initialData?: () => SSEEvent | SSEEvent[] | null,
    heartbeatInterval?: number,
  ): Observable<{ data: string }> {
    return new Observable((observer) => {
      let isClientConnected = true;
      let cleanupCalled = false;
      let heartbeatTimer: NodeJS.Timeout | null = null;
      const listeners: Array<{ eventName: string; handler: any }> = [];

      // Helper function to safely cleanup
      const performCleanup = () => {
        if (cleanupCalled) return;
        cleanupCalled = true;
        isClientConnected = false;

        try {
          // Remove all event listeners
          listeners.forEach(({ eventName, handler }) => {
            this.eventEmitter.off(eventName, handler);
          });

          // Clear heartbeat timer
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          this.logger.debug('SSE Observable cleaned up');
        } catch (error) {
          this.logger.error('Error during SSE cleanup:', error);
        }
      };

      // Send initial data
      if (initialData) {
        const initial = initialData();
        if (initial) {
          if (Array.isArray(initial)) {
            initial.forEach((event) => {
              if (!isClientConnected) return;
              try {
                observer.next({ data: JSON.stringify(event) });
              } catch (error) {
                // Connection closed while sending initial data
                this.logger.warn('Client disconnected while sending initial data', error);
                performCleanup();
                observer.complete();
                return;
              }
            });
          } else {
            if (!isClientConnected) return;
            try {
              observer.next({ data: JSON.stringify(initial) });
            } catch (error) {
              // Connection closed while sending initial data
              this.logger.warn('Client disconnected while sending initial data', error);
              performCleanup();
              observer.complete();
              return;
            }
          }
        }
      }

      // Set up event handlers
      eventHandlers.forEach(({ eventName, handler }) => {
        const eventHandler = (data: any) => {
          if (!isClientConnected) return;
          try {
            const sseEvent = handler(data);
            if (sseEvent) {
              observer.next({ data: JSON.stringify(sseEvent) });
            }
          } catch (error) {
            // Connection closed - stop sending
            this.logger.warn(`Client disconnected while handling event ${eventName}`, error);
            performCleanup();
          }
        };

        this.eventEmitter.on(eventName, eventHandler);
        listeners.push({ eventName, handler: eventHandler });
      });

      // Set up heartbeat if specified
      if (heartbeatInterval && heartbeatInterval > 0) {
        heartbeatTimer = setInterval(() => {
          if (!isClientConnected) {
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }
            return;
          }

          try {
            observer.next({
              data: JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date(),
              }),
            });
          } catch (error) {
            // ⭐ Heartbeat error = connection ปิดแล้ว - cleanup immediately
            this.logger.warn('Heartbeat failed - client disconnected', error);
            performCleanup();
            observer.complete(); // Force cleanup
          }
        }, heartbeatInterval);
      }

      // Cleanup function
      return () => {
        performCleanup();
      };
    });
  }

  /**
   * Create typed event emitter for specific domain
   */
  createDomainEmitter<T extends Record<string, any>>(domain: string) {
    return {
      emit: <K extends keyof T>(eventType: K, data: T[K]) => {
        const eventName = `${domain}.${String(eventType)}`;
        this.emit(eventName, data);
      },

      on: <K extends keyof T>(eventType: K, handler: (data: T[K]) => void) => {
        const eventName = `${domain}.${String(eventType)}`;
        this.on(eventName, handler);
      },

      off: <K extends keyof T>(eventType: K, handler: (data: T[K]) => void) => {
        const eventName = `${domain}.${String(eventType)}`;
        this.off(eventName, handler);
      },
    };
  }

  /**
   * Get event statistics
   */
  getEventStats(): Record<string, number> {
    const events = this.eventEmitter.eventNames();
    const stats: Record<string, number> = {};

    events.forEach((eventName) => {
      const listeners = this.eventEmitter.listeners(eventName);
      stats[String(eventName)] = listeners.length;
    });

    return stats;
  }

  /**
   * Health check for event system
   */
  healthCheck(): { status: 'healthy' | 'unhealthy'; stats: Record<string, number> } {
    try {
      const stats = this.getEventStats();
      return {
        status: 'healthy',
        stats,
      };
    } catch (error) {
      this.logger.error('Event system health check failed:', error);
      return {
        status: 'unhealthy',
        stats: {},
      };
    }
  }
}
