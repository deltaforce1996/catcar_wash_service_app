# MQTT Device State Simulator

เครื่องมือ simulator สำหรับจำลองการส่ง device state streaming ผ่าน MQTT ตาม specification ใน PLAN-COMUNICATION.md

## Features

- 🔗 เชื่อมต่อ MQTT broker (EMQX) อัตโนมัติ
- 🚀 จำลองได้หลาย devices พร้อมกัน (multi-threading)
- 📡 ส่ง state ทุก 60 วินาทีผ่าน topic `server/{device_id}/streaming`
- 📊 รองรับ status types: `NORMAL`, `ERROR`, `OFFLINE`
- 🎲 สุ่มค่า RSSI และข้อมูลอื่นๆ
- 📈 แสดงสถิติการส่งข้อมูลแบบ real-time
- 🎮 Interactive menu สำหรับควบคุม

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
cd catcar_api_client
pip install -r requirements.txt
```

2. เริ่ม MQTT broker:
```bash
# ใน root directory ของ project
docker-compose -f docker-compose.develop.yml up emqx
```

## การใช้งาน

1. รัน simulator:
```bash
python mqtt_device_simulator.py
```

2. ใช้เมนูสำหรับควบคุม:
   - เพิ่ม/ลบ devices
   - เปลี่ยน device status
   - เพิ่ม 100 devices พร้อม random status
   - เริ่ม/หยุด simulation
   - ดูสถิติ

## Topic Structure

```
server/{device_id}/streaming
```

## Payload Format

```json
{
  "rssi": -76,
  "status": "NORMAL",
  "uptime": 39623,
  "timestamp": 1758358335794
}
```

## Configuration

Simulator จะอ่าน MQTT configuration จาก `docker-compose.develop.yml` อัตโนมัติ:
- Host: localhost
- Port: 1883
- ไม่ต้องใช้ username/password

## ตัวอย่างการใช้งาน

1. **เริ่ม EMQX broker:**
```bash
docker-compose -f docker-compose.develop.yml up emqx
```

2. **รัน simulator:**
```bash
python mqtt_device_simulator.py
```

3. **เพิ่ม device:**
```
เลือก 1. ➕ เพิ่ม Device
Device ID: device-001
Status: 1 (NORMAL)
```

4. **เพิ่ม 100 devices (Random Status):**
```
เลือก 4. 🎲 เพิ่ม 100 Devices (Random Status)
📊 Progress: 10/100 devices processed...
📊 Progress: 20/100 devices processed...
...
✅ เสร็จสิ้น!
📈 สำเร็จ: 100 devices
📊 รวม: 100 devices ในระบบ
```

5. **เริ่ม simulation:**
```
เลือก 5. 🚀 เริ่ม Simulation
Interval: 60
```

6. **ดูผลลัพธ์:**
```
[14:30:15] 📡 device-001: RSSI=-65dBm, Status=NORMAL, Uptime=1min
[14:31:15] 📡 device-001: RSSI=-68dBm, Status=NORMAL, Uptime=2min
```

## การหยุด

- กด `Ctrl+C` เพื่อหยุด simulator
- หรือเลือก `8. ❌ ออกจากโปรแกรม` ในเมนู

## Server Behavior (Device State Processor)

### ⚙️ Rate Limiting
- Server จำกัดการรับข้อมูลที่ **8 messages/minute ต่อ device**
- ใช้ **Sliding Window Algorithm** สำหรับความแม่นยำ
- ข้อความที่เกินจะถูก skip แต่ **ไม่ถือว่า offline**

### 🔴 Offline Detection
- Server ตรวจสอบทุก **5 วินาที**
- ถ้า device ไม่ส่งข้อมูลเกิน **10 วินาที** → ถือว่า **OFFLINE**
- ระบบจะบันทึก offline state อัตโนมัติ

### ⚠️ Important Notes
- **Rate limited ≠ Offline**: Device ที่ส่งข้อมูลบ่อยเกินไป (rate limited) จะ**ไม่ถูกมองว่า offline**
- เพื่อทดสอบ offline detection ให้หยุดส่งข้อมูลจาก device นาน > 10 วินาที

## 📊 Log Icons (Server)

เมื่อ Server ได้รับข้อมูล จะแสดง emoji icons เหล่านี้ใน log:

| Icon | ความหมาย | ใช้งาน |
|------|---------|--------|
| 📥 | รับข้อความจาก Device | ทุกครั้งที่รับข้อมูล |
| ✅ | ดำเนินการสำเร็จ | บันทึกข้อมูลสำเร็จ |
| ⚠️ | Rate Limited / Warning | เกินขีดจำกัด 8/min |
| ❌ | Error เกิดขึ้น | Device ไม่พบหรือ error |
| ⚙️ | Batch Processing | ประมวลผล batch |
| 🔍 | ค้นหา Device | Query database |
| 💾 | บันทึกข้อมูล | Insert/Update DB |
| 🔴 | Device Offline | หยุดส่งข้อมูล > 10s |
| 🧹 | Cleanup | ทำความสะอาด cache |

## 🧪 Testing Scenarios

### ทดสอบ Rate Limiting
1. ตั้ง interval < 7 วินาที (เช่น 5 วินาที)
2. ดู server log จะเห็น `⚠️ Rate limited` แต่ device **ยังไม่ offline**

**ผลลัพธ์ที่คาดหวัง:**
```
📥 [Device device-001] ==> [Server] streaming message: {...}
✅ Message queued for batch processing: device-001
⚠️ Rate limited: Device device-001 - skipping message
⚠️ Rate limited: Device device-001 - skipping message
```

### ทดสอบ Offline Detection
1. เริ่ม device ด้วย interval 60 วินาที
2. หยุด simulation (เลือก 6)
3. รอ 10+ วินาที
4. Server จะแสดง `🔴 Device marked as offline`

**ผลลัพธ์ที่คาดหวัง:**
```
📥 [Device device-001] ==> [Server] streaming message: {...}
... (10+ วินาทีผ่านไป)
🔴 Detected 1 offline devices
🔴 Device marked as offline: device-001
```

### ทดสอบ Batch Processing
1. เพิ่ม 100 devices พร้อมกัน
2. เริ่ม simulation ทุก device
3. Server จะประมวลผลแบบ batch (50 messages ต่อรอบ / 5 วินาที)

**ผลลัพธ์ที่คาดหวัง:**
```
⚙️ Processing batch of 50 messages from 50 unique devices
🔍 Found 50/50 devices in database
💾 Batch inserted 50 device states
🔄 Batch upserted 50 last device states
✅ Successfully processed 50 messages
⏱️ Batch processed in 45ms
```

## Troubleshooting

**❌ เชื่อมต่อ MQTT broker ไม่ได้:**
- ตรวจสอบว่า EMQX ทำงานอยู่: `docker ps`
- ตรวจสอบ port 1883: `telnet localhost 1883`

**❌ ไม่พบ docker-compose.develop.yml:**
- ตรวจสอบ path ของไฟล์
- หรือใช้ค่า default: localhost:1883

**❌ ไม่มีการส่งข้อมูล:**
- ตรวจสอบ device status
- ตรวจสอบ MQTT connection
- ดู log ใน EMQX Dashboard: http://localhost:18083

**⚠️ Device ถูก Rate Limited:**
- ปกติ! ถ้าส่งข้อมูล > 8 ครั้ง/นาที
- Device จะ**ไม่ถือว่า offline**
- ลด frequency การส่งข้อมูลหรือเพิ่ม rate limit ใน server

**🔴 Device ถูกมองว่า Offline ทั้งที่ยังส่งข้อมูล:**
- ตรวจสอบว่าส่งข้อมูลไม่เกิน 10 วินาที
- ตรวจสอบ MQTT connection stability
- ดู server log เพื่อดูว่ามีข้อความถึง server หรือไม่
