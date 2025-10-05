# Device Registration Flow Implementation

## 🎯 Overview

ระบบ Device Registration ที่ implement แล้วจะทำงานดังนี้:

1. **Device** กด Mode Pairing → ส่ง POST request ไป `/api/v1/devices/need-register`
2. **Server** generate PIN 4 หลัก → เก็บ session 5 นาที → ส่ง SSE ไปหา client
3. **Web Client** เชื่อมต่อ SSE ที่ `/api/v1/devices/scan` → รับข้อมูล device ที่ต้องการ register

## 🔧 API Endpoints

### 1. Device Registration Request
```http
POST /api/v1/devices/need-register
Content-Type: application/json
x-signature: {CHECK_SUM_FROM_MAC_ADDRESS}

{
  "chip_id": "ESP32-001",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.2.3"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pin": "1234",
    "device_id": "temp-ESP32-001"
  },
  "message": "Device registration session created successfully"
}
```

### 2. Web Client Device Scanning (SSE)
```http
GET /api/v1/devices/scan
Authorization: Bearer {jwt_token}
Accept: text/event-stream
```

**SSE Events:**
```javascript
// Initial active sessions
event: message
data: {"type":"initial","sessions":[{"pin":"1234","chip_id":"ESP32-001","mac_address":"AA:BB:CC:DD:EE:FF","firmware_version":"1.2.3","created_at":"2025-09-25T10:00:00Z","expires_at":"2025-09-25T10:05:00Z"}]}

// New registration request
event: message
data: {"type":"registration_requested","pin":"5678","chip_id":"ESP32-002","mac_address":"11:22:33:44:55:66","firmware_version":"1.2.3","timestamp":"2025-09-25T10:01:00Z"}

// Registration completed
event: message
data: {"type":"registration_completed","pin":"1234","chip_id":"ESP32-001","device_id":"device-abc123","timestamp":"2025-09-25T10:02:00Z"}

// Registration expired
event: message
data: {"type":"registration_expired","pin":"1234","timestamp":"2025-09-25T10:05:00Z"}

// Heartbeat (every 30 seconds)
event: message
data: {"type":"heartbeat","timestamp":"2025-09-25T10:01:30Z"}
```

## 💻 Frontend Usage Example

```javascript
import { DeviceApiService } from '~/services/apis/device-api.service';

class DeviceRegistrationManager {
  private eventSource: EventSource | null = null;
  private deviceApiService = new DeviceApiService();

  startScanning() {
    // Start SSE connection
    this.eventSource = this.deviceApiService.startDeviceScan();
    
    // Handle events
    this.deviceApiService.handleDeviceScanEvents(this.eventSource, {
      onInitial: (sessions) => {
        console.log('Active registration sessions:', sessions);
        this.updateUI(sessions);
      },
      
      onRegistrationRequested: (data) => {
        console.log('New device requesting registration:', data);
        this.showNewDevice(data);
      },
      
      onRegistrationCompleted: (data) => {
        console.log('Device registration completed:', data);
        this.removeDeviceFromUI(data.pin);
      },
      
      onRegistrationExpired: (data) => {
        console.log('Device registration expired:', data);
        this.removeDeviceFromUI(data.pin);
      },
      
      onError: (error) => {
        console.error('SSE connection error:', error);
        this.handleConnectionError();
      }
    });
  }

  stopScanning() {
    if (this.eventSource) {
      this.deviceApiService.stopDeviceScan(this.eventSource);
      this.eventSource = null;
    }
  }

  private updateUI(sessions) {
    // Update UI with current pending registrations
    const deviceList = document.getElementById('pending-devices');
    deviceList.innerHTML = '';
    
    sessions.forEach(session => {
      const deviceItem = document.createElement('div');
      deviceItem.innerHTML = `
        <div class="device-card">
          <h3>PIN: ${session.pin}</h3>
          <p>Chip ID: ${session.chip_id}</p>
          <p>MAC: ${session.mac_address}</p>
          <p>Firmware: ${session.firmware_version}</p>
          <p>Expires: ${new Date(session.expires_at).toLocaleString()}</p>
          <button onclick="registerDevice('${session.pin}')">Register</button>
        </div>
      `;
      deviceList.appendChild(deviceItem);
    });
  }

  private showNewDevice(data) {
    // Add new device to UI
    this.addDeviceToUI(data);
    
    // Show notification
    this.showNotification(`New device requesting registration: PIN ${data.pin}`);
  }

  private removeDeviceFromUI(pin) {
    const deviceElement = document.querySelector(`[data-pin="${pin}"]`);
    if (deviceElement) {
      deviceElement.remove();
    }
  }
}

// Usage
const registrationManager = new DeviceRegistrationManager();

// Start scanning when page loads
registrationManager.startScanning();

// Stop scanning when page unloads
window.addEventListener('beforeunload', () => {
  registrationManager.stopScanning();
});
```

## 🔄 Flow Diagram

```
Device (ESP32)          Server                    Web Client
     |                    |                         |
     |-- POST need-register -> |                    |
     |                    |-- Generate PIN         |
     |                    |-- Store session (5min) |
     |                    |-- Emit SSE event ----> |
     |<-- PIN response ---|                         |-- Show PIN on UI
     |                    |                         |
     |                    |-- Cleanup after 5min   |
     |                    |-- Emit expired event -> |-- Remove from UI
```

## 🎛️ Key Features

✅ **PIN Generation**: 4-digit unique PIN codes  
✅ **Session Management**: 5-minute expiration with automatic cleanup  
✅ **Real-time Updates**: SSE for instant web client notifications  
✅ **Event Types**: Initial, requested, completed, expired, heartbeat  
✅ **Error Handling**: Connection error handling and reconnection  
✅ **Memory Management**: Automatic cleanup of expired sessions  

## 🚀 Next Steps

1. **Device Registration Completion**: เมื่อ web client เลือก device และ register เสร็จ ต้องเรียก API เพื่อ update session ด้วย actual device_id
2. **Authentication**: เพิ่ม signature validation สำหรับ device requests  
3. **Rate Limiting**: จำกัดจำนวน registration requests per device
4. **Persistence**: เก็บ registration history ใน database (optional)

## 🔐 Security Notes

- Device registration endpoint (`/need-register`) ไม่ต้อง JWT เพราะ device ยังไม่ได้ register
- Web client scanning endpoint (`/scan`) ต้อง JWT authentication
- ควรใช้ x-signature header เพื่อ validate device requests
- PIN codes มี uniqueness และ expiration เพื่อป้องกัน replay attacks
