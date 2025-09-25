export interface SSEEventCallback<T = any> {
  (data: T): void;
}

export interface SSECallbacks {
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onMessage?: (event: MessageEvent) => void;
  [eventType: string]: SSEEventCallback | undefined;
}

export interface SSEConfig {
  url: string;
  withCredentials?: boolean;
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private config: Required<SSEConfig>;
  private callbacks: SSECallbacks = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;

  constructor(config: SSEConfig) {
    this.config = {
      withCredentials: config.withCredentials ?? true,
      headers: config.headers ?? {},
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      ...config,
    };
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.isManuallyDisconnected = false;
    this.eventSource = new EventSource(this.config.url, {
      withCredentials: this.config.withCredentials,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.clearReconnectTimer();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.callbacks.onClose?.();
  }

  /**
   * Add event listener for specific event type
   */
  on<T = any>(eventType: string, callback: SSEEventCallback<T>): void {
    this.callbacks[eventType] = callback;
  }

  /**
   * Remove event listener for specific event type
   */
  off(eventType: string): void {
    delete this.callbacks[eventType];
  }

  /**
   * Set general callbacks
   */
  setCallbacks(callbacks: SSECallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get connection status
   */
  get readyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Setup event listeners for EventSource
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      console.log(`SSE connected to ${this.config.url}`);
      this.reconnectAttempts = 0;
      this.callbacks.onOpen?.();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle specific event types
        if (data.type && this.callbacks[data.type]) {
          this.callbacks[data.type]!(data);
        }
        
        // Handle general message callback
        this.callbacks.onMessage?.(event);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error(`SSE error on ${this.config.url}:`, error);
      this.callbacks.onError?.(error);
      
      // Attempt reconnection if not manually disconnected
      if (!this.isManuallyDisconnected) {
        this.attemptReconnect();
      }
    };
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.isManuallyDisconnected || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached or manually disconnected');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts}) in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * Typed SSE Client for specific event schemas
 */
export abstract class TypedSSEClient<TEventMap extends Record<string, any>> {
  protected sseClient: SSEClient;

  constructor(config: SSEConfig) {
    this.sseClient = new SSEClient(config);
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    this.sseClient.connect();
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect(): void {
    this.sseClient.disconnect();
  }

  /**
   * Add typed event listener
   */
  on<K extends keyof TEventMap>(eventType: K, callback: SSEEventCallback<TEventMap[K]>): void {
    this.sseClient.on(eventType as string, callback);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof TEventMap>(eventType: K): void {
    this.sseClient.off(eventType as string);
  }

  /**
   * Set general callbacks
   */
  setCallbacks(callbacks: Omit<SSECallbacks, keyof TEventMap>): void {
    this.sseClient.setCallbacks(callbacks);
  }

  /**
   * Get connection status
   */
  get readyState(): number {
    return this.sseClient.readyState;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.sseClient.isConnected;
  }
}
