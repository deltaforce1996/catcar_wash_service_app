# Device Commands API Tester

Python script สำหรับทดสอบ Device Commands API โดยการส่งคำสั่งต่างๆ ไปยังอุปกรณ์ผ่าน REST API

## Overview

Test script นี้ช่วยให้คุณสามารถทดสอบการส่งคำสั่งไปยังอุปกรณ์ผ่าน Device Commands API ได้อย่างง่ายดาย โดยไม่ต้องเขียน `curl` command หรือใช้ Postman

## Features

✅ ทดสอบคำสั่งทั้ง 6 ประเภท:
- `APPLY_CONFIG` - ส่ง configuration ใหม่
- `RESTART` - รีสตาร์ทอุปกรณ์
- `UPDATE_FIRMWARE` - อัพเดท firmware
- `RESET_CONFIG` - รีเซ็ต configuration
- `MANUAL_PAYMENT` - ส่งคำสั่งชำระเงินแบบ manual
- `CUSTOM` - ส่งคำสั่งกำหนดเอง

✅ ทดสอบทีละคำสั่งหรือทดสอบทั้งหมดพร้อมกัน
✅ แสดงผลลัพธ์แบบ formatted JSON
✅ ไม่ต้องการ JWT Token (No authentication required)
✅ รองรับการตั้งค่า API URL

## Requirements

- Python 3.7+
- requests

## Installation

```bash
cd catcar_api_client
pip install -r requirements.txt
```

หรือติดตั้งแยก:

```bash
pip install requests
```

## Usage

### เริ่มต้น Tester

```bash
python test_device_commands.py
```

### กรอก Device ID

```
🆔 Enter Device ID (e.g., D001): D001
```

### เลือกคำสั่งที่ต้องการทดสอบ

```
============================================================
🚗 CatCar Wash Service - Device Commands API Tester
============================================================
📋 เลือกคำสั่งที่ต้องการทดสอบ:
1. 🔧 APPLY_CONFIG - ส่ง configuration ใหม่
2. 🔄 RESTART - รีสตาร์ทอุปกรณ์
3. 📦 UPDATE_FIRMWARE - อัพเดท firmware
4. ♻️  RESET_CONFIG - รีเซ็ต configuration
5. 💰 MANUAL_PAYMENT - ส่งคำสั่งชำระเงินแบบ manual
6. ⚙️  CUSTOM - ส่งคำสั่งกำหนดเอง
7. 🚀 TEST ALL - ทดสอบทุกคำสั่ง
8. ⚙️  SETTINGS - ตั้งค่า API URL
9. ❌ EXIT - ออกจากโปรแกรม
============================================================
```

## Test Scenarios

### 1. Test APPLY_CONFIG

ทดสอบส่ง configuration ใหม่ให้อุปกรณ์

**Output:**

```
============================================================
🔧 Testing APPLY_CONFIG Command
============================================================
Target Device: D001
Endpoint: http://localhost:3000/api/v1/device-commands/D001/apply-config

[12:34:56] 📤 Sent: APPLY_CONFIG
Status Code: 200
Response:
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
✅ Command executed successfully
```

### 2. Test RESTART

ทดสอบคำสั่งรีสตาร์ทอุปกรณ์

**Prompt:**

```
⏱️  Delay seconds (default: 5): 10
```

**Output:**

```
============================================================
🔄 Testing RESTART Command
============================================================
Target Device: D001
Delay: 10 seconds
Endpoint: http://localhost:3000/api/v1/device-commands/D001/restart

[12:35:10] 📤 Sent: RESTART
Status Code: 200
Response:
{
  "success": true,
  "message": "Restart command sent to device D001",
  "data": {
    "command_id": "cmd-1697654330000-def456",
    "device_id": "D001",
    "command": "RESTART",
    "status": "SUCCESS",
    "timestamp": 1697654335000
  }
}
✅ Command executed successfully
```

### 3. Test UPDATE_FIRMWARE

ทดสอบคำสั่งอัพเดท firmware

**Output:**

```
============================================================
📦 Testing UPDATE_FIRMWARE Command
============================================================
Target Device: D001
Firmware Version: 2.0.0
Endpoint: http://localhost:3000/api/v1/device-commands/D001/update-firmware

[12:36:20] 📤 Sent: UPDATE_FIRMWARE
Status Code: 200
Response:
{
  "success": true,
  "message": "Firmware update command sent to device D001",
  "data": {
    "command_id": "cmd-1697654380000-ghi789",
    "device_id": "D001",
    "command": "UPDATE_FIRMWARE",
    "status": "SUCCESS",
    "timestamp": 1697654385000,
    "results": {
      "version": "2.0.0",
      "download_started": true,
      "estimated_time": 300
    }
  }
}
✅ Command executed successfully
```

### 4. Test RESET_CONFIG

ทดสอบคำสั่งรีเซ็ต configuration

**Output:**

```
============================================================
♻️ Testing RESET_CONFIG Command
============================================================
Target Device: D001
Endpoint: http://localhost:3000/api/v1/device-commands/D001/reset-config

[12:37:30] 📤 Sent: RESET_CONFIG
Status Code: 200
Response:
{
  "success": true,
  "message": "Config reset command sent to device D001",
  "data": {
    "command_id": "cmd-1697654450000-jkl012",
    "device_id": "D001",
    "command": "RESET_CONFIG",
    "status": "SUCCESS",
    "timestamp": 1697654455000
  }
}
✅ Command executed successfully
```

### 5. Test MANUAL_PAYMENT

ทดสอบคำสั่งชำระเงินแบบ manual

**Prompt:**

```
💰 Amount (baht, default: 50): 100
```

**Output:**

```
============================================================
💰 Testing MANUAL_PAYMENT Command
============================================================
Target Device: D001
Amount: 100 baht
Endpoint: http://localhost:3000/api/v1/device-commands/D001/manual-payment

[12:38:10] 📤 Sent: MANUAL_PAYMENT
Status Code: 200
Response:
{
  "success": true,
  "message": "Manual payment sent to device D001",
  "data": {
    "command_id": "cmd-1697654490000-xyz123",
    "device_id": "D001",
    "command": "MANUAL_PAYMENT",
    "status": "SUCCESS",
    "timestamp": 1697654495000,
    "results": {
      "amount": 100,
      "expire_at": 1697654505000,
      "accepted": true
    }
  }
}
✅ Command executed successfully
```

### 6. Test CUSTOM Command

ทดสอบส่งคำสั่งกำหนดเอง

**Output:**

```
============================================================
⚙️  Testing CUSTOM Command
============================================================
Target Device: D001
Custom Command: MY_CUSTOM_COMMAND
Endpoint: http://localhost:3000/api/v1/device-commands/D001/custom

[12:38:40] 📤 Sent: CUSTOM
Status Code: 200
Response:
{
  "success": true,
  "message": "Custom command sent to device D001",
  "data": {
    "command_id": "cmd-1697654520000-mno345",
    "device_id": "D001",
    "command": "MY_CUSTOM_COMMAND",
    "status": "SUCCESS",
    "timestamp": 1697654525000
  }
}
✅ Command executed successfully
```

### 7. Test All Commands

ทดสอบคำสั่งทั้งหมดพร้อมกัน

**Prompt:**

```
⏱️  Delay between tests (seconds, default: 2): 3
```

**Output:**

```
======================================================================
🚀 Testing All Device Commands
======================================================================
Target Device: D001
API Base URL: http://localhost:3000
======================================================================

📝 Test 1/6: APPLY_CONFIG
... (results)

📝 Test 2/6: RESTART
... (results)

📝 Test 3/6: UPDATE_FIRMWARE
... (results)

📝 Test 4/6: RESET_CONFIG
... (results)

📝 Test 5/6: MANUAL_PAYMENT
... (results)

📝 Test 6/6: CUSTOM
... (results)

======================================================================
📊 Test Summary
======================================================================
Total Tests: 6
✅ Passed: 6
❌ Failed: 0
======================================================================
```

## Complete Testing Flow

### Terminal 1: Start MQTT Broker

```bash
docker-compose -f docker-compose.develop.yml up emqx
```

### Terminal 2: Start Backend Server

```bash
cd catcar_wash_service_serve
pnpm run start:dev
```

### Terminal 3: Start Device Simulator

```bash
cd catcar_api_client
python device_command_simulator.py
# Enter Device ID: D001
```

### Terminal 4: Run API Tester

```bash
cd catcar_api_client
python test_device_commands.py
# Enter Device ID: D001
# Choose option: 6 (TEST ALL)
```

### Observe Results

- **Terminal 2 (Backend):** แสดง log การส่งคำสั่ง MQTT
- **Terminal 3 (Device Simulator):** แสดงการรับและตอบคำสั่ง
- **Terminal 4 (API Tester):** แสดงผลลัพธ์ API response

## Configuration

### Change API URL

เลือก option `8` จาก menu:

```
👉 เลือกคำสั่ง (1-9): 8
🔗 Enter API URL (current: http://localhost:3000): http://192.168.1.100:3000
✅ API URL updated to: http://192.168.1.100:3000
```

### Customize Test Data

แก้ไขใน code:

```python
# test_device_commands.py

def test_apply_config(self, device_id: str):
    payload = {
        "machine": {
            "ACTIVE": True,
            "BANKNOTE": False,  # แก้ไขค่าตามต้องการ
            ...
        }
    }
```

## Response Status Codes

| Status | Description |
|--------|-------------|
| `200` | Success - คำสั่งถูกส่งและได้รับ response |
| `404` | Device not found - ไม่พบ device ในฐานข้อมูล |
| `500` | Server error - เกิดข้อผิดพลาดที่ server |
| `Timeout` | Request timeout - ไม่ได้รับ response ภายใน 35 วินาที |

## Command Status

| Status | Description |
|--------|-------------|
| `SENT` | คำสั่งถูกส่งไปยังอุปกรณ์แล้ว |
| `SUCCESS` | ✅ อุปกรณ์ดำเนินการคำสั่งสำเร็จ |
| `FAILED` | ❌ อุปกรณ์ดำเนินการคำสั่งไม่สำเร็จ |
| `TIMEOUT` | ⏱️  อุปกรณ์ไม่ตอบกลับภายในเวลาที่กำหนด |
| `ERROR` | ❌ เกิดข้อผิดพลาดในการส่งคำสั่ง |

## Troubleshooting

### Connection Refused

```
❌ Error: Connection refused
```

**Solution:**
- ตรวจสอบว่า Backend Server ทำงานอยู่
- ตรวจสอบ API URL ว่าถูกต้อง
- ตรวจสอบ port ว่าเปิดอยู่

### Device Not Found

```
Response:
{
  "success": false,
  "message": "Device D999 not found",
  "statusCode": 404
}
```

**Solution:**
- ตรวจสอบว่า Device ID ถูกต้อง
- ตรวจสอบว่าอุปกรณ์ถูกสร้างในฐานข้อมูลแล้ว

### Request Timeout

```
⏱️  Request timeout (35s)
```

**Solution:**
- ตรวจสอบว่า Device Simulator ทำงานอยู่
- ตรวจสอบว่า MQTT Broker ทำงานอยู่
- ตรวจสอบว่า Device ID ตรงกัน

## Advanced Usage

### Test with Custom Timeout

```python
# แก้ไขใน code
response = requests.post(url, json=payload, timeout=60)  # เพิ่ม timeout เป็น 60 วินาที
```

### Test Multiple Devices

รัน script หลายครั้งใน terminal ที่ต่างกัน:

```bash
# Terminal 4
python test_device_commands.py
# Device ID: D001

# Terminal 5
python test_device_commands.py
# Device ID: D002
```

### Save Test Results

```bash
python test_device_commands.py > test_results.log 2>&1
```

## Related Documentation

- [Device Commands API README](../catcar_wash_service_serve/src/apis/device-commands/README.md)
- [Device Command Simulator](./README_DEVICE_COMMAND_SIMULATOR.md)
- [MQTT Communication Plan](../PLAN-COMUNICATION.md)

## Tips

💡 ใช้ option `7` (TEST ALL) เพื่อทดสอบทุกคำสั่งอย่างรวดเร็ว (ทั้งหมด 6 คำสั่ง)

💡 เปิด Device Simulator ก่อนทดสอบเพื่อดูผลลัพธ์แบบ real-time

💡 ตรวจสอบ Backend Server logs เพื่อดู MQTT communication

💡 ใช้ delay 2-3 วินาทีระหว่างการทดสอบเพื่อให้อุปกรณ์มีเวลาประมวลผล

💡 ทดสอบ MANUAL_PAYMENT เพื่อดูการทำงานของระบบชำระเงินแบบ manual บนอุปกรณ์

