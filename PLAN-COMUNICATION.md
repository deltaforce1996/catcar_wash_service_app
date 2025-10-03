# 📡 Communication System - Client ↔ Server ↔ Devices

## 📋 Overview

ระบบ read สำหรับการสื่อสารระหว่าง client, server และ devices เพื่อติดตามสถานะการอ่านข้อความและการตอบสนอง

---

## 🔄 Communication Flow

### 🔗 Register New Device

> **📝 Description:** ใช้ HTTP เมื่อกดปุ่ม Mode Paring บน Device  
> **🎯 Purpose:** Device Send http request -> server เพื่อให้ได้มาซึ่ง `pin` จะได้ระบุ device ที่แสดงบน web ได้

#### 📤 Request

```http
POST /api/vi/device/need-register
x-sign: {CHECK_SUM_FROM_MAC_ADDRESS}
```

**Body Payload:**

```json
{
  "chip_id": "string",
  "mac_address": "string",
  "firmware_version": "string"
}
```

#### 📥 Response

**✅ Success (200):**

```json
{
  "success": true,
  "data": {
    "pin": "1150",
    "device_id": "string"
  },
  "message": "Device registered successfully"
}
```

**❌ Failed (400):**

```json
{
  "success": false,
  "message": "Bad Request"
}
```

---

### 💳 Device QR Code Payment

> **📝 Description:** ใช้ HTTP REQUEST / MQTT Device  
> **🎯 Purpose:** Device Send http request -> server เพื่อนำ response `chargeId` ไปไว้ listen ใน MQTT

#### 📤 Payment Request

```http
POST /api/v1/payment-gateway/payments
x-sign: {CHECK_SUM_FROM_MAC_ADDRESS_AND_PAYLOAD_STRING}
```

**Body Payload:**

```json
{
  "device_id": "device-0004",
  "amount": 100, // 1.00 [บาท]
  "payment_method": "QR_PROMPT_PAY",
  "description": "Car wash payment"
}
```

#### 📥 Payment Response

**✅ Success (200):**

```json
{
  "success": true,
  "data": {
    "chargeId": "ch_32xPe8Fb7G2YZtDJxSwEl752OHj", // ไว้สำหรับเป็น ref_id ใน log | นำไปรอรับ confirm payment
    "redirect": null,
    "encodedImage": {
      "expiry": "2025-09-20T09:39:02.63620927Z",
      "rawData": "000201010212", // เอาค่านี้ไป Gen QRCODE
      "imageBase64Encoded": "iVBORw0KGgoAAAANSU"
    },
    "actionRequired": "ENCODED_IMAGE",
    "paymentMethodType": "QR_PROMPT_PAY"
  },
  "message": "Payment created successfully"
}
```

**❌ Failed (400):**

```json
{
  "success": false,
  "message": "Bad Request"
}
```

#### 🔔 MQTT Payment Status

> **📡 Topic:** `device/{chargeId}/payment-status`  
> **📝 Description:** เอา `chargeId` มา listen MQTT จาก server เพื่อรอ confirm จ่ายเงิน

**✅ MQTT Success:**

```json
{
  "success": true,
  "chargeId": "ch_32xLdfeI2bPCnIb3GY3MQrd4qGs",
  "message": "string"
}
```

**❌ MQTT Failed:**

```json
{
  "success": false,
  "chargeId": "ch_32xLdfeI2bPCnIb3GY3MQrd4qGs",
  "message": "string"
}
```

#### ⏰ Timeout Fallback

> **📝 Description:** ถ้า Timeout ยังไม่ได้รับ MQTT จาก Server Device ไปถามเองผ่าน HTTP REQUEST

```http
GET /api/v1/payment-gateway/payments/{chargeId}/status
x-sign: {CHECK_SUM_FROM_MAC_ADDRESS_AND_PAYLOAD_STRING}
```

**✅ Success:**

```json
{
  "success": true,
  "data": {
    "chargeId": "ch_32xLdfeI2bPCnIb3GY3MQrd4qGs"
  },
  "message": "Payment status retrieved successfully"
}
```

**❌ Failed:**

```json
{
  "success": false,
  "message": "Payment not found or failed"
}
```

> **⚠️ Note:** Topic ควรหยุดหลังจากได้รับ Destroy หลังจากได้รับการ confirm แล้ว

---

### 📊 Device State Streaming [60s]

> **📡 Topic:** `server/{device_id}/streaming`  
> **📝 Description:** Device streaming state ผ่าน MQTT

**Payload:**

```json
{
  "rssi": -76,
  "status": "normal", // normal | error | offline
  "uptime": 39623, // นาที
  "timestamp": 1758358335794
}
```

---

### 📝 Logs Event Upload

> **📝 Description:** Device upload logs ผ่าน http request เมื่อ device reset && has logs

#### 📤 Upload Request

```http
POST /api/v1/device-event-logs/uploads
x-sign: {CHECK_SUM_FROM_MAC_ADDRESS_AND_PAYLOAD_STRING}
```

**Body Payload:**

```json
{
  "items": [
    {
      "qr": {
        "net_amount": 0.0,
        "chargeId": "chargeId"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 6,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCEEDED", // PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED
      "timestamp": 1759854682992
    }
  ]
}
```

#### 📥 Upload Response

**✅ Success (201):**

```json
{
  "success": true,
  "data": {
    "length": 1
  },
  "message": "Logs uploaded successfully"
}
```

**❌ Failed (400):**

```json
{
  "success": false,
  "message": "Bad Request"
}
```
