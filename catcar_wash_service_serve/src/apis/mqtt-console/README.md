# MQTT Console Monitor

เครื่องมือ Web-based console สำหรับติดตามและดู MQTT messages แบบ real-time

## Features ✨

- 📊 **Real-time Monitoring**: ดู MQTT messages แบบ real-time ผ่าน Server-Sent Events (SSE)
- 📥📤 **Bidirectional Messages**: แสดงทั้ง incoming (รับเข้า) และ outgoing (ส่งออก) messages
- 🎯 **Direction Filter**: กรองดู messages ตามทิศทาง (Incoming/Outgoing/All)
- 🕒 **Timestamp Display**: แสดงเวลาที่ได้รับ message แบบละเอียด (มิลลิวินาที)
- 🔍 **Topic Filtering**: กรองข้อความตาม topic pattern (รองรับ MQTT wildcards: `+` และ `#`)
- 📋 **Topic Selector**: เลือก topic จากรายการแบบคลิกได้เลย ไม่ต้องพิมพ์ (พร้อมจำนวนข้อความแต่ละ topic)
- ⚡ **Quick Filters**: ปุ่มกรองด่วน เช่น `server/+/streaming`, `server/#`
- ⏸️ **Pause/Resume**: หยุดและเริ่มแสดงข้อความใหม่ได้
- 📈 **Statistics**: แสดงสถิติต่างๆ เช่น จำนวน message, topics ที่ไม่ซ้ำกัน, messages per second
- 🎨 **Modern UI**: อินเตอร์เฟซสวยงาม responsive
- 🗑️ **Clear Messages**: ล้างข้อความที่แสดงได้
- 📜 **Auto-scroll**: เลื่อนหน้าจอไปข้อความใหม่อัตโนมัติ
- 💾 **Message Limit**: จำกัดจำนวนข้อความที่แสดงได้ (50, 100, 200, 500, หรือทั้งหมด)
- 🔄 **Auto-refresh Topics**: รายการ topics อัพเดทอัตโนมัติทุก 5 วินาที

## การเข้าถึง 🌐

เปิดเบราว์เซอร์และไปที่:

```
http://localhost:3000/mqtt-console
```

หรือถ้าใช้ production:

```
https://your-domain.com/mqtt-console
```

## API Endpoints 🔌

### 1. หน้า Web Console
```
GET /mqtt-console
```
แสดงหน้า HTML console แบบเต็มรูปแบบ

### 2. SSE Stream (Real-time Messages)
```
GET /mqtt-console/stream
```
รับ MQTT messages แบบ real-time ผ่าน Server-Sent Events

**Response Format:**
```json
{
  "timestamp": "2025-10-20T10:30:45.123Z",
  "topic": "server/device123/streaming",
  "payload": "{\"temperature\":25.5,\"humidity\":60}",
  "qos": 1,
  "retain": false,
  "receivedAt": "2025-10-20T10:30:45.123Z",
  "direction": "incoming"
}
```

**Direction Field:**
- `incoming`: Messages received from MQTT broker (📥)
- `outgoing`: Messages published by server to MQTT broker (📤)

### 3. Get Recent Messages (REST API)
```
GET /mqtt-console/messages?limit=100
```

**Query Parameters:**
- `limit` (optional): จำนวน message ที่ต้องการ (default: ทั้งหมด)

**Response:**
```json
{
  "messages": [...],
  "count": 150,
  "subscribers": 2
}
```

### 4. Get Statistics
```
GET /mqtt-console/stats
```

**Response:**
```json
{
  "messageCount": 1250,
  "subscriberCount": 3
}
```

### 5. Get Topics List
```
GET /mqtt-console/topics
```

**Response:**
```json
{
  "topics": [
    "server/device123/streaming",
    "server/device456/streaming",
    "server/device789/status"
  ]
}
```

## การใช้งาน Topic Selector & Filter 🔍

### วิธีที่ 1: เลือกจากปุ่ม (แนะนำ) 📋
1. คลิกปุ่ม **"📋 Select Topic"**
2. เลือก topic จากรายการที่แสดง (รายการจะแสดงจำนวนข้อความแต่ละ topic)
3. หรือใช้ปุ่ม Quick Filters: `server/+/streaming`, `server/#`, `Clear Filter`

### วิธีที่ 2: พิมพ์เอง ⌨️

#### Basic Filtering
กรองตาม topic ที่ต้องการ:
```
server/device123/streaming
```

### Wildcard: Single Level (+)
ใช้ `+` สำหรับ match single level:
```
server/+/streaming
```
จะ match:
- `server/device123/streaming`
- `server/device456/streaming`
- ไม่ match: `server/device123/status/streaming`

### Wildcard: Multiple Levels (#)
ใช้ `#` สำหรับ match หลาย levels:
```
server/#
```
จะ match:
- `server/device123/streaming`
- `server/device123/status`
- `server/device123/status/error`

### Combined Wildcards
```
server/+/status/#
```
จะ match:
- `server/device123/status/error`
- `server/device456/status/warning/critical`

## Architecture 🏗️

### Components

1. **MqttConsoleService**
   - รับ MQTT messages ผ่าน EventEmitter (`@OnEvent('mqtt.message')`)
   - เก็บ messages ใน memory (สูงสุด 1000 messages)
   - จัดการ subscribers สำหรับ real-time updates

2. **MqttConsoleController**
   - ให้บริการหน้า HTML console
   - จัดการ SSE stream สำหรับ real-time updates
   - ให้บริการ REST API endpoints

3. **Frontend (Vanilla JavaScript)**
   - เชื่อมต่อกับ SSE endpoint
   - แสดงผล messages แบบ real-time
   - จัดการ filtering และ statistics

### Data Flow

```
INCOMING (📥):
MQTT Broker → MqttService → EventEmitter → 'mqtt.message' event
                                               ↓
                                      MqttConsoleService
                                       (stores messages)
                                               ↓
                                      SSE Stream / REST API
                                               ↓
                                       Browser (Console UI)

OUTGOING (📤):
Application → MqttService.publish() → MQTT Broker
                       ↓
                EventEmitter → 'mqtt.messagePublished' event
                       ↓
             MqttConsoleService
              (stores messages)
                       ↓
              SSE Stream / REST API
                       ↓
               Browser (Console UI)
```

## Configuration ⚙️

### Message Retention
จำนวน messages ที่เก็บใน memory สามารถปรับได้ที่:

```typescript:mqtt-console.service.ts
private readonly maxMessages = 1000; // เปลี่ยนตามต้องการ
```

### Auto-reconnect SSE
หาก SSE connection ขาด frontend จะ reconnect อัตโนมัติหลังจาก 5 วินาที

## Performance Considerations 🚀

- **Memory Usage**: Service เก็บข้อมูลสูงสุด 1000 messages ใน memory
- **DOM Performance**: Frontend จำกัดการแสดงผลตาม setting (50-500 messages)
- **SSE Bandwidth**: แต่ละ message จะถูกส่งทันทีที่ได้รับ (real-time)
- **Filtering**: Filter ทำงานฝั่ง client-side (ไม่กระทบ server)

## Troubleshooting 🔧

### Console ไม่แสดง messages
1. ตรวจสอบว่า MQTT Service เชื่อมต่อกับ broker แล้ว
2. ตรวจสอบว่ามี messages เข้ามาจริงๆ (ดูที่ logs)
3. ลอง refresh หน้า browser

### SSE Connection Error
1. ตรวจสอบ Network tab ใน DevTools
2. ตรวจสอบว่า server รัน port ที่ถูกต้อง
3. ตรวจสอบ CORS settings (ถ้ามี)

### Messages ล่าช้า
1. ตรวจสอบ network latency
2. ลด display limit (แสดงน้อยลง)
3. ใช้ pause feature เพื่อหยุดการ update ชั่วคราว

## Security Considerations 🔒

⚠️ **Important**: Console นี้ไม่มี authentication/authorization

**แนะนำ:**
- ใช้เฉพาะใน development/staging environment
- หรือเพิ่ม authentication guard ก่อนใช้ใน production
- จำกัด access ผ่าน firewall/network rules

### การเพิ่ม Authentication

เพิ่ม guard ใน controller:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mqtt-console')
@UseGuards(JwtAuthGuard) // เพิ่มบรรทัดนี้
export class MqttConsoleController {
  // ...
}
```

## Example Use Cases 💡

1. **Debugging Device Communication**
   - ดู messages จาก devices แบบ real-time (📥 incoming)
   - ตรวจสอบ payload format
   - หา error patterns
   - ดู commands ที่ server ส่งไป (📤 outgoing)

2. **Monitoring System Health**
   - ดูจำนวน messages per second
   - ตรวจสอบว่ามี devices ส่ง messages หรือไม่
   - ดู topic patterns
   - เช็คว่า server ส่ง commands ถูกต้องหรือไม่

3. **Development & Testing**
   - ทดสอบ MQTT integration
   - Verify message formats (ทั้ง incoming และ outgoing)
   - Debug communication issues
   - ตรวจสอบว่า payment status ถูกส่งไปหรือไม่

4. **Payment Gateway Debugging** 🆕
   - ดู payment status messages ที่ server ส่งไปยัง devices
   - กรองดู outgoing messages เฉพาะ topic `device/*/payment-status`
   - ตรวจสอบ payload และ timing ของการส่ง payment status

## Future Enhancements 🚀

Possible features to add:
- [ ] Export messages to JSON/CSV
- [ ] Search/filter by payload content
- [ ] Message replay functionality
- [ ] Chart visualization for numeric data
- [ ] Multiple topic subscriptions with tabs
- [ ] Dark mode
- [ ] Persistent storage (database)
- [ ] Authentication & authorization
- [ ] User preferences (save filters, limits)

## Dependencies 📦

- `@nestjs/common`: NestJS core
- `@nestjs/event-emitter`: Event handling
- `rxjs`: Reactive programming for SSE

ไม่ต้องติดตั้ง dependencies เพิ่มเติม (ใช้ของที่มีอยู่แล้วในโปรเจค)

## License

Same as parent project

