# CatCar API Client

Python client สำหรับเรียกใช้ CatCar Wash Service API endpoints พร้อมระบบเลือก Command

## โครงสร้างไฟล์

```
catcar_api_client/
├── README.md                    # เอกสารนี้
├── catcar_client.py             # Script หลักพร้อมระบบเลือก Command
└── requirements.txt             # Dependencies
```

## การติดตั้ง

1. **ติดตั้ง Python dependencies:**
   ```bash
   cd catcar_api_client`
   pip install -r requirements.txt
   ```

## การใช้งาน

### CatCar Client

เรียกใช้ API client พร้อมระบบเลือก Command

```bash
python catcar_client.py
```

**Commands ที่มี:**
1. 🔧 **Need Register** - สร้าง registration session
2. 📊 **View Last Result** - ดูผลลัพธ์ล่าสุด
3. 🔄 **Change Base URL** - เปลี่ยน URL
4. ❌ **Exit** - ออกจากโปรแกรม

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

## Requirements

- Python 3.7+
- requests >= 2.31.0
