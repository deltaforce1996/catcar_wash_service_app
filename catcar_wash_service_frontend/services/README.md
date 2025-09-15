# Services Layer

This directory contains the API service layer for the CatCar Wash Service application. It provides a structured approach to handling HTTP requests and API communication with the backend services.

## 📁 Directory Structure

```
services/
├── bases/                    # Base classes and utilities
│   ├── base-api-client.ts   # Abstract base class for API clients
│   └── README.md            # Base classes documentation
├── apis/                    # Specific API service implementations
│   ├── dashboard-api.service.ts
│   ├── device-api.service.ts
│   ├── device-event-logs-api.service.ts
│   ├── emp-api.service.ts
│   └── user-api.service.ts
├── index.ts                 # Main exports
└── README.md               # This file
```

## 🏗️ Architecture Overview

The services layer follows a modular architecture pattern with:

- **Base Classes**: Common functionality shared across all API services
- **Service Classes**: Domain-specific API implementations
- **Type Safety**: Full TypeScript support with interfaces and types
- **Error Handling**: Centralized error management and logging
- **Authentication**: Automatic token management and signature generation

## 🔧 Base API Client

The `BaseApiClient` class provides the foundation for all API services:

### Features

- **Axios Integration**: Built on top of Axios for HTTP requests
- **Authentication**: Automatic Bearer token injection
- **Signature Generation**: Optional request signing for enhanced security
- **Interceptors**: Request/response interceptors for logging and error handling
- **Configuration**: Centralized configuration management
- **HTTP Methods**: Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)

### Key Methods

```typescript
// HTTP Methods
protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
protected async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
protected async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
protected async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>

// Configuration Methods
public setBaseURL(baseURL: string): void
public setTimeout(timeout: number): void
public setDefaultHeader(key: string, value: string): void
public setSignatureEnabled(enabled: boolean): void
public setSignatureSecretKey(secretKey: string): void
```

## 📋 API Services

### Dashboard API Service

**File**: `apis/dashboard-api.service.ts`
**Purpose**: Handles dashboard data and analytics

**Methods**:

- `GetDashboardSummary(filter?)`: Retrieves dashboard summary with optional filtering

**Key Features**:

- Revenue analytics (monthly, daily, hourly)
- Payment status tracking
- Chart data generation
- Flexible filtering options

### Device API Service

**File**: `apis/device-api.service.ts`
**Purpose**: Manages car wash devices and their configurations

**Methods**:

- `SearchDevices(payload)`: Search and list devices with pagination
- `GetDeviceById(id)`: Retrieve specific device details
- `CreateDevice(payload)`: Register new device
- `UpdateDeviceBasicById(id, payload)`: Update basic device information
- `UpdateDeviceConfigsById(id, payload)`: Update device configurations
- `SetDeviceStatus(id, payload)`: Change device operational status

**Key Features**:

- Support for WASH and DRYING device types
- Complex configuration management (sale configs, system settings)
- Device status management (active, inactive, maintenance)
- Owner and registration tracking

### User API Service

**File**: `apis/user-api.service.ts`
**Purpose**: Handles user management operations

**Methods**:

- `SearchUsers(payload)`: Search users with advanced filtering
- `GetUserById(id)`: Get user details by ID
- `UpdateUserById(id, payload)`: Update user information

**Key Features**:

- User profile management
- Permission-based access control
- Device count tracking per user
- Advanced search and sorting

### Device Event Logs API Service

**File**: `apis/device-event-logs-api.service.ts`
**Purpose**: Manages device event logging and monitoring

**Features**:

- Event logging and retrieval
- Device activity tracking
- Audit trail management

### Employee API Service

**File**: `apis/emp-api.service.ts`
**Purpose**: Handles employee management operations

**Features**:

- Employee profile management
- Role-based access control
- Employee device assignments

## 🚀 Usage Examples

### Basic Service Usage

```typescript
import { UserApiService } from "~/services";

// Create service instance
const userService = new UserApiService();

// Search users
const users = await userService.SearchUsers({
  query: "john",
  page: 1,
  limit: 10,
  sort_by: "created_at",
  sort_order: "desc",
});

// Get specific user
const user = await userService.GetUserById("user-id");
```

### Device Management

```typescript
import { DeviceApiService } from "~/services";

const deviceService = new DeviceApiService();

// Create new device
const newDevice = await deviceService.CreateDevice({
  name: "Car Wash Station 1",
  type: "WASH",
  owner_id: "owner-id",
  register_by: "employee-id",
  configs: {
    system: {
      on_time: "06:00",
      off_time: "22:00",
      payment_method: {
        coin: true,
        promptpay: true,
        bank_note: false,
      },
    },
  },
});

// Update device configuration
await deviceService.UpdateDeviceConfigsById("device-id", {
  configs: {
    sale: {
      water: 5000,
      foam: 8000,
      wax: 12000,
    },
  },
});
```

### Dashboard Analytics

```typescript
import { DashboardApiService } from "~/services";

const dashboardService = new DashboardApiService();

// Get dashboard summary
const summary = await dashboardService.GetDashboardSummary({
  user_id: "user-id",
  device_status: "ACTIVE",
  date: "2024-01-15",
  include_charts: true,
});
```

## 🔐 Security Features

### Authentication

- Automatic Bearer token injection from `authTokenManager`
- Token refresh and error handling
- Automatic logout on authentication failures

### Request Signing

- Optional HMAC signature generation
- Configurable secret keys
- Request integrity verification

### Error Handling

- Centralized error processing
- HTTP status code handling
- Detailed error logging

## 📝 Type Safety

All services are fully typed with TypeScript:

- **Request Interfaces**: Define input parameters and payloads
- **Response Interfaces**: Define API response structures
- **Enum Types**: Status, type, and order enumerations
- **Generic Types**: Flexible response typing with generics

## 🔧 Configuration

Services inherit configuration from the global config system:

- **Base URL**: API endpoint configuration
- **Timeout**: Request timeout settings
- **Headers**: Default headers and content types
- **Signature**: Security configuration options

## 📊 Error Handling

The base client provides comprehensive error handling:

- **401/403**: Automatic token clearing and user notification
- **500**: Server error handling with user feedback
- **Network Errors**: Connection and timeout handling
- **Validation Errors**: Request validation feedback

## 🧪 Testing

Services are designed to be easily testable:

- **Mockable Dependencies**: Axios instance can be mocked
- **Abstract Base Class**: Easy to extend for testing
- **Type Safety**: Compile-time error checking
- **Isolated Logic**: Business logic separated from HTTP concerns

## 📚 Additional Documentation

- [Base API Client Documentation](./bases/README.md)
- [Signature Implementation Guide](./bases/signature-implementation.md)

## 🔄 Future Enhancements

- **Caching**: Response caching for improved performance
- **Retry Logic**: Automatic retry for failed requests
- **Request Deduplication**: Prevent duplicate concurrent requests
- **Offline Support**: Local storage and sync capabilities
- **Real-time Updates**: WebSocket integration for live data
