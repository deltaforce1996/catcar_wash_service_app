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

### 4. BcryptService

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
import { BeamCheckoutService, ErrorLoggerService, BcryptService, SqlScriptService } from './services';
```

## Dependency Injection

To use these services in your controllers or other services, inject them through the constructor:

```typescript
import { Injectable } from '@nestjs/common';
import { BeamCheckoutService, ErrorLoggerService, BcryptService, SqlScriptService } from './services';

@Injectable()
export class YourService {
  constructor(
    private readonly beamCheckoutService: BeamCheckoutService,
    private readonly errorLoggerService: ErrorLoggerService,
    private readonly bcryptService: BcryptService,
    private readonly sqlScriptService: SqlScriptService,
  ) {}
}
```

## Error Handling

All services include comprehensive error handling:

- **BeamCheckoutService**: Throws `BadRequestException` for API errors and validation failures
- **ErrorLoggerService**: Gracefully handles file system errors
- **SqlScriptService**: Simple error handling with logging
- **BcryptService**: Propagates bcrypt library errors

## Best Practices

1. **Configuration**: Always set required environment variables before using BeamCheckoutService
2. **Error Logging**: Use ErrorLoggerService in global exception filters for comprehensive error tracking
3. **SQL Scripts**: Use SqlScriptService for database operations and materialized view refreshes
4. **Password Security**: Never store plain text passwords; always use BcryptService for hashing
5. **Payment Handling**: Always verify payment status before processing orders
6. **QR Code Generation**: Use appropriate options for QR code generation based on your use case

## Dependencies

- `@nestjs/common`: NestJS core functionality
- `@nestjs/config`: Configuration management
- `axios`: HTTP client for API calls
- `qrcode`: QR code generation
- `bcrypt`: Password hashing
- `fs`: File system operations (Node.js built-in)
- `path`: Path utilities (Node.js built-in)
