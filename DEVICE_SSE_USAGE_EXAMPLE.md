# Device Registration SSE Service Usage

## 🎯 Overview

แยก SSE functionality ออกจาก `DeviceApiService` เป็น service แยกเพื่อ:
- **Reusability**: ใช้ซ้ำได้กับ SSE endpoints อื่นๆ
- **Type Safety**: มี TypeScript types ที่ชัดเจน
- **Auto Reconnection**: รองรับการเชื่อมต่อใหม่อัตโนมัติ
- **Better Organization**: แยก concerns ให้ชัดเจน

## 📁 File Structure

```
services/
├── bases/
│   ├── base-api-client.ts          # Base HTTP API client
│   └── sse-client.ts               # Base SSE client (NEW)
├── apis/
│   └── device-api.service.ts       # HTTP API methods only
├── device-registration-sse.service.ts  # Device registration SSE (NEW)
└── index.ts                        # Export all services
```

## 🔧 Base SSE Client Features

### `SSEClient` (Generic SSE Client)
- Auto reconnection with exponential backoff
- Event type handling
- Connection state management
- Error handling and callbacks

### `TypedSSEClient<T>` (Type-safe wrapper)
- TypeScript event type mapping
- Type-safe event callbacks
- Extends base SSE functionality

## 💻 Usage Examples

### 1. Basic Usage (Recommended)

```typescript
import { DeviceRegistrationSSEService } from '~/services';

class DeviceRegistrationManager {
  private sseService: DeviceRegistrationSSEService;

  constructor() {
    this.sseService = new DeviceRegistrationSSEService('http://localhost:3000');
  }

  startScanning() {
    this.sseService.startScanning({
      onInitial: (sessions) => {
        console.log('Active sessions:', sessions);
        this.updateDeviceList(sessions);
      },
      
      onRegistrationRequested: (data) => {
        console.log('New device requesting registration:', data);
        this.showNewDeviceNotification(data);
        this.addDeviceToUI(data);
      },
      
      onRegistrationCompleted: (data) => {
        console.log('Device registration completed:', data);
        this.removeDeviceFromUI(data.pin);
        this.showSuccessMessage(`Device ${data.device_id} registered!`);
      },
      
      onRegistrationExpired: (data) => {
        console.log('Registration expired:', data);
        this.removeDeviceFromUI(data.pin);
      },
      
      onOpen: () => {
        console.log('Connected to device registration stream');
        this.showConnectionStatus('connected');
      },
      
      onError: (error) => {
        console.error('SSE connection error:', error);
        this.showConnectionStatus('error');
      },
      
      onClose: () => {
        console.log('Disconnected from device registration stream');
        this.showConnectionStatus('disconnected');
      }
    });
  }

  stopScanning() {
    this.sseService.stopScanning();
  }

  get isScanning() {
    return this.sseService.isScanning;
  }

  private updateDeviceList(sessions) {
    // Update UI with current pending registrations
  }

  private addDeviceToUI(data) {
    // Add new device to pending list
  }

  private removeDeviceFromUI(pin) {
    // Remove device from pending list
  }

  private showNewDeviceNotification(data) {
    // Show toast/notification
  }

  private showSuccessMessage(message) {
    // Show success message
  }

  private showConnectionStatus(status) {
    // Update connection indicator
  }
}
```

### 2. Vue Composition API Usage

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { DeviceRegistrationSSEService } from '~/services';

export function useDeviceRegistration() {
  const sseService = new DeviceRegistrationSSEService('http://localhost:3000');
  const pendingDevices = ref<DeviceRegistrationSession[]>([]);
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);

  const startScanning = () => {
    sseService.startScanning({
      onInitial: (sessions) => {
        pendingDevices.value = sessions;
      },
      
      onRegistrationRequested: (data) => {
        pendingDevices.value.push({
          pin: data.pin,
          chip_id: data.chip_id,
          mac_address: data.mac_address,
          firmware_version: data.firmware_version,
          created_at: data.timestamp,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
      },
      
      onRegistrationCompleted: (data) => {
        pendingDevices.value = pendingDevices.value.filter(
          device => device.pin !== data.pin
        );
      },
      
      onRegistrationExpired: (data) => {
        pendingDevices.value = pendingDevices.value.filter(
          device => device.pin !== data.pin
        );
      },
      
      onOpen: () => {
        isConnected.value = true;
        connectionError.value = null;
      },
      
      onError: (error) => {
        isConnected.value = false;
        connectionError.value = 'Connection failed';
      },
      
      onClose: () => {
        isConnected.value = false;
      }
    });
  };

  const stopScanning = () => {
    sseService.stopScanning();
  };

  onMounted(() => {
    startScanning();
  });

  onUnmounted(() => {
    stopScanning();
  });

  return {
    pendingDevices,
    isConnected,
    connectionError,
    startScanning,
    stopScanning,
    isScanning: computed(() => sseService.isScanning)
  };
}
```

### 3. React Hook Usage

```typescript
import { useState, useEffect, useCallback } from 'react';
import { DeviceRegistrationSSEService } from '~/services';

export function useDeviceRegistration() {
  const [sseService] = useState(() => new DeviceRegistrationSSEService('http://localhost:3000'));
  const [pendingDevices, setPendingDevices] = useState<DeviceRegistrationSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const startScanning = useCallback(() => {
    sseService.startScanning({
      onInitial: (sessions) => {
        setPendingDevices(sessions);
      },
      
      onRegistrationRequested: (data) => {
        setPendingDevices(prev => [...prev, {
          pin: data.pin,
          chip_id: data.chip_id,
          mac_address: data.mac_address,
          firmware_version: data.firmware_version,
          created_at: data.timestamp,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }]);
      },
      
      onRegistrationCompleted: (data) => {
        setPendingDevices(prev => prev.filter(device => device.pin !== data.pin));
      },
      
      onRegistrationExpired: (data) => {
        setPendingDevices(prev => prev.filter(device => device.pin !== data.pin));
      },
      
      onOpen: () => setIsConnected(true),
      onError: () => setIsConnected(false),
      onClose: () => setIsConnected(false)
    });
  }, [sseService]);

  const stopScanning = useCallback(() => {
    sseService.stopScanning();
  }, [sseService]);

  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  return {
    pendingDevices,
    isConnected,
    startScanning,
    stopScanning,
    isScanning: sseService.isScanning
  };
}
```

## 🔧 Advanced Usage: Custom SSE Service

สามารถสร้าง SSE service อื่นๆ ได้ง่าย:

```typescript
// Define event map
interface NotificationEventMap {
  user_notification: { message: string; type: 'info' | 'warning' | 'error' };
  system_alert: { alert: string; severity: number };
}

// Create typed SSE service
export class NotificationSSEService extends TypedSSEClient<NotificationEventMap> {
  constructor(baseURL: string, userId: string) {
    super({
      url: `${baseURL}/api/v1/notifications/stream/${userId}`,
      withCredentials: true,
    });
  }

  startListening(callbacks: {
    onUserNotification?: (data: { message: string; type: 'info' | 'warning' | 'error' }) => void;
    onSystemAlert?: (data: { alert: string; severity: number }) => void;
    onOpen?: () => void;
    onError?: (error: Event) => void;
  }) {
    if (callbacks.onUserNotification) {
      this.on('user_notification', callbacks.onUserNotification);
    }
    
    if (callbacks.onSystemAlert) {
      this.on('system_alert', callbacks.onSystemAlert);
    }

    this.setCallbacks({
      onOpen: callbacks.onOpen,
      onError: callbacks.onError,
    });

    this.connect();
  }
}
```

## 🎯 Benefits

### ✅ **Type Safety**
- Strong TypeScript typing for all events
- Compile-time error checking
- IntelliSense support

### ✅ **Reusability**
- Base `SSEClient` ใช้ได้กับ SSE endpoint ไหนก็ได้
- `TypedSSEClient` ให้ type safety
- Easy to create new SSE services

### ✅ **Reliability**
- Auto reconnection with exponential backoff
- Connection state management
- Error handling and recovery

### ✅ **Clean Architecture**
- Separation of concerns
- HTTP API และ SSE แยกกัน
- Easy to test and maintain

### ✅ **Developer Experience**
- Simple, intuitive API
- Comprehensive error handling
- Built-in debugging support

## 🔄 Migration from Old Code

### Before (in DeviceApiService):
```typescript
const eventSource = deviceApiService.startDeviceScan();
deviceApiService.handleDeviceScanEvents(eventSource, {
  onRegistrationRequested: (data) => { /* ... */ }
});
```

### After (with new SSE Service):
```typescript
const sseService = new DeviceRegistrationSSEService('http://localhost:3000');
sseService.startScanning({
  onRegistrationRequested: (data) => { /* ... */ }
});
```

**การเปลี่ยนแปลงน้อยมาก แต่ได้ประโยชน์เยอะ!** 🚀
