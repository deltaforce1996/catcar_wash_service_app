# Modules Directory

## Overview

Modules directory ประกอบด้วย internal services ที่ทำงานเบื้องหลัง (background services) โดยไม่ต้องมี API endpoints สำหรับ external access

## Available Modules

### 1. DeviceStateProcessorModule

#### Description
Module สำหรับประมวลผล MQTT messages จากอุปกรณ์และบันทึกสถานะลงในฐานข้อมูล โดยจะ subscribe กับ topic `server/{device_id}/streaming` และบันทึกข้อมูลลงในตาราง `tbl_devices_state` และ `tbl_devices_last_state`

#### Features
- **Auto-start**: เริ่มทำงานอัตโนมัติเมื่อ app เริ่มต้น (OnModuleInit)
- **MQTT Integration**: Subscribe กับ device streaming topics อัตโนมัติ
- **Database Storage**: บันทึกข้อมูลลงในตาราง device states
- **Data Validation**: ตรวจสอบความถูกต้องของ payload
- **Error Handling**: จัดการ error อย่างครอบคลุม
- **State Hashing**: ใช้ hash เพื่อตรวจสอบการเปลี่ยนแปลงของสถานะ
- **Transaction Support**: ใช้ database transaction เพื่อความสอดคล้องของข้อมูล
- **Offline Detection**: ตรวจจับอุปกรณ์ที่หยุดส่งข้อมูลเกิน 10 วินาทีและอัปเดตสถานะเป็น OFFLINE
- **Device Tracking**: ติดตามเวลาที่อุปกรณ์ส่งข้อมูลล่าสุด
- **Rate Limiting**: จำกัดการประมวลผล 8 ครั้ง/นาทีต่ออุปกรณ์ (Sliding Window)
- **Batch Processing**: ประมวลผลข้อความทีละ 50 รายการ ทุก 5 วินาที
- **Statistics & Monitoring**: เก็บสถิติและแสดงผลทุก 5 นาที
- **Auto Cleanup**: ทำความสะอาดข้อมูลเก่าทุก 10 นาที

#### MQTT Topic Structure
```
server/{device_id}/streaming
```

**Payload Format:**
```json
{
  "rssi": -76,
  "status": "NORMAL", // "NORMAL" | "ERROR" | "OFFLINE"
  "uptime": 39623, // นาที
  "timestamp": 1758358335794
}
```

#### Database Schema

**tbl_devices_state** (Historical data)
- `id`: Primary key
- `device_id`: Foreign key to tbl_devices
- `state_data`: JSON data containing device state
- `hash_state`: SHA256 hash of state data
- `created_at`: Timestamp when state was recorded

**tbl_devices_last_state** (Latest data)
- `id`: Primary key
- `device_id`: Unique device identifier
- `state_data`: Latest state data
- `hash_state`: SHA256 hash of latest state
- `updated_at`: Timestamp when last updated
- `created_at`: Timestamp when first created

#### Usage
Module นี้จะเริ่มทำงานอัตโนมัติเมื่อ app เริ่มต้น:

```typescript
// ใน app.module.ts
import { DeviceStateProcessorModule } from './modules/device-state-processor.module';

@Module({
  imports: [
    // ... other modules
    DeviceStateProcessorModule,
  ],
})
export class AppModule {}
```

#### Configuration
```env
# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=catcar-wash-service
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_KEEPALIVE=60
MQTT_CONNECT_TIMEOUT=30000
MQTT_RECONNECT_PERIOD=5000
MQTT_CLEAN=true
MQTT_QOS=1

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

#### Performance Considerations
- **Partitioned Tables**: `tbl_devices_state` ถูก partition ด้วย 60 วัน
- **Indexing**: มี index บน `device_id` และ `created_at`
- **State Hashing**: ใช้ hash เพื่อตรวจสอบการเปลี่ยนแปลงและลดการเขียนข้อมูลซ้ำ
- **Transaction Support**: ใช้ database transaction เพื่อความสอดคล้องของข้อมูล
- **Rate Limiting**: จำกัด 8 ครั้ง/นาทีต่ออุปกรณ์ เพื่อป้องกันระบบล่ม
- **Batch Processing**: ประมวลผลทีละ 50 ข้อความ เพื่อลดภาระฐานข้อมูล
- **Sliding Window**: ใช้ sliding window rate limiting สำหรับความแม่นยำ
- **Auto Cleanup**: ลบข้อมูลเก่าเพื่อประหยัดหน่วยความจำ

#### Offline Detection Logic
- **Timeout**: 10 วินาที (10,000ms)
- **Check Interval**: ทุก 5 วินาที
- **Tracking**: เก็บ timestamp ของการส่งข้อมูลล่าสุดของแต่ละอุปกรณ์
- **Auto Mark**: อุปกรณ์ที่หยุดส่งข้อมูลเกิน 10 วินาทีจะถูกอัปเดตสถานะเป็น OFFLINE อัตโนมัติ
- **⚠️ Important**: อุปกรณ์ที่ถูก **rate limited** จะ**ไม่ถือว่า offline** เพราะ `lastSeen` จะถูกอัพเดทก่อนการตรวจสอบ rate limit
- **Payload**: สถานะ OFFLINE จะมี payload ดังนี้:
  ```json
  {
    "rssi": 0,
    "status": "OFFLINE",
    "uptime": 0,
    "timestamp": 1758358335794
  }
  ```

#### Monitoring
Service นี้มี logging ที่ครอบคลุมสำหรับ:
- MQTT connection status
- Message processing
- Database operations
- Error conditions
- Offline device detection
- Device tracking status
- Rate limiting statistics
- Batch processing metrics
- Queue size monitoring
- Processing time statistics

**Log Icons:**
เพื่อให้อ่าน log ได้ง่ายขึ้น ระบบใช้ emoji icons ดังนี้:

| Icon | ความหมาย | ตัวอย่าง |
|------|---------|---------|
| 📥 | รับข้อความจาก Device | `📥 [Device device-001] ==> [Server] streaming message` |
| ✅ | ดำเนินการสำเร็จ | `✅ Successfully processed 50 messages` |
| ⚠️ | Warning / Rate Limited | `⚠️ Rate limited: Device device-001 - skipping message` |
| ❌ | Error เกิดขึ้น | `❌ Device not found: device-001 - skipping message` |
| ⚙️ | กำลังประมวลผล Batch | `⚙️ Processing batch of 50 messages from 10 unique devices` |
| 🔍 | ค้นหา/พบข้อมูล | `🔍 Found 10/10 devices in database` |
| 💾 | บันทึกข้อมูล | `💾 Batch inserted 50 device states` |
| 📊 | สถิติ/ข้อมูลสรุป | `📊 Extracted 10 last messages from 50 total messages` |
| 🔄 | อัพเดทข้อมูล | `🔄 Batch upserted 10 last device states` |
| ⏱️ | เวลาในการประมวลผล | `⏱️ Batch processed in 45ms` |
| 🔴 | Device Offline | `🔴 Device marked as offline: device-001` |
| 🧹 | ทำความสะอาดข้อมูล | `🧹 Cleaned up 5 inactive devices from rate limiting cache` |

**Statistics Logged Every 5 Minutes:**
- Total messages received
- Processed messages count
- Dropped messages count
- Rate limited messages count
- Batch processing count
- Average processing time
- Queue size
- Active devices count
- Devices near rate limit
- Devices at rate limit
- Tracked devices count
- Offline devices detected

#### Error Handling
- **MQTT Connection Errors**: จัดการการเชื่อมต่อ MQTT ที่ล้มเหลว
- **Database Errors**: จัดการ database transaction errors
- **Validation Errors**: ตรวจสอบความถูกต้องของ payload
- **Parsing Errors**: จัดการ JSON parsing errors
- **Rate Limiting Errors**: จัดการข้อความที่ถูก rate limit
- **Batch Processing Errors**: จัดการข้อผิดพลาดในการประมวลผล batch
- **Memory Management**: ทำความสะอาดข้อมูลเก่าอัตโนมัติ

#### Rate Limiting vs Offline Detection

**🔄 สิ่งสำคัญที่ต้องเข้าใจ:**

| สถานการณ์ | Rate Limited | Offline | อธิบาย |
|-----------|-------------|---------|---------|
| ส่งข้อความบ่อยเกินไป (> 8/min) | ✅ Yes | ❌ No | ข้อความจะถูก skip แต่ device ยังไม่ offline |
| หยุดส่งข้อมูล > 10 วินาที | ❌ No | ✅ Yes | Device จะถูกมองว่า offline |
| ส่งข้อมูลปกติ (≤ 8/min) | ❌ No | ❌ No | ทำงานปกติ |

**Flow การทำงาน:**
```typescript
// 1. รับข้อความจาก MQTT
handleDeviceStreamingMessage(message)

// 2. อัพเดท lastSeen timestamp (ก่อนเสมอ!)
deviceLastSeen.set(deviceId, Date.now());

// 3. ตรวจสอบ rate limiting
if (isRateLimited) {
  return; // Skip ข้อความ แต่ lastSeen ถูกอัพเดทแล้ว
}

// 4. เพิ่มเข้า batch processing
messageBatch.push(message);
```

**ผลลัพธ์:**
- ✅ Device ที่ส่งข้อความบ่อยมาก (rate limited) จะ**ไม่ถูกมองว่า offline**
- ✅ เฉพาะ device ที่**หยุดส่งข้อมูลจริงๆ > 10 วินาที** เท่านั้นที่จะเป็น offline
- ✅ ป้องกัน false positive offline detection

#### Manual Operations
Service นี้มีฟังก์ชันสำหรับการจัดการด้วยตนเอง:
- `getStats()`: รับสถิติปัจจุบันของระบบ

## Module Structure

```
src/modules/
├── device-state-processor.service.ts  # Service implementation
├── device-state-processor.module.ts   # Module definition
└── README.md                          # This documentation
```

## Best Practices

1. **Auto-initialization**: ใช้ `OnModuleInit` เพื่อเริ่มทำงานอัตโนมัติ
2. **Error Handling**: จัดการ error อย่างครอบคลุมและ log ข้อมูลที่จำเป็น
3. **Resource Management**: ใช้ `OnModuleDestroy` สำหรับ cleanup resources
4. **Configuration**: ใช้ environment variables สำหรับ configuration
5. **Logging**: ใช้ structured logging สำหรับ monitoring และ debugging
6. **Performance**: ใช้ database transactions และ indexing ที่เหมาะสม
7. **Rate Limiting**: ใช้ sliding window rate limiting เพื่อป้องกันระบบล่ม
8. **Batch Processing**: ประมวลผลข้อความเป็น batch เพื่อลดภาระฐานข้อมูล
9. **Memory Management**: ทำความสะอาดข้อมูลเก่าอัตโนมัติเพื่อประหยัดหน่วยความจำ
10. **Monitoring**: เก็บสถิติและแสดงผลเป็นระยะเพื่อติดตามประสิทธิภาพ

## Adding New Modules

เมื่อต้องการเพิ่ม module ใหม่:

1. **สร้าง service file**: `src/modules/your-module.service.ts`
2. **สร้าง module file**: `src/modules/your-module.module.ts`
3. **เพิ่มใน app.module.ts**: import และเพิ่มใน imports array
4. **เพิ่ม documentation**: อัปเดต README.md นี้

### Example Module Structure

```typescript
// your-module.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class YourModuleService implements OnModuleInit {
  private readonly logger = new Logger(YourModuleService.name);

  async onModuleInit() {
    // Initialize your service
    this.logger.log('YourModuleService initialized');
  }
}
```

```typescript
// your-module.module.ts
import { Module } from '@nestjs/common';
import { YourModuleService } from './your-module.service';

@Module({
  providers: [YourModuleService],
  exports: [YourModuleService],
})
export class YourModuleModule {}
```

## Dependencies

Modules ใน directory นี้สามารถใช้:
- **PrismaService**: สำหรับ database operations
- **MqttService**: สำหรับ MQTT communication
- **ConfigService**: สำหรับ configuration management
- **Logger**: สำหรับ logging

## Testing

สำหรับการทดสอบ modules:
- ใช้ unit tests สำหรับ service logic
- ใช้ integration tests สำหรับ database operations
- ใช้ mock services สำหรับ external dependencies

## Scalability

Service นี้ได้รับการออกแบบเพื่อรองรับการใช้งานในระดับสูง:

### **Capacity Planning**
- **1,000 Devices**: รองรับอุปกรณ์ 1,000 เครื่องที่ส่งข้อมูลทุก 8 นาที
- **Rate Limiting**: จำกัด 8 ครั้ง/นาทีต่ออุปกรณ์ เพื่อป้องกันระบบล่ม
- **Batch Processing**: ประมวลผลทีละ 50 ข้อความ ทุก 5 วินาที
- **Memory Management**: ทำความสะอาดข้อมูลเก่าทุก 10 นาที

### **Performance Metrics**
- **Throughput**: ~7,500 ข้อความ/ชั่วโมง (1,000 เครื่อง × 7.5 ครั้ง/ชั่วโมง)
- **Processing Time**: เฉลี่ย < 100ms ต่อข้อความ
- **Queue Size**: สูงสุด 50 ข้อความต่อ batch
- **Memory Usage**: ติดตามอุปกรณ์ได้ 1,000+ เครื่องพร้อมกัน

### **Monitoring Thresholds**
- **Queue Size**: > 100 ข้อความ (ควรเพิ่ม batch size)
- **Processing Time**: > 200ms เฉลี่ย (ควรตรวจสอบฐานข้อมูล)
- **Rate Limited**: > 10% ของข้อความทั้งหมด (ควรปรับ rate limit)
- **Offline Devices**: > 5% ของอุปกรณ์ทั้งหมด (ควรตรวจสอบเครือข่าย)

## Deployment

Modules จะถูกโหลดอัตโนมัติเมื่อ app เริ่มต้น:
- Production: เริ่มทำงานทันทีเมื่อ container เริ่มต้น
- Development: เริ่มทำงานเมื่อ `npm run start:dev`
- Testing: เริ่มทำงานเมื่อ run test suite

### **Environment Variables**
```env
# Rate Limiting Configuration
MAX_REQUESTS_PER_MINUTE=8
BATCH_SIZE=50
BATCH_INTERVAL_MS=5000
OFFLINE_TIMEOUT_MS=10000

# Monitoring Configuration
STATS_LOG_INTERVAL_MS=300000
CLEANUP_INTERVAL_MS=600000
```
