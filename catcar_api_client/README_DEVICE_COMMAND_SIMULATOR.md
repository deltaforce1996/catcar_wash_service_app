# Device Command Simulator

Python simulator สำหรับจำลองอุปกรณ์ (Device) ที่รับและตอบคำสั่งผ่าน MQTT Protocol

## Overview

Device Command Simulator ใช้สำหรับทดสอบระบบส่งคำสั่งไปยังอุปกรณ์ โดยจำลองการทำงานของอุปกรณ์จริงในการ:
- รับคำสั่งจาก MQTT Broker
- ประมวลผลคำสั่ง (จำลองการทำงาน)
- ส่ง Acknowledgment (ACK) กลับไปยัง Server

## Features

✅ รองรับคำสั่งหลัก 5 ประเภท:
- `APPLY_CONFIG` - ใช้ configuration ใหม่
- `RESTART` - รีสตาร์ทอุปกรณ์
- `UPDATE_FIRMWARE` - อัพเดท firmware
- `RESET_CONFIG` - รีเซ็ต configuration
- `PAYMENT` - รับข้อมูลสถานะการชำระเงิน

✅ จำลองความสำเร็จและความล้มเหลวแบบสุ่ม
✅ แสดงสถิติการทำงาน
✅ รองรับ Graceful Shutdown

## Requirements

- Python 3.7+
- paho-mqtt
- PyYAML

## Installation

```bash
cd catcar_api_client
pip install -r requirements.txt
```

หรือติดตั้งแยก:

```bash
pip install paho-mqtt PyYAML
```

## Usage

### เริ่มต้น Simulator

```bash
python device_command_simulator.py
```

### กรอก Device ID

```
🆔 Enter Device ID (e.g., D001): D001
```

### Simulator จะแสดงข้อมูล

```
🚗 CatCar Wash Service - Device Command Simulator
============================================================
🔗 MQTT Broker: localhost:1883
✅ Device D001 เชื่อมต่อ MQTT broker สำเร็จ
📡 Subscribed to: device/D001/command
📡 Subscribed to: device/D001/payment-status

============================================================
🚀 Device Command Simulator Started
============================================================
📱 Device ID: D001
🔗 MQTT Broker: localhost:1883
📡 Listening on: device/D001/command
📡 Listening on: device/D001/payment-status
============================================================
✅ Waiting for commands... (Press Ctrl+C to stop)
```

## Simulated Command Behavior

### APPLY_CONFIG

- **Processing Time:** 0.5 - 1.5 seconds
- **Success Rate:** 90%
- **Success Response:**
  ```json
  {
    "config_applied": { ... },
    "timestamp": 1697654321000
  }
  ```
- **Failure Reason:** "Failed to apply configuration: Validation error"

### RESTART

- **Processing Time:** 0.5 seconds
- **Success Rate:** 95%
- **Success Response:**
  ```json
  {
    "delay_seconds": 5,
    "restart_at": 1697654326000
  }
  ```
- **Failure Reason:** "Failed to restart: System busy"

### UPDATE_FIRMWARE

- **Processing Time:** 1.0 - 2.0 seconds (simulates download)
- **Success Rate:** 85%
- **Success Response:**
  ```json
  {
    "version": "2.0.0",
    "download_started": true,
    "estimated_time": 300
  }
  ```
- **Failure Reason:** "Failed to update firmware: Download failed"

### RESET_CONFIG

- **Processing Time:** 0.5 - 1.5 seconds
- **Success Rate:** 92%
- **Success Response:**
  ```json
  {
    "config_reset": { ... },
    "timestamp": 1697654321000
  }
  ```
- **Failure Reason:** "Failed to reset configuration: Invalid config"

### PAYMENT

- **Processing Time:** Immediate
- **Success Rate:** 100% (notification only, no ACK)
- **Response:**
  ```json
  {
    "charge_id": "CHG123",
    "status": "SUCCEEDED",
    "processed_at": 1697654321000
  }
  ```

## Example Output

### Receiving APPLY_CONFIG Command

```
[12:34:56] 📥 Received message on device/D001/command
   Payload: {
     "command_id": "cmd-1697654321000-abc123",
     "command": "APPLY_CONFIG",
     "require_ack": true,
     "payload": {
       "machine": {
         "ACTIVE": true,
         "BANKNOTE": true,
         ...
       }
     },
     "timestamp": 1697654321000
   }
🔧 Handling APPLY_CONFIG command...
✅ Configuration applied successfully
[12:34:57] 📤 ✅ ACK sent: cmd-1697654321000-abc123 - SUCCESS
```

### Receiving RESTART Command

```
[12:35:10] 📥 Received message on device/D001/command
   Payload: {
     "command_id": "cmd-1697654330000-def456",
     "command": "RESTART",
     "require_ack": true,
     "payload": {
       "delay_seconds": 5
     },
     "timestamp": 1697654330000
   }
🔄 Handling RESTART command...
   Device will restart in 5 seconds...
✅ Restart command accepted
[12:35:11] 📤 ✅ ACK sent: cmd-1697654330000-def456 - SUCCESS
```

### Stopping Simulator

```
^C
🛑 รับสัญญาณ 2 กำลังปิด simulator...
👋 Stopping simulator...
🔌 Device D001 disconnected from MQTT broker

============================================================
📊 Simulator Statistics
============================================================
📥 Commands received: 10
📤 Commands acknowledged: 10
============================================================
✅ Simulator stopped
```

## Testing Flow

### 1. Start MQTT Broker (EMQX)

```bash
docker-compose -f docker-compose.develop.yml up emqx
```

### 2. Start Backend Server

```bash
cd catcar_wash_service_serve
pnpm install
pnpm run start:dev
```

### 3. Start Device Simulator

```bash
cd catcar_api_client
python device_command_simulator.py
# Enter Device ID: D001
```

### 4. Send Command via API

```bash
# Login and get JWT token
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

### 5. Observe Results

- **Backend Server:** จะแสดง log การส่งคำสั่งและรับ ACK
- **Device Simulator:** จะแสดงการรับคำสั่งและส่ง ACK
- **API Response:** จะได้รับผลลัพธ์พร้อม status

## Configuration

### MQTT Broker Settings

Simulator จะพยายามอ่าน configuration จาก `docker-compose.develop.yml` อัตโนมัติ

ถ้าไม่พบจะใช้ค่า default:
- **Host:** `localhost`
- **Port:** `1883`

### Custom Configuration

แก้ไขใน code:

```python
# Custom broker settings
simulator = DeviceCommandSimulator(
    device_id="D001",
    broker_host="192.168.1.100",  # Custom host
    broker_port=1883               # Custom port
)
```

## MQTT Topics

### Subscribe Topics (Device listens)

```
device/{deviceId}/command           # Command from server
device/{deviceId}/payment-status    # Payment notifications
```

### Publish Topics (Device sends)

```
server/{deviceId}/ack              # ACK responses to server
```

## Troubleshooting

### Connection Failed

```
❌ Device D001 เชื่อมต่อ MQTT broker ไม่สำเร็จ: 1
```

**Solution:**
- ตรวจสอบว่า MQTT Broker (EMQX) ทำงานอยู่
- ตรวจสอบ host และ port ว่าถูกต้อง
- ตรวจสอบ firewall settings

### No Commands Received

**Solution:**
- ตรวจสอบว่า Device ID ถูกต้อง
- ตรวจสอบว่า Backend Server ทำงานอยู่
- ตรวจสอบว่า MQTT topics ถูกต้อง
- ใช้ MQTT Client (เช่น MQTT Explorer) ตรวจสอบ

### ACK Not Received by Server

**Solution:**
- ตรวจสอบ ACK topic: `server/{deviceId}/ack`
- ตรวจสอบว่า Backend subscribe topic นี้แล้ว
- ตรวจสอบ JSON format ของ ACK payload

## Advanced Usage

### Multiple Devices

เปิดหลาย terminal และรัน simulator แยกกัน:

```bash
# Terminal 1
python device_command_simulator.py
# Enter Device ID: D001

# Terminal 2
python device_command_simulator.py
# Enter Device ID: D002

# Terminal 3
python device_command_simulator.py
# Enter Device ID: D003
```

### Custom Success Rate

แก้ไขใน code:

```python
def _handle_apply_config(self, payload: dict) -> tuple:
    # Change success rate from 90% to 50%
    success = random.random() < 0.5  # Was 0.9
    ...
```

## Related Documentation

- [Device Commands API README](../catcar_wash_service_serve/src/apis/device-commands/README.md)
- [MQTT Communication Plan](../PLAN-COMUNICATION.md)
- [MQTT Device Simulator](./README_MQTT_SIMULATOR.md)

## Notes

- Simulator จะจำลองเวลาในการประมวลผลแต่ละคำสั่ง
- Success rate ของแต่ละคำสั่งถูกตั้งค่าให้สมจริง
- คำสั่ง PAYMENT ไม่ส่ง ACK (notification only)
- สามารถกด Ctrl+C เพื่อหยุด simulator ได้ทุกเวลา

