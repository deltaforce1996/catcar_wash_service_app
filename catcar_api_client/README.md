# CatCar API Client

Python client และ simulators สำหรับทดสอบ CatCar Wash Service

## โครงสร้างไฟล์

```
catcar_api_client/
├── README.md                              # เอกสารนี้
├── catcar_client.py                       # API Client หลัก
├── mqtt_device_simulator.py               # MQTT Device State Simulator
├── payment_device_simulator.py            # Payment Device Simulator
├── device_command_simulator.py            # Device Command Simulator (รับคำสั่ง)
├── test_device_commands.py                # API Tester (ส่งคำสั่ง)
├── requirements.txt                       # Dependencies
├── README_MQTT_SIMULATOR.md               # เอกสาร MQTT Simulator
├── README_PAYMENT_SIMULATOR.md            # เอกสาร Payment Simulator
├── README_DEVICE_COMMAND_SIMULATOR.md     # เอกสาร Device Command Simulator
└── README_TEST_DEVICE_COMMANDS.md         # เอกสาร API Tester
```

## การติดตั้ง

1. **ติดตั้ง Python dependencies:**
   ```bash
   cd catcar_api_client`
   pip install -r requirements.txt
   ```

## การใช้งาน

### 1. CatCar Client

เรียกใช้ API client พร้อมระบบเลือก Command

```bash
python catcar_client.py
```

**Commands ที่มี:**
1. 🔧 **Need Register** - สร้าง registration session
2. 📊 **View Last Result** - ดูผลลัพธ์ล่าสุด
3. 🔄 **Change Base URL** - เปลี่ยน URL
4. ❌ **Exit** - ออกจากโปรแกรม

### 2. MQTT Device State Simulator

จำลองอุปกรณ์ที่ส่ง state streaming ผ่าน MQTT

```bash
python mqtt_device_simulator.py
```

ดูรายละเอียดใน [README_MQTT_SIMULATOR.md](./README_MQTT_SIMULATOR.md)

### 3. Payment Device Simulator

จำลองอุปกรณ์ที่ขอชำระเงินผ่าน Payment Gateway

```bash
python payment_device_simulator.py
```

ดูรายละเอียดใน [README_PAYMENT_SIMULATOR.md](./README_PAYMENT_SIMULATOR.md)

### 4. Device Command Simulator (รับคำสั่ง)

จำลองอุปกรณ์ที่รับและตอบคำสั่งผ่าน MQTT

```bash
python device_command_simulator.py
# Enter Device ID: D001
```

**คำสั่งที่รองรับ:**
- `APPLY_CONFIG` - รับ configuration ใหม่
- `RESTART` - รีสตาร์ท
- `UPDATE_FIRMWARE` - อัพเดท firmware
- `RESET_CONFIG` - รีเซ็ต configuration
- `PAYMENT` - รับข้อมูลการชำระเงิน

ดูรายละเอียดใน [README_DEVICE_COMMAND_SIMULATOR.md](./README_DEVICE_COMMAND_SIMULATOR.md)

### 5. Test Device Commands API (ส่งคำสั่ง)

ทดสอบส่งคำสั่งไปยังอุปกรณ์ผ่าน REST API

```bash
python test_device_commands.py
# Enter Device ID: D001
```

**คำสั่งที่ทดสอบได้:**
1. 🔧 APPLY_CONFIG
2. 🔄 RESTART
3. 📦 UPDATE_FIRMWARE
4. ♻️  RESET_CONFIG
5. ⚙️  CUSTOM
6. 🚀 TEST ALL

ดูรายละเอียดใน [README_TEST_DEVICE_COMMANDS.md](./README_TEST_DEVICE_COMMANDS.md)

## ตัวอย่างการใช้งาน

```bash
# รัน script
python catcar_client.py

# เลือก Base URL
🌐 ใส่ Base URL (default: http://localhost:3000): 

# เมนูหลัก
🚗 CatCar Wash Service - API Client
==================================================
📋 เลือก Command ที่ต้องการ:
1. 🔧 Need Register - สร้าง registration session
2. 📊 View Last Result - ดูผลลัพธ์ล่าสุด
3. 🔄 Change Base URL - เปลี่ยน URL
4. ❌ Exit - ออกจากโปรแกรม
==================================================
👉 เลือก command (1-4): 1

# Need Register Command
🔧 Need Register Command
------------------------------
🔧 Chip ID: ESP32-001
🌐 MAC Address: AA:BB:CC:DD:EE:FF
⚙️ Firmware Version: 1.0.0

# ผลลัพธ์
✅ สำเร็จ!
📌 PIN: 123456
🆔 Device ID: temp-ESP32-001
💬 Message: Device registration session created successfully
💾 ผลลัพธ์ถูกเก็บไว้แล้ว สามารถใช้ได้ในครั้งต่อไป
```

## API Endpoints

### POST /devices/need-register

สร้าง registration session สำหรับอุปกรณ์

**Request Body:**
```json
{
  "chip_id": "string",
  "mac_address": "string", 
  "firmware_version": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pin": "string",
    "device_id": "string"
  },
  "message": "Device registration session created successfully"
}
```

## Features

- ✅ เก็บผลลัพธ์ไว้ใช้ใน command ต่อไป
- ✅ แสดงผลลัพธ์แบบสวยงาม
- ✅ จัดการ error และ connection
- ✅ ตรวจสอบข้อมูล input
- ✅ รันได้หลายครั้ง

## Complete Testing Flow

### ทดสอบ Device Commands API

**Terminal 1: Start MQTT Broker**
```bash
docker-compose -f docker-compose.develop.yml up emqx
```

**Terminal 2: Start Backend Server**
```bash
cd catcar_wash_service_serve
pnpm run start:dev
```

**Terminal 3: Start Device Command Simulator (รับคำสั่ง)**
```bash
cd catcar_api_client
python device_command_simulator.py
# Enter Device ID: D001
```

**Terminal 4: Test Device Commands API (ส่งคำสั่ง)**
```bash
cd catcar_api_client
python test_device_commands.py
# Enter Device ID: D001
# Choose option: 6 (TEST ALL)
```

### ทดสอบ Device State Streaming

**Terminal 1: Start MQTT Broker**
```bash
docker-compose -f docker-compose.develop.yml up emqx
```

**Terminal 2: Start Backend Server**
```bash
cd catcar_wash_service_serve
pnpm run start:dev
```

**Terminal 3: Start MQTT Device Simulator**
```bash
cd catcar_api_client
python mqtt_device_simulator.py
# Add devices and start simulation
```

## Requirements

- Python 3.7+
- requests >= 2.31.0
- paho-mqtt >= 1.6.1
- PyYAML >= 6.0
- qrcode >= 7.4.2
