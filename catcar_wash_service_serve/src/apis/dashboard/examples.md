# Dashboard API Examples

ตัวอย่างการใช้งาน Dashboard API

## Basic Usage

### 1. ดึงข้อมูลทั้งหมด

```bash
GET /api/v1/dashboard/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "monthly": {
      "revenue": 4500,
      "change": 24.2,
      "data": [
        { "month": "01", "amount": 0 },
        { "month": "02", "amount": 0 },
        { "month": "03", "amount": 1500 },
        { "month": "04", "amount": 0 },
        { "month": "05", "amount": 0 },
        { "month": "06", "amount": 0 },
        { "month": "07", "amount": 0 },
        { "month": "08", "amount": 3000 },
        { "month": "09", "amount": 0 },
        { "month": "10", "amount": 0 },
        { "month": "11", "amount": 0 },
        { "month": "12", "amount": 0 }
      ]
    },
    "daily": {
      "revenue": 1875,
      "change": 12.3,
      "data": [
        { "day": "01", "amount": 0 },
        { "day": "02", "amount": 0 },
        { "day": "03", "amount": 0 },
        { "day": "04", "amount": 0 },
        { "day": "05", "amount": 0 },
        { "day": "06", "amount": 0 },
        { "day": "07", "amount": 0 },
        { "day": "08", "amount": 0 },
        { "day": "09", "amount": 0 },
        { "day": "10", "amount": 0 },
        { "day": "11", "amount": 0 },
        { "day": "12", "amount": 0 },
        { "day": "13", "amount": 0 },
        { "day": "14", "amount": 0 },
        { "day": "15", "amount": 0 },
        { "day": "16", "amount": 0 },
        { "day": "17", "amount": 0 },
        { "day": "18", "amount": 0 },
        { "day": "19", "amount": 0 },
        { "day": "20", "amount": 0 },
        { "day": "21", "amount": 0 },
        { "day": "22", "amount": 0 },
        { "day": "23", "amount": 0 },
        { "day": "24", "amount": 1875 },
        { "day": "25", "amount": 0 },
        { "day": "26", "amount": 0 },
        { "day": "27", "amount": 0 },
        { "day": "28", "amount": 0 },
        { "day": "29", "amount": 0 },
        { "day": "30", "amount": 0 },
        { "day": "31", "amount": 0 }
      ]
    },
    "hourly": {
      "revenue": 156.25,
      "change": 8.5,
      "data": [
        { "hour": "00", "amount": 0 },
        { "hour": "01", "amount": 0 },
        { "hour": "02", "amount": 0 },
        { "hour": "03", "amount": 0 },
        { "hour": "04", "amount": 0 },
        { "hour": "05", "amount": 0 },
        { "hour": "06", "amount": 0 },
        { "hour": "07", "amount": 0 },
        { "hour": "08", "amount": 0 },
        { "hour": "09", "amount": 0 },
        { "hour": "10", "amount": 0 },
        { "hour": "11", "amount": 0 },
        { "hour": "12", "amount": 0 },
        { "hour": "13", "amount": 0 },
        { "hour": "14", "amount": 0 },
        { "hour": "15", "amount": 0 },
        { "hour": "16", "amount": 0 },
        { "hour": "17", "amount": 0 },
        { "hour": "18", "amount": 0 },
        { "hour": "19", "amount": 0 },
        { "hour": "20", "amount": 0 },
        { "hour": "21", "amount": 0 },
        { "hour": "22", "amount": 0 },
        { "hour": "23", "amount": 156.25 }
      ]
    }
  },
  "message": "Dashboard summary retrieved successfully"
}
```

### 2. กรองตาม User ID

```bash
GET /api/v1/dashboard/summary?user_id=user123
```

### 3. กรองตาม Device ID

```bash
GET /api/v1/dashboard/summary?device_id=device456
```

### 4. กรองตามวันที่เฉพาะ (สำหรับ Hourly Data)

```bash
GET /api/v1/dashboard/summary?date=2025-08-24
```

### 5. กรองตามสถานะอุปกรณ์

```bash
GET /api/v1/dashboard/summary?device_status=ACTIVE
```

### 6. กรองตามสถานะการชำระเงิน

```bash
GET /api/v1/dashboard/summary?payment_status=SUCCESS
```

### 7. รวมข้อมูลสำหรับกราฟ

```bash
GET /api/v1/dashboard/summary?include_charts=true
```

### 8. รวมหลายเงื่อนไข

```bash
GET /api/v1/dashboard/summary?user_id=user123&device_id=device456&date=2025-08-24&include_charts=true
```

## Features

### Complete Range Data
- **เดือน**: แสดงข้อมูลครบทุกเดือน (01-12) ของทั้งปี ถ้าไม่มีข้อมูลจะแสดงเป็น 0
- **วัน**: แสดงข้อมูลครบทุกวัน (01-31) ของทั้งปี ถ้าไม่มีข้อมูลจะแสดงเป็น 0  
- **ชั่วโมง**: แสดงข้อมูลครบทุกชั่วโมง (00-23) ของวันที่เฉพาะ (เมื่อใช้ date filter)

### Data Scope
- **Monthly Data**: แสดงข้อมูลของทั้งปี (รวมทุกเดือน)
- **Daily Data**: แสดงข้อมูลของทั้งเดือน (รวมทุกวันของเดือนนั้น)
- **Hourly Data**: แสดงข้อมูลของวันที่เฉพาะ (รวมทุกชั่วโมงของวันนั้น)

### Revenue Calculation
- **Monthly Revenue**: ยอดรวมของทั้งปี
- **Daily Revenue**: ยอดรวมของทั้งเดือน (ไม่ใช่แค่วันเดียว)
- **Hourly Revenue**: ยอดรวมของวันนั้นทั้งวัน (ไม่ใช่แค่ชั่วโมงเดียว)

### Payment Status
Response จะรวม `payment_status` ที่ใช้ในการกรองข้อมูล (default: SUCCESS)

### Zero Values
ถ้าไม่มีข้อมูลในช่วงเวลานั้น จะแสดงเป็น 0 เพื่อให้ label ครบถ้วน

### Percentage Change
คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงเทียบกับช่วงเวลาเดียวกันในอดีต

## Notes

- ไม่ต้องใช้ Authorization header (JWT ถูกปิดใช้งานชั่วคราว)
- Date filter ใช้กับ hourly data เท่านั้น เพื่อกรองตามวันที่เฉพาะ
- Monthly และ Daily data แสดงข้อมูลของทั้งปีเสมอ
- ถ้าไม่ระบุ payment_status จะใช้ SUCCESS เป็นค่าเริ่มต้น
