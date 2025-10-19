# 🚗 Device Lifecycle Simulator

Simulator สำหรับจำลอง device lifecycle แบบสมบูรณ์ที่รวมการทำงาน 3 ขั้นตอน:
1. **Register** - สร้าง random device info และเรียก `/devices/need-register`
2. **Sync Configs** - เรียก `/devices/sync-configs/:device_id` พร้อม random config values
3. **Stream** - Stream device state ผ่าน MQTT แบบต่อเนื่อง

## ✨ Features

- ✅ รองรับทั้ง **WASH** และ **DRYING** device types
- ✅ Random device info (chip_id, mac_address, firmware_version)
- ✅ **Signature verification** สำหรับ API calls (x-signature header)
- ✅ Random config values ตาม device type
- ✅ Stream device state ผ่าน MQTT (60s interval, configurable)
- ✅ รองรับหลาย devices พร้อมกัน
- ✅ Interactive menu สำหรับจัดการ devices
- ✅ Statistics และ monitoring

## 📋 Requirements

```bash
pip install requests paho-mqtt
```

## 🚀 Usage

### เริ่มต้น Simulator

```bash
cd catcar_api_client
python device_lifecycle_simulator.py
```

### Configuration

เมื่อเริ่มโปรแกรม จะถามการตั้งค่า:
- **API Base URL**: URL ของ API server (default: `http://localhost:3000/api/v1`)
- **MQTT Broker Host**: MQTT broker host (default: `localhost`)
- **MQTT Broker Port**: MQTT broker port (default: `1883`)

## 📱 Menu Options

### 1. ➕ เพิ่ม Device (WASH)
เพิ่ม WASH device หนึ่งตัว โดยจะทำ:
- สร้าง random device info (chip_id, mac_address, firmware_version)
- Register กับ server → ได้ device_id
- Sync random WASH configs
- พร้อม stream เมื่อกด "เริ่ม Streaming"

**Example Output:**
```
📡 กำลัง Register Device (WASH)...
   Chip ID: A1B2C3D4
   MAC: 24:6F:28:AB:3C:91
   Firmware: carwash_HW_2.5_V3.1.42
✅ Register สำเร็จ!
   Device ID: device-A1B2C3D4
   PIN: 1234

🔄 กำลัง Sync Configs สำหรับ device-A1B2C3D4...
   Device Type: WASH
✅ Sync Configs สำเร็จ!
```

### 2. ➕ เพิ่ม Device (DRYING)
เพิ่ม DRYING device (helmet dryer) หนึ่งตัว

**Example firmware version:** `helmet_HW_1.3_V2.4.15`

### 3. 🎲 เพิ่ม 10 Random Devices (Mixed)
เพิ่ม 10 devices พร้อมกัน โดยสุ่มระหว่าง WASH และ DRYING

**Use case:** ทดสอบ system กับ devices จำนวนมาก

### 4. 🚀 เริ่ม Streaming ทั้งหมด
เริ่ม MQTT streaming สำหรับ devices ทั้งหมดที่ sync configs แล้ว

**Options:**
- กำหนด interval (วินาที) สำหรับ streaming (default: 60)

**Example Output:**
```
🚀 เริ่ม Streaming (3 devices, interval: 60s)
============================================================
✅ Device device-A1B2C3D4 เชื่อมต่อ MQTT broker สำเร็จ
✅ Device device-B2C3D4E5 เชื่อมต่อ MQTT broker สำเร็จ
✅ Device device-C3D4E5F6 เชื่อมต่อ MQTT broker สำเร็จ
[10:30:45] 📡 device-A1B2C3D4: RSSI=-76dBm, Status=NORMAL, Uptime=0min
[10:30:46] 📡 device-B2C3D4E5: RSSI=-68dBm, Status=NORMAL, Uptime=0min
```

### 5. 🛑 หยุด Streaming
หยุด streaming ทั้งหมดและตัดการเชื่อมต่อ MQTT

### 6. 📊 ดูสถิติ
แสดงสถิติการทำงานของ simulator

**Example Output:**
```
📊 Simulation Statistics
============================================================
🔢 จำนวน Devices: 3
✅ Registered: 3
🔄 Synced: 3
📡 สถานะ: กำลัง Stream
📨 จำนวน Messages ทั้งหมด: 150

📋 รายละเอียด Device:

  🆔 device-A1B2C3D4
     Type: WASH
     Registered: ✅
     Synced: ✅
     Messages: 50
     Uptime: 50 min
     Status: NORMAL 🟢
```

### 7. 📋 ดูรายการ Devices
แสดงรายการ devices ทั้งหมดพร้อมสถานะ

### 8. ❌ ออกจากโปรแกรม
ปิด simulator และทำความสะอาด connections

## 🔄 Lifecycle Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Generate Random Device Info                          │
│    - chip_id: Random 8 hex chars                        │
│    - mac_address: Random MAC XX:XX:XX:XX:XX:XX         │
│    - firmware_version: carwash_* or helmet_*           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. POST /api/v1/devices/need-register                   │
│    Response: {device_id, pin}                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Generate Random Config (based on device type)        │
│    - WASH: sec_per_baht configs                         │
│    - DRYING: function_start/function_end configs        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. POST /api/v1/devices/sync-configs/{device_id}       │
│    Headers: x-signature (SHA256)                        │
│    Body: {configs: {...}}                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Connect to MQTT Broker                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Stream Device State (every 60s)                      │
│    Topic: server/{device_id}/streaming                  │
│    Payload: {rssi, status, uptime, timestamp}           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼ (Loop)
```

## 📡 MQTT Streaming

### Topic Pattern
```
server/{device_id}/streaming
```

### Payload Format
```json
{
  "rssi": -76,
  "status": "NORMAL",
  "uptime": 50,
  "timestamp": 1758358335794
}
```

### Status Values
- `NORMAL` - อุปกรณ์ทำงานปกติ
- `ERROR` - อุปกรณ์มีข้อผิดพลาด
- `OFFLINE` - อุปกรณ์ออฟไลน์

## 🔐 Signature Verification

Simulator ใช้ signature verification ตาม PLAN-COMUNICATION.md:

```python
# Calculate signature
payload_string = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
combined = payload_string + "modernchabackdoor"
signature = hashlib.sha256(combined.encode('utf-8')).hexdigest()

# Send in header
headers = {'x-signature': signature}
```

## 🎲 Random Config Generation

### WASH Device Config
```python
{
  "configs": {
    "machine": {
      "ACTIVE": random.choice([True, False]),
      "BANKNOTE": random.choice([True, False]),
      "COIN": random.choice([True, False]),
      "QR": random.choice([True, False]),
      "ON_TIME": random.choice(["06:00", "07:00", "08:00"]),
      "OFF_TIME": random.choice(["20:00", "21:00", "22:00"]),
      "SAVE_STATE": True
    },
    "pricing": {
      "PROMOTION": random.randint(0, 20)  # 0-20%
    },
    "function": {
      "sec_per_baht": {
        "HP_WATER": random.randint(5, 30),
        "FOAM": random.randint(5, 20),
        "AIR": random.randint(5, 25),
        "WATER": random.randint(5, 30),
        "VACUUM": random.randint(10, 60),
        "BLACK_TIRE": random.randint(5, 15),
        "WAX": random.randint(3, 10),
        "AIR_FRESHENER": random.randint(5, 20),
        "PARKING_FEE": random.randint(0, 600)
      }
    }
  }
}
```

### DRYING Device Config
```python
{
  "configs": {
    "machine": {
      "ACTIVE": random.choice([True, False]),
      "BANKNOTE": random.choice([True, False]),
      "COIN": random.choice([True, False]),
      "QR": random.choice([True, False]),
      "ON_TIME": random.choice(["06:00", "07:00", "08:00"]),
      "OFF_TIME": random.choice(["20:00", "21:00", "22:00"]),
      "SAVE_STATE": True
    },
    "pricing": {
      "BASE_FEE": random.randint(20, 50),
      "PROMOTION": random.randint(0, 20),
      "WORK_PERIOD": random.randint(300, 900)  # 5-15 minutes
    },
    "function_start": {
      "DUST_BLOW": random.randint(0, 30),
      "SANITIZE": random.randint(10, 60),
      "UV": random.randint(10, 100),
      "OZONE": random.randint(20, 200),
      "DRY_BLOW": random.randint(30, 300),
      "PERFUME": random.randint(3, 50)
    },
    "function_end": {
      "DUST_BLOW": random.randint(30, 100),
      "SANITIZE": random.randint(60, 150),
      "UV": random.randint(100, 250),
      "OZONE": random.randint(200, 400),
      "DRY_BLOW": random.randint(300, 500),
      "PERFUME": random.randint(50, 100)
    }
  }
}
```

## 🐛 Troubleshooting

### ❌ Connection Error
```
❌ ไม่สามารถเชื่อมต่อกับ server ได้
```
**Solution:** ตรวจสอบว่า API server ทำงานอยู่ที่ URL ที่ระบุ

### ❌ MQTT Connection Failed
```
❌ Device device-XXX เชื่อมต่อ MQTT broker ไม่สำเร็จ: 5
```
**Solution:** ตรวจสอบว่า MQTT broker (EMQX) ทำงานอยู่

### ❌ Sync Configs Failed (Signature Error)
```
❌ Sync Configs ไม่สำเร็จ: 401
```
**Solution:** ตรวจสอบว่า SECRET_KEY ใน simulator ตรงกับ server

## 📝 Example Session

```bash
$ python device_lifecycle_simulator.py

🚗 CatCar Wash Service - Device Lifecycle Simulator
============================================================
🌐 API Base URL (default: http://localhost:3000/api/v1): 
🔗 MQTT Broker Host (default: localhost): 
🔗 MQTT Broker Port (default: 1883): 

✅ Simulator initialized
   API: http://localhost:3000/api/v1
   MQTT: localhost:1883

============================================================
🚗 CatCar Wash Service - Device Lifecycle Simulator
============================================================
📋 เลือกคำสั่ง:
1. ➕ เพิ่ม Device (WASH)
2. ➕ เพิ่ม Device (DRYING)
3. 🎲 เพิ่ม 10 Random Devices (Mixed)
4. 🚀 เริ่ม Streaming ทั้งหมด
5. 🛑 หยุด Streaming
6. 📊 ดูสถิติ
7. 📋 ดูรายการ Devices
8. ❌ ออกจากโปรแกรม
============================================================
👉 เลือกคำสั่ง (1-8): 1

➕ เพิ่ม WASH Device
----------------------------------------

📡 กำลัง Register Device (WASH)...
   Chip ID: A1B2C3D4
   MAC: 24:6F:28:AB:3C:91
   Firmware: carwash_HW_2.5_V3.1.42
✅ Register สำเร็จ!
   Device ID: device-A1B2C3D4
   PIN: 1234

🔄 กำลัง Sync Configs สำหรับ device-A1B2C3D4...
   Device Type: WASH
✅ Sync Configs สำเร็จ!
✅ Device device-A1B2C3D4 พร้อมสำหรับ streaming!

⏸️  กด Enter เพื่อกลับไปเมนูหลัก...
```

## 🎯 Use Cases

### 1. Development Testing
ใช้ทดสอบ API endpoints และ MQTT streaming ในระหว่างพัฒนา

### 2. Load Testing
เพิ่ม devices จำนวนมากเพื่อทดสอบ performance

### 3. Demo
แสดงการทำงานของระบบแบบ end-to-end

### 4. Integration Testing
ทดสอบการ integrate ระหว่าง API, MQTT และ database

## 📚 Related Files

- `catcar_client.py` - Basic API client (need-register only)
- `mqtt_device_simulator.py` - MQTT streaming only
- `payment_device_simulator.py` - Payment flow simulation
- `device_command_simulator.py` - Device command simulation

## 🔗 API Endpoints Used

1. `POST /api/v1/devices/need-register` - Register device
2. `POST /api/v1/devices/sync-configs/{device_id}` - Sync device configs (with x-signature)

## 📖 Documentation

- [PLAN-COMUNICATION.md](../PLAN-COMUNICATION.md) - API specification
- [Device Registration](./README.md) - Device registration flow
- [MQTT Simulator](./README_MQTT_SIMULATOR.md) - MQTT streaming details

