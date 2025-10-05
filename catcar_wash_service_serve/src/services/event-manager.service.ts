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
      // Send initial data
      if (initialData) {
        const initial = initialData();
        if (initial) {
          if (Array.isArray(initial)) {
            initial.forEach((event) => {
              observer.next({ data: JSON.stringify(event) });
            });
          } else {
            observer.next({ data: JSON.stringify(initial) });
          }
        }
      }

      // Set up event handlers
      const listeners: Array<{ eventName: string; handler: any }> = [];

      eventHandlers.forEach(({ eventName, handler }) => {
        const eventHandler = (data: any) => {
          try {
            const sseEvent = handler(data);
            if (sseEvent) {
              observer.next({ data: JSON.stringify(sseEvent) });
            }
          } catch (error) {
            this.logger.error(`Error handling event ${eventName}:`, error);
          }
        };

        this.eventEmitter.on(eventName, eventHandler);
        listeners.push({ eventName, handler: eventHandler });
      });

      // Set up heartbeat if specified
      let heartbeatTimer: NodeJS.Timeout | null = null;
      if (heartbeatInterval && heartbeatInterval > 0) {
        heartbeatTimer = setInterval(() => {
          observer.next({
            data: JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date(),
            }),
          });
        }, heartbeatInterval);
      }

      // Cleanup function
      return () => {
        // Remove all event listeners
        listeners.forEach(({ eventName, handler }) => {
          this.eventEmitter.off(eventName, handler);
        });

        // Clear heartbeat timer
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }

        this.logger.debug('SSE Observable cleaned up');
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
