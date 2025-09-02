# Dashboard API

API สำหรับดึงข้อมูลสรุป Dashboard พร้อม filtering capabilities

## Endpoints

### GET /api/v1/dashboard/summary

ดึงข้อมูลสรุป Dashboard พร้อม filtering options

#### Query Parameters

- `user_id` (optional): กรองตาม user ID
- `device_id` (optional): กรองตาม device ID  
- `device_status` (optional): กรองตามสถานะอุปกรณ์ (ACTIVE, INACTIVE, MAINTENANCE)
- `payment_status` (optional): กรองตามสถานะการชำระเงิน (SUCCESS, FAILED, PENDING)
- `date` (optional): กรองตามวันที่เฉพาะ (รูปแบบ: YYYY-MM-DD) - ใช้กับ hourly data เท่านั้น
- `include_charts` (optional): รวมข้อมูลสำหรับกราฟ (true/false)

#### Response Format

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
      },
      "payment_status": "SUCCESS"
    },
    "message": "Dashboard summary retrieved successfully"
}
```

#### Features

- **Complete Range Data**: แสดงข้อมูลครบทุกช่วงเวลา (เดือน 01-12, วัน 01-31, ชั่วโมง 00-23)
- **Zero Values**: ถ้าไม่มีข้อมูลในช่วงเวลานั้น จะแสดงเป็น 0
- **Percentage Change**: คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงเทียบกับช่วงเวลาเดียวกันในอดีต
- **Flexible Filtering**: สามารถกรองข้อมูลตาม user_id, device_id, status, และ date
- **Chart Data**: สามารถรวมข้อมูลสำหรับแสดงกราฟได้

#### Data Scope

- **Monthly Data**: แสดงข้อมูลของทั้งปี (รวมทุกเดือน)
- **Daily Data**: แสดงข้อมูลของทั้งปี (รวมทุกวัน)
- **Hourly Data**: แสดงข้อมูลของวันที่เฉพาะ (รวมทุกชั่วโมงของวันนั้น)

#### Revenue Calculation

- **Monthly Revenue**: ยอดรวมของทั้งปี
- **Daily Revenue**: ยอดรวมของทั้งเดือนของปี (ไม่ใช่แค่วันเดียว)
- **Hourly Revenue**: ยอดรวมของทั้งวันของเดือนของปี (ไม่ใช่แค่ชั่วโมงเดียว)

#### Notes

- **JWT Authentication**: ปัจจุบันถูกปิดใช้งานชั่วคราว
- **Date Filter**: ใช้กับ hourly data เท่านั้น เพื่อกรองตามวันที่เฉพาะ
- **Default Payment Status**: ถ้าไม่ระบุ payment_status จะใช้ SUCCESS เป็นค่าเริ่มต้น
