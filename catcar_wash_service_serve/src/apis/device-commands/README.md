# Device Commands API

API สำหรับส่งคำสั่งไปยังอุปกรณ์ผ่าน MQTT Protocol

## Overview

Device Commands API ช่วยให้ระบบสามารถส่งคำสั่งต่างๆ ไปยังอุปกรณ์ (Device) ที่เชื่อมต่ออยู่ได้แบบ Real-time ผ่าน MQTT Broker โดยมีการรอรับ Acknowledgment (ACK) จากอุปกรณ์เพื่อยืนยันว่าคำสั่งถูกดำเนินการสำเร็จ

## Supported Commands

| Command | Description | Requires ACK |
|---------|-------------|--------------|
| `APPLY_CONFIG` | ส่ง configuration ใหม่ให้อุปกรณ์ | ✅ Yes |
| `RESTART` | สั่งให้อุปกรณ์ restart | ✅ Yes |
| `UPDATE_FIRMWARE` | อัพเดท firmware version | ✅ Yes |
| `RESET_CONFIG` | รีเซ็ต configuration กลับเป็นค่าเริ่มต้น | ✅ Yes |
| `MANUAL_PAYMENT` | ส่งคำสั่งชำระเงินแบบ manual ให้อุปกรณ์ | ✅ Yes |
| `CUSTOM` | ส่งคำสั่งกำหนดเอง | ⚙️ Configurable |

## API Endpoints

### 1. Apply Configuration

ส่ง configuration ใหม่ให้อุปกรณ์

**Endpoint:** `POST /api/v1/device-commands/:deviceId/apply-config`

**Authentication:** Required (JWT Token)

**Authorization:** `ADMIN`, `SUPER_ADMIN`

**Request Body:**

```json
{
  "machine": {
    "ACTIVE": true,
    "BANKNOTE": true,
    "COIN": true,
    "QR": true,
    "ON_TIME": "08:00",
    "OFF_TIME": "22:00",
    "SAVE_STATE": true
  },
  "function": {
    "sec_per_baht": {
      "HP_WATER": 5,
      "FOAM": 3,
      "AIR": 4,
      "WATER": 6,
      "VACUUM": 4,
      "BLACK_TIRE": 3,
      "WAX": 2,
      "AIR_FRESHENER": 2,
      "PARKING_FEE": 1
    }
  },
  "pricing": {
    "BASE_FEE": 20,
    "PROMOTION": 0,
    "WORK_PERIOD": 300
  },
  "function_start": {
    "DUST_BLOW": 5,
    "SANITIZE": 0,
    "UV": 0,
    "OZONE": 0,
    "DRY_BLOW": 0,
    "PERFUME": 0
  },
  "function_end": {
    "DUST_BLOW": 0,
    "SANITIZE": 10,
    "UV": 30,
    "OZONE": 60,
    "DRY_BLOW": 20,
    "PERFUME": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Command sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-abc123",
    "device_id": "D001",
    "command": "APPLY_CONFIG",
    "status": "SUCCESS",
    "timestamp": 1697654325000,
    "results": {
      "config_applied": { ... },
      "timestamp": 1697654325000
    }
  }
}
```

---

### 2. Restart Device

สั่งให้อุปกรณ์ restart

**Endpoint:** `POST /api/v1/device-commands/:deviceId/restart`

**Authentication:** Required (JWT Token)

**Authorization:** `ADMIN`, `SUPER_ADMIN`

**Request Body:**

```json
{
  "delay_seconds": 5
}
```

**Response:**

```json
{
  "success": true,
  "message": "Restart command sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-def456",
    "device_id": "D001",
    "command": "RESTART",
    "status": "SUCCESS",
    "timestamp": 1697654325000,
    "results": {
      "delay_seconds": 5,
      "restart_at": 1697654330000
    }
  }
}
```

---

### 3. Update Firmware

อัพเดท firmware version ของอุปกรณ์

**Endpoint:** `POST /api/v1/device-commands/:deviceId/update-firmware`

**Authentication:** Required (JWT Token)

**Authorization:** `ADMIN`, `SUPER_ADMIN`

**Request Body:**

```json
{
  "url": "https://example.com/firmware/v2.0.0.bin",
  "version": "2.0.0",
  "sha256": "abc123def456...",
  "size": 2048576,
  "reboot_after": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Firmware update command sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-ghi789",
    "device_id": "D001",
    "command": "UPDATE_FIRMWARE",
    "status": "SUCCESS",
    "timestamp": 1697654325000,
    "results": {
      "version": "2.0.0",
      "download_started": true,
      "estimated_time": 300
    }
  }
}
```

---

### 4. Reset Configuration

รีเซ็ต configuration กลับเป็นค่าที่ระบุ

**Endpoint:** `POST /api/v1/device-commands/:deviceId/reset-config`

**Authentication:** Required (JWT Token)

**Authorization:** `ADMIN`, `SUPER_ADMIN`

**Request Body:** เหมือนกับ Apply Configuration

**Response:**

```json
{
  "success": true,
  "message": "Config reset command sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-jkl012",
    "device_id": "D001",
    "command": "RESET_CONFIG",
    "status": "SUCCESS",
    "timestamp": 1697654325000
  }
}
```

---

### 5. Send Manual Payment

ส่งคำสั่งชำระเงินแบบ manual ให้อุปกรณ์

**Endpoint:** `POST /api/v1/device-commands/:deviceId/manual-payment`

**Authentication:** Required (JWT Token)

**Authorization:** `ADMIN`, `SUPER_ADMIN`

**Request Body:**

```json
{
  "amount": 50
}
```

**Response:**

```json
{
  "success": true,
  "message": "Manual payment sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-xyz789",
    "device_id": "D001",
    "command": "MANUAL_PAYMENT",
    "status": "SUCCESS",
    "timestamp": 1697654325000,
    "results": {
      "amount": 50,
      "expire_at": 1697654335000
    }
  }
}
```

---

### 6. Send Custom Command

ส่งคำสั่งกำหนดเอง

**Endpoint:** `POST /api/v1/device-commands/:deviceId/custom`

**Authentication:** Required (JWT Token)

**Authorization:** `ADMIN`, `SUPER_ADMIN`

**Request Body:**

```json
{
  "command": "MY_CUSTOM_COMMAND",
  "payload": {
    "param1": "value1",
    "param2": 123
  },
  "require_ack": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Custom command sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-mno345",
    "device_id": "D001",
    "command": "MY_CUSTOM_COMMAND",
    "status": "SUCCESS",
    "timestamp": 1697654325000
  }
}
```

## Command Status

| Status | Description |
|--------|-------------|
| `SENT` | คำสั่งถูกส่งไปยังอุปกรณ์แล้ว (ยังไม่ได้รับ ACK) |
| `SUCCESS` | อุปกรณ์ดำเนินการคำสั่งสำเร็จ |
| `FAILED` | อุปกรณ์ดำเนินการคำสั่งไม่สำเร็จ |
| `TIMEOUT` | อุปกรณ์ไม่ตอบกลับภายในเวลาที่กำหนด (30 วินาที) |
| `ERROR` | เกิดข้อผิดพลาดในการส่งคำสั่ง |
| `PROGRESS` | คำสั่งกำลังดำเนินการ |

## MQTT Topics

### Command Topic (Server → Device)

```
device/{deviceId}/command
```

**Payload Format:**

```json
{
  "command_id": "cmd-1697654321000-abc123",
  "command": "APPLY_CONFIG",
  "require_ack": true,
  "payload": { ... },
  "timestamp": 1697654321000
}
```

### ACK Topic (Device → Server)

```
server/{deviceId}/ack
```

**Payload Format:**

```json
{
  "command_id": "cmd-1697654321000-abc123",
  "device_id": "D001",
  "command": "APPLY_CONFIG",
  "status": "SUCCESS",
  "result": { ... },
  "error": null,
  "timestamp": 1697654325000
}
```

## Testing with Simulator

### ใช้งาน Device Command Simulator

1. **ติดตั้ง dependencies:**

```bash
cd catcar_api_client
pip install -r requirements.txt
```

2. **เริ่มต้น simulator:**

```bash
python device_command_simulator.py
```

3. **กรอก Device ID:**

```
🆔 Enter Device ID (e.g., D001): D001
```

4. **Simulator จะเริ่มฟังคำสั่งจาก MQTT Broker**

### ทดสอบส่งคำสั่ง

1. **เริ่ม simulator ในหนึ่ง terminal:**

```bash
python device_command_simulator.py
# Enter Device ID: D001
```

2. **ส่งคำสั่งผ่าน API ในอีก terminal:**

```bash
# Get JWT token first
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Send apply config command
curl -X POST http://localhost:3000/api/v1/device-commands/D001/apply-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "machine": {
      "ACTIVE": true,
      "BANKNOTE": true,
      "COIN": true,
      "QR": true,
      "ON_TIME": "08:00",
      "OFF_TIME": "22:00",
      "SAVE_STATE": true
    }
  }'
```

3. **ดูผลลัพธ์ใน simulator:**

```
[12:34:56] 📥 Received message on device/D001/command
   Payload: {
     "command_id": "cmd-1697654321000-abc123",
     "command": "APPLY_CONFIG",
     ...
   }
🔧 Handling APPLY_CONFIG command...
✅ Configuration applied successfully
[12:34:57] 📤 ✅ ACK sent: cmd-1697654321000-abc123 - SUCCESS
```

## Error Handling

### Device Not Found

```json
{
  "success": false,
  "message": "Device D999 not found",
  "statusCode": 404
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

### Forbidden (Insufficient Permissions)

```json
{
  "success": false,
  "message": "Forbidden resource",
  "statusCode": 403
}
```

### Command Timeout

```json
{
  "success": true,
  "message": "Command sent to device D001",
  "data": {
    "command_id": "cmd-1697654321000-abc123",
    "device_id": "D001",
    "command": "APPLY_CONFIG",
    "status": "TIMEOUT",
    "error": "Device did not respond within timeout period",
    "timestamp": 1697654351000
  }
}
```

## Architecture

```
┌─────────────────┐      HTTP/REST      ┌──────────────────────┐
│                 │ ─────────────────>  │                      │
│   Frontend /    │                     │   Device Commands    │
│   External API  │                     │      Controller      │
│                 │ <─────────────────  │                      │
└─────────────────┘      Response       └──────────────────────┘
                                                    │
                                                    │ Call Service
                                                    ▼
                                        ┌──────────────────────┐
                                        │   Device Commands    │
                                        │       Service        │
                                        └──────────────────────┘
                                                    │
                                                    │ Use MQTT Manager
                                                    ▼
                                        ┌──────────────────────┐
                                        │ MQTT Command Manager │
                                        │      Service         │
                                        └──────────────────────┘
                                                    │
                                                    │ Publish Command
                                                    ▼
                                        ┌──────────────────────┐
                                        │    MQTT Broker       │
                                        │      (EMQX)          │
                                        └──────────────────────┘
                                                    │
                                   Subscribe        │         Publish ACK
                                   Command          │
                                  ┌─────────────────┴─────────────────┐
                                  │                                   │
                                  ▼                                   ▼
                        ┌──────────────────┐                ┌──────────────────┐
                        │  Physical Device │                │  Device Simulator│
                        │      (IoT)       │                │     (Testing)    │
                        └──────────────────┘                └──────────────────┘
```

## Related Services

- **MqttCommandManagerService** - จัดการส่งคำสั่ง MQTT และรอรับ ACK
- **MqttService** - Low-level MQTT client service
- **DevicesService** - จัดการข้อมูลอุปกรณ์ในฐานข้อมูล

## Notes

- คำสั่งทุกคำสั่งจะมี timeout 30 วินาที
- หากอุปกรณ์ไม่ตอบกลับภายใน timeout จะได้รับ status `TIMEOUT`
- คำสั่ง `PAYMENT` ไม่ต้องการ ACK (fire-and-forget) - ใช้สำหรับแจ้ง payment status
- คำสั่ง `MANUAL_PAYMENT` ต้องการ ACK - ใช้สำหรับส่งคำสั่งชำระเงินแบบ manual
- ควรตรวจสอบว่าอุปกรณ์เชื่อมต่ออยู่ก่อนส่งคำสั่ง

