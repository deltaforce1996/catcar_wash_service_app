# Services Directory

This directory contains various service classes that provide core functionality for the CatCar Wash Service application. Each service is designed to be injected into other parts of the application using NestJS's dependency injection system.

## Available Services

### 1. BeamCheckoutService

A comprehensive service for integrating with the Beam Checkout payment API. This service handles payment processing, charge management, and QR code generation.

#### Features
- OAuth2 authentication with Beam Checkout API
- Create and manage payment charges
- Support for multiple payment methods (QR PromptPay, Card, Alipay, Line Pay, Shopee Pay, True Money, WeChat Pay)
- QR code generation in multiple formats (Data URL, Buffer, SVG)
- Automatic token refresh and error handling

#### Configuration
Set the following environment variables:
```env
BEAM_API_URL=https://api.beamcheckout.com
BEAM_CLIENT_ID=your_client_id
BEAM_CLIENT_SECRET=your_client_secret
BEAM_WEBHOOK_URL=your_webhook_url
```

#### Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { BeamCheckoutService, ChargeData } from './services';

@Injectable()
export class PaymentController {
  constructor(private readonly beamCheckoutService: BeamCheckoutService) {}

  async createPayment() {
    const chargeData: ChargeData = {
      amount: 1000, // 10.00 THB
      currency: 'THB',
      referenceId: 'ORDER-12345',
      paymentMethod: {
        paymentMethodType: 'QR_PROMPT_PAY',
        qrPromptPay: {
          expiryTime: '2024-12-31T23:59:59Z'
        }
      },
      returnUrl: 'https://yourapp.com/payment/return'
    };

    try {
      const result = await this.beamCheckoutService.createCharge(chargeData);
      
      if (result.actionRequired === 'ENCODED_IMAGE') {
        // Display QR code to user
        const qrCodeDataUrl = result.encodedImage?.imageBase64Encoded;
        return { qrCode: qrCodeDataUrl, chargeId: result.chargeId };
      } else if (result.actionRequired === 'REDIRECT') {
        // Redirect user to payment page
        return { redirectUrl: result.redirect?.redirectUrl };
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      throw error;
    }
  }

  async checkPaymentStatus(chargeId: string) {
    const status = await this.beamCheckoutService.getChargeStatus(chargeId);
    return status;
  }

  async generateQRCode(data: string) {
    // Generate QR code as data URL
    const dataUrl = await this.beamCheckoutService.generateQRCodeDataUrl(data, {
      width: 300,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    
    return { qrCode: dataUrl };
  }
}
```

#### Key Methods

- `createCharge(data: ChargeData)`: Create a new payment charge
- `getChargeStatus(chargeId: string)`: Get the status of a charge
- `cancelCharge(chargeId: string)`: Cancel a pending charge
- `generateQRCodeDataUrl(data: string, options?)`: Generate QR code as data URL
- `generateQRCodeBuffer(data: string, options?)`: Generate QR code as buffer
- `generateQRCodeSVG(data: string, options?)`: Generate QR code as SVG string

### 2. ErrorLoggerService

A service for logging errors to files with detailed information including request context, timestamps, and stack traces.

#### Features
- Logs errors to daily rotating files
- Includes request information (IP, User-Agent, method, URL)
- Uses Thailand timezone (UTC+7)
- Creates organized directory structure
- Nginx-style log formatting

#### Usage Example

```typescript
import { Injectable, Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Request } from 'express';
import { ErrorLoggerService } from './services';

@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorLoggerService: ErrorLoggerService) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Log error to file
    this.errorLoggerService.logErrorToFile(exception, request);

    // Handle the exception...
  }
}
```

#### Log File Structure
```
logging/
└── errors/
    ├── error-2024-01-15.txt
    ├── error-2024-01-16.txt
    └── error-2024-01-17.txt
```

#### Log Format
```
2024-01-15 14:30:25 +07:00 [error] POST /api/payments - Payment failed
IP: 192.168.1.100 | User-Agent: Mozilla/5.0...
Error: Payment failed
    at PaymentService.createCharge (/app/src/services/payment.service.ts:45:11)
    at PaymentController.createPayment (/app/src/controllers/payment.controller.ts:23:5)
---
```

### 3. SqlScriptService

A simple service for executing SQL scripts and refreshing materialized views.

#### Features
- Refresh all materialized views
- Execute custom SQL scripts
- Simple error handling and logging

#### Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { SqlScriptService } from './services';

@Injectable()
export class DatabaseController {
  constructor(private readonly sqlScriptService: SqlScriptService) {}

  async refreshAllViews() {
    // Refresh all materialized views
    await this.sqlScriptService.refreshAllViews();
    return { message: 'All materialized views refreshed successfully' };
  }

  async executeCustomQuery() {
    // Execute a custom SQL query
    const result = await this.sqlScriptService.runSqlScript(`
      SELECT device_id, COUNT(*) as event_count
      FROM tbl_devices_events 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY device_id
      ORDER BY event_count DESC
    `);
    
    return result;
  }
}
```

#### Key Methods

- `refreshAllViews()`: Refresh all materialized views (day, month, year, hour)
- `runSqlScript(sql: string)`: Execute any SQL script and return results

### 4. MqttService

A comprehensive MQTT client service for publishing and subscribing to MQTT topics with automatic connection management and event handling.

> **Note**: MqttService is located in the `modules/mqtt` directory, not in the services directory. Import it from `@/modules/mqtt`.

#### Features
- Automatic connection management with reconnection support
- Publish messages to MQTT topics with configurable QoS
- Subscribe to multiple topics with automatic re-subscription on reconnect
- Event-driven architecture with custom event emitters
- Connection status monitoring and health checks
- JSON message publishing for structured data
- Configurable connection parameters via environment variables
- Device streaming topic subscription support

#### Configuration
Set the following environment variables:
```env
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=catcar-wash-service
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_KEEPALIVE=60
MQTT_CONNECT_TIMEOUT=30000
MQTT_RECONNECT_PERIOD=5000
MQTT_CLEAN=true
MQTT_QOS=1
```

#### Usage Example

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MqttService } from '@/modules/mqtt';

@Injectable()
export class DeviceController implements OnModuleInit {
  constructor(private readonly mqttService: MqttService) {}

  async onModuleInit() {
    // Listen for messages on specific topics
    this.mqttService.on('message:device/+/status', (message) => {
      console.log(`Device status update: ${message.topic}`, message.payload.toString());
    });

    this.mqttService.on('message:device/+/sensor', (message) => {
      console.log(`Sensor data: ${message.topic}`, message.payload.toString());
    });

    // Subscribe to device topics
    await this.mqttService.subscribe('device/+/status', 1);
    await this.mqttService.subscribe('device/+/sensor', 1);
    
    // Subscribe to device streaming topics
    await this.mqttService.subscribeToDeviceStreaming();
  }

  async sendDeviceCommand(deviceId: string, command: any) {
    const topic = `device/${deviceId}/command`;
    await this.mqttService.publishJson(topic, command, { qos: 1 });
  }

  async broadcastSystemStatus(status: any) {
    await this.mqttService.publishJson('system/status', status, { 
      qos: 1, 
      retain: true 
    });
  }

  async getConnectionStatus() {
    return this.mqttService.getConnectionStatus();
  }

  async getActiveSubscriptions() {
    return this.mqttService.getSubscriptions();
  }

  async updateMqttConfig(newConfig: any) {
    await this.mqttService.updateConfig(newConfig);
  }
}
```

#### Event Handling

The MQTT service emits various events for monitoring and handling:

```typescript
// Connection events
this.mqttService.on('connected', () => {
  console.log('MQTT client connected');
});

this.mqttService.on('disconnected', () => {
  console.log('MQTT client disconnected');
});

this.mqttService.on('reconnecting', () => {
  console.log('MQTT client reconnecting...');
});

// Message events
this.mqttService.on('message', (message) => {
  console.log('Message received:', message.topic, message.payload.toString());
});

// Topic-specific events
this.mqttService.on('message:device/123/status', (message) => {
  // Handle specific device status updates
});

// Subscription events
this.mqttService.on('subscribed', (subscription) => {
  console.log(`Subscribed to: ${subscription.topic}`);
});

this.mqttService.on('unsubscribed', (topic) => {
  console.log(`Unsubscribed from: ${topic}`);
});

// Error handling
this.mqttService.on('error', (error) => {
  console.error('MQTT error:', error);
});
```

#### Key Methods

- `connect()`: Connect to MQTT broker
- `disconnect()`: Disconnect from MQTT broker
- `publish(topic, payload, options?)`: Publish message to topic
- `publishJson(topic, data, options?)`: Publish JSON data to topic
- `subscribe(topic, qos?)`: Subscribe to a topic
- `unsubscribe(topic)`: Unsubscribe from a topic
- `subscribeMultiple(subscriptions)`: Subscribe to multiple topics
- `unsubscribeMultiple(topics)`: Unsubscribe from multiple topics
- `subscribeToDeviceStreaming()`: Subscribe to device streaming topics
- `getConnectionStatus()`: Get current connection status
- `getSubscriptions()`: Get list of active subscriptions
- `isConnected()`: Check if client is connected
- `reconnect()`: Manually reconnect to broker
- `updateConfig(newConfig)`: Update configuration and reconnect

### 5. DateTimeService

A utility service for handling datetime operations with Thailand timezone support (UTC+7).

#### Features
- Convert any datetime to Thailand timezone (UTC+7)
- Get current Thailand time
- Consistent datetime formatting (YYYY-MM-DD HH:mm:ss)
- Null-safe operations

#### Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { DateTimeService } from './services';

@Injectable()
export class ReportService {
  constructor(private readonly dateTimeService: DateTimeService) {}

  async generateReport() {
    // Get current Thailand time
    const currentTime = this.dateTimeService.getCurrentThailandTime();
    
    // Convert UTC datetime to Thailand time
    const utcDate = new Date('2024-01-15T10:30:00Z');
    const thailandTime = this.dateTimeService.convertToThailandTime(utcDate);
    
    return {
      generatedAt: currentTime,
      reportPeriod: thailandTime,
      // ... other report data
    };
  }

  async processEvent(eventDate: string) {
    // Convert event date to Thailand timezone
    const localTime = this.dateTimeService.convertToThailandTime(eventDate);
    
    if (!localTime) {
      throw new Error('Invalid event date format');
    }
    
    return { processedAt: localTime };
  }
}
```

#### Key Methods

- `convertToThailandTime(date: Date | string)`: Convert datetime to Thailand timezone
- `getCurrentThailandTime()`: Get current datetime in Thailand timezone

### 6. DeviceRegistrationService

A service for managing device registration sessions with PIN-based authentication and automatic session cleanup.

#### Features
- Generate unique 4-digit PIN codes for device registration
- Session management with 5-minute expiration
- Automatic cleanup of expired sessions
- SSE event integration for real-time updates
- Device ID mapping and validation

#### Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { DeviceRegistrationService } from './services';

@Injectable()
export class DeviceController {
  constructor(private readonly deviceRegistrationService: DeviceRegistrationService) {}

  async initiateRegistration(chipId: string, macAddress: string, firmwareVersion: string) {
    // Create a new registration session
    const session = this.deviceRegistrationService.createRegistrationSession(
      chipId,
      macAddress,
      firmwareVersion
    );
    
    return {
      pin: session.pin,
      expiresAt: session.expires_at,
      message: 'Registration session created. Enter PIN on device.'
    };
  }

  async completeRegistration(pin: string, deviceId: string) {
    // Update session with device ID
    const success = this.deviceRegistrationService.updateSessionWithDeviceId(pin, deviceId);
    
    if (success) {
      return { message: 'Device registered successfully' };
    } else {
      throw new Error('Invalid or expired PIN');
    }
  }

  async getActiveRegistrations() {
    // Get all active registration sessions
    const sessions = this.deviceRegistrationService.getActiveSessions();
    
    return sessions.map(session => ({
      pin: session.pin,
      chipId: session.chip_id,
      macAddress: session.mac_address,
      firmwareVersion: session.firmware_version,
      deviceId: session.device_id,
      expiresAt: session.expires_at
    }));
  }

  async cancelRegistration(pin: string) {
    // Remove registration session
    const removed = this.deviceRegistrationService.removeSession(pin);
    
    if (removed) {
      return { message: 'Registration cancelled' };
    } else {
      throw new Error('Registration session not found');
    }
  }
}
```

#### Key Methods

- `createRegistrationSession(chipId, macAddress, firmwareVersion)`: Create new registration session
- `getSessionByPin(pin)`: Get session by PIN code
- `updateSessionWithDeviceId(pin, deviceId)`: Complete registration with device ID
- `getActiveSessions()`: Get all active sessions
- `removeSession(pin)`: Cancel/remove registration session

### 7. EventManagerService

A comprehensive event management service with SSE (Server-Sent Events) support and domain-specific event emitters.

#### Features
- Event emission and listening with EventEmitter2
- SSE Observable creation for real-time client updates
- Domain-specific typed event emitters
- Event statistics and health monitoring
- Automatic cleanup and memory management

#### Usage Example

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventManagerService } from './services';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(private readonly eventManager: EventManagerService) {}

  async onModuleInit() {
    // Set up event listeners
    this.eventManager.on('user.registered', (userData) => {
      this.sendWelcomeEmail(userData);
    });

    this.eventManager.on('payment.completed', (paymentData) => {
      this.updateOrderStatus(paymentData);
    });
  }

  async createSSEStream() {
    // Create SSE stream for real-time notifications
    const eventHandlers = [
      {
        eventName: 'notification.new',
        handler: (data) => ({
          type: 'notification',
          data: {
            id: data.id,
            message: data.message,
            timestamp: new Date()
          }
        })
      },
      {
        eventName: 'system.status',
        handler: (data) => ({
          type: 'status',
          data: {
            status: data.status,
            timestamp: new Date()
          }
        })
      }
    ];

    return this.eventManager.createSSEObservable(
      eventHandlers,
      // Initial data
      () => ({
        type: 'initial',
        data: { connected: true, timestamp: new Date() }
      }),
      // Heartbeat every 30 seconds
      30000
    );
  }

  async emitUserEvent(userId: string, action: string) {
    // Emit user-specific event
    this.eventManager.emit('user.action', { userId, action, timestamp: new Date() });
  }

  async getEventStats() {
    // Get event system statistics
    return this.eventManager.getEventStats();
  }

  async healthCheck() {
    // Check event system health
    return this.eventManager.healthCheck();
  }
}
```

#### Key Methods

- `emit(eventName, data)`: Emit an event
- `on(eventName, listener)`: Listen to an event
- `off(eventName, listener)`: Remove event listener
- `createSSEObservable(eventHandlers, initialData?, heartbeatInterval?)`: Create SSE stream
- `createDomainEmitter(domain)`: Create typed domain emitter
- `getEventStats()`: Get event statistics
- `healthCheck()`: Check system health

### 8. DeviceRegistrationEventAdapter

An adapter service that bridges DeviceRegistrationService with EventManagerService, providing SSE streams for device registration events.

#### Features
- SSE stream creation for device registration events
- Event mapping and transformation
- Real-time registration status updates
- Initial data provision for new connections
- Heartbeat support for connection monitoring

#### Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { DeviceRegistrationEventAdapter } from './services';

@Injectable()
export class DeviceRegistrationController {
  constructor(private readonly deviceRegistrationAdapter: DeviceRegistrationEventAdapter) {}

  async getRegistrationStream() {
    // Create SSE stream for device registration events
    return this.deviceRegistrationAdapter.createSSEStream();
  }

  async getRegistrationStats() {
    // Get registration event statistics
    return this.deviceRegistrationAdapter.getStats();
  }
}
```

#### SSE Event Types

The adapter provides the following event types in the SSE stream:

- `initial`: Initial connection with active sessions
- `registration_requested`: New device registration request
- `registration_completed`: Device registration completed
- `registration_cancelled`: Registration session cancelled
- `registration_expired`: Registration session expired
- `heartbeat`: Connection heartbeat (every 30 seconds)

#### Key Methods

- `createSSEStream()`: Create SSE Observable for registration events
- `getStats()`: Get registration event statistics
- `setupEventListeners()`: Set up automatic event listeners

### 9. BcryptService

A utility service for password hashing and verification using bcrypt.

#### Features
- Secure password hashing with configurable salt rounds
- Password comparison for authentication
- Uses bcrypt with 10 salt rounds by default

#### Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { BcryptService } from './services';

@Injectable()
export class AuthService {
  constructor(private readonly bcryptService: BcryptService) {}

  async registerUser(email: string, password: string) {
    // Hash the password before storing
    const hashedPassword = await this.bcryptService.hashPassword(password);
    
    // Store user with hashed password
    const user = await this.userRepository.create({
      email,
      password: hashedPassword
    });
    
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    
    if (user && await this.bcryptService.comparePassword(password, user.password)) {
      return user;
    }
    
    return null;
  }
}
```

#### Key Methods

- `hashPassword(password: string)`: Hash a password for secure storage
- `comparePassword(password: string, hash: string)`: Compare a password with its hash

## Service Registration

All services are automatically exported from the `index.ts` file and can be imported as:

```typescript
import { 
  BeamCheckoutService, 
  ErrorLoggerService, 
  BcryptService, 
  SqlScriptService, 
  DateTimeService,
  DeviceRegistrationService,
  EventManagerService,
  DeviceRegistrationEventAdapter
} from './services';

// MqttService is in a separate module
import { MqttService } from '@/modules/mqtt';
```

## Dependency Injection

To use these services in your controllers or other services, inject them through the constructor:

```typescript
import { Injectable } from '@nestjs/common';
import { 
  BeamCheckoutService, 
  ErrorLoggerService, 
  BcryptService, 
  SqlScriptService, 
  DateTimeService,
  DeviceRegistrationService,
  EventManagerService,
  DeviceRegistrationEventAdapter
} from './services';
import { MqttService } from '@/modules/mqtt';

@Injectable()
export class YourService {
  constructor(
    private readonly beamCheckoutService: BeamCheckoutService,
    private readonly errorLoggerService: ErrorLoggerService,
    private readonly bcryptService: BcryptService,
    private readonly sqlScriptService: SqlScriptService,
    private readonly dateTimeService: DateTimeService,
    private readonly deviceRegistrationService: DeviceRegistrationService,
    private readonly eventManagerService: EventManagerService,
    private readonly deviceRegistrationAdapter: DeviceRegistrationEventAdapter,
    private readonly mqttService: MqttService,
  ) {}
}
```

## Error Handling

All services include comprehensive error handling:

- **BeamCheckoutService**: Throws `BadRequestException` for API errors and validation failures
- **ErrorLoggerService**: Gracefully handles file system errors
- **SqlScriptService**: Simple error handling with logging
- **DateTimeService**: Null-safe operations with validation
- **DeviceRegistrationService**: Session validation and cleanup with logging
- **EventManagerService**: Event system health monitoring and error handling
- **DeviceRegistrationEventAdapter**: SSE stream error handling and cleanup
- **BcryptService**: Propagates bcrypt library errors
- **MqttService**: Comprehensive error handling with automatic reconnection and event emission

## Best Practices

1. **Configuration**: Always set required environment variables before using BeamCheckoutService and MqttService
2. **Error Logging**: Use ErrorLoggerService in global exception filters for comprehensive error tracking
3. **SQL Scripts**: Use SqlScriptService for database operations and materialized view refreshes
4. **DateTime Handling**: Use DateTimeService for consistent Thailand timezone operations
5. **Device Registration**: Use DeviceRegistrationService for secure PIN-based device registration with automatic cleanup
6. **Event Management**: Use EventManagerService for application-wide event handling and SSE streams
7. **Password Security**: Never store plain text passwords; always use BcryptService for hashing
8. **Payment Handling**: Always verify payment status before processing orders
9. **QR Code Generation**: Use appropriate options for QR code generation based on your use case
10. **MQTT Communication**: Use MqttService for IoT device communication with proper error handling and event listeners
11. **SSE Streams**: Use EventManagerService or DeviceRegistrationEventAdapter for real-time client updates
12. **Session Management**: Clean up expired registration sessions automatically

## Dependencies

- `@nestjs/common`: NestJS core functionality
- `@nestjs/config`: Configuration management
- `@nestjs/event-emitter`: Event system for EventManagerService
- `axios`: HTTP client for API calls
- `qrcode`: QR code generation
- `bcrypt`: Password hashing
- `mqtt`: MQTT client for IoT communication
- `rxjs`: Reactive programming for SSE observables
- `fs`: File system operations (Node.js built-in)
- `path`: Path utilities (Node.js built-in)
- `events`: Event emitter functionality (Node.js built-in)
