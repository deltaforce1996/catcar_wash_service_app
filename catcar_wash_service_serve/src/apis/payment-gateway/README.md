# Payment Gateway Module

Module สำหรับจัดการการชำระเงินผ่าน Beam Checkout Service

## สถานะปัจจุบัน
- ✅ สร้าง module พื้นฐานแล้ว
- ✅ เชื่อมต่อกับ Beam Checkout Service แล้ว
- ⏳ ยังไม่ได้เชื่อมต่อกับ Database
- ⏳ ยังไม่ได้ implement business logic เต็มรูปแบบ

## API Endpoints

### POST /api/v1/payment-gateway/payments
สร้างการชำระเงินใหม่

**Request Body:**
```json
{
  "device_id": "string",
  "amount": "number",
  "description": "string (optional)",
  "payment_method": "string (optional)",
  "reference_id": "string (optional)",
  "callback_url": "string (optional)"
}
```

### GET /api/v1/payment-gateway/payments/:id/status
ตรวจสอบสถานะการชำระเงิน

### PUT /api/v1/payment-gateway/payments/:id/callback
จัดการ payment callback จาก payment gateway

### DELETE /api/v1/payment-gateway/payments/:id
ยกเลิกการชำระเงิน

## TODO List

### 1. Database Integration
- [ ] เพิ่ม Payment model ใน Prisma schema
- [ ] เพิ่ม PaymentMethod และ PaymentStatus enums
- [ ] สร้าง migration สำหรับ payment table
- [ ] เชื่อมต่อ PrismaService ใน PaymentGatewayService

### 2. Business Logic
- [ ] เพิ่มการตรวจสอบ device และ user permissions
- [ ] เพิ่มการ validate ข้อมูลก่อนสร้าง charge
- [ ] เพิ่มการบันทึกข้อมูล payment ลง database
- [ ] เพิ่มการอัปเดตสถานะ payment จาก Beam Checkout

### 3. Security & Validation
- [ ] เพิ่มการ validate signature สำหรับ webhook
- [ ] เพิ่มการตรวจสอบ permissions ตาม role
- [ ] เพิ่ม rate limiting สำหรับ payment endpoints

### 4. Error Handling & Logging
- [ ] เพิ่ม comprehensive error handling
- [ ] เพิ่ม structured logging
- [ ] เพิ่ม monitoring และ alerting

### 5. Testing
- [ ] เพิ่ม unit tests สำหรับ service methods
- [ ] เพิ่ม integration tests สำหรับ API endpoints
- [ ] เพิ่ม mock สำหรับ Beam Checkout Service

### 6. Documentation
- [ ] เพิ่ม API documentation ด้วย Swagger
- [ ] เพิ่มตัวอย่างการใช้งาน
- [ ] เพิ่ม error codes และ messages

## การใช้งาน Beam Checkout Service

Module นี้ใช้ Beam Checkout Service สำหรับ:
- สร้าง charge สำหรับการชำระเงิน
- ตรวจสอบสถานะการชำระเงิน
- ยกเลิก charge
- สร้าง QR code สำหรับ PromptPay

## ตัวอย่างการใช้งาน

```typescript
// สร้างการชำระเงิน
const payment = await paymentGatewayService.createPayment({
  device_id: 'device-123',
  amount: 100,
  payment_method: 'QR_PROMPT_PAY',
  description: 'Car wash payment'
});

// ตรวจสอบสถานะ
const status = await paymentGatewayService.getPaymentStatus('payment-123');
```

## หมายเหตุ

- Module นี้ยังอยู่ในขั้นตอน development
- ต้องเพิ่ม database integration ก่อนใช้งานจริง
- ต้องเพิ่ม proper error handling และ validation
- ต้องเพิ่ม security measures สำหรับ production
