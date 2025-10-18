# Payment Gateway Guards

## Overview

Payment Gateway ใช้ 2 Guards สำหรับการตรวจสอบ signature:

1. **DeviceSignatureGuard** - สำหรับ device requests
2. **BeamWebhookSignatureGuard** - สำหรับ Beam webhook callbacks

---

## 1. DeviceSignatureGuard

ตรวจสอบ `x-signature` header จาก device requests ตาม PLAN-COMUNICATION.md

### Configuration

```typescript
SECRET_KEY = 'modernchabackdoor'
```

### Signature Algorithm

```
signature = SHA256(payload_string + SECRET_KEY)
```

- **payload_string**: JSON.stringify(payload) โดยไม่มี whitespace
- **SECRET_KEY**: `modernchabackdoor`
- **signature**: hex string (lowercase)

### Usage

**Protected Endpoints:**
- `POST /api/v1/payment-gateway/payments` - Create payment
- `GET /api/v1/payment-gateway/payments/:id/status` - Check payment status

**Request Headers:**
```http
Content-Type: application/json
x-signature: <calculated_signature>
```

### Examples

#### POST Request (with body)

**Python Example:**
```python
import hashlib
import json

SECRET_KEY = "modernchabackdoor"

payload = {
    "device_id": "device-0004",
    "amount": 100,
    "payment_method": "QR_PROMPT_PAY",
    "description": "Car wash payment"
}

# Calculate signature
payload_string = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
combined = payload_string + SECRET_KEY
signature = hashlib.sha256(combined.encode('utf-8')).hexdigest()

# Send request
headers = {
    'Content-Type': 'application/json',
    'x-signature': signature
}
```

**cURL Example:**
```bash
# Calculate signature first
PAYLOAD='{"device_id":"device-0004","amount":100,"payment_method":"QR_PROMPT_PAY","description":"Car wash payment"}'
SECRET_KEY="modernchabackdoor"
SIGNATURE=$(echo -n "${PAYLOAD}${SECRET_KEY}" | sha256sum | cut -d' ' -f1)

# Send request
curl -X POST http://localhost:3000/api/v1/payment-gateway/payments \
  -H "Content-Type: application/json" \
  -H "x-signature: ${SIGNATURE}" \
  -d "${PAYLOAD}"
```

#### GET Request (no body)

**Python Example:**
```python
import hashlib
import json

SECRET_KEY = "modernchabackdoor"

# For GET request, payload is empty object
payload = {}

# Calculate signature
payload_string = json.dumps(payload)  # "{}"
combined = payload_string + SECRET_KEY
signature = hashlib.sha256(combined.encode('utf-8')).hexdigest()

# Send request
headers = {
    'x-signature': signature
}
```

**cURL Example:**
```bash
# Calculate signature for empty payload
SECRET_KEY="modernchabackdoor"
SIGNATURE=$(echo -n "{}${SECRET_KEY}" | sha256sum | cut -d' ' -f1)

# Send request
curl http://localhost:3000/api/v1/payment-gateway/payments/ch_xxxxx/status \
  -H "x-signature: ${SIGNATURE}"
```

### Verification Flow

1. Extract `x-signature` from request headers
2. Get request body (POST/PUT/PATCH) or use empty object `{}` (GET/DELETE)
3. Calculate expected signature: `SHA256(JSON.stringify(body) + SECRET_KEY)`
4. Compare signatures (case-insensitive)
5. Allow/Deny request

### Error Responses

**Missing Signature:**
```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "message": "Device signature (x-signature header) is required",
  "statusCode": 401
}
```

**Invalid Signature:**
```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "message": "Invalid device signature",
  "statusCode": 401
}
```

---

## 2. BeamWebhookSignatureGuard

ตรวจสอบ `x-beam-signature` header จาก Beam Checkout webhook callbacks

### Configuration

```typescript
// Loaded from database per merchant
WEBHOOK_HMAC_KEY = user.payment_info.HMAC_key
```

### Signature Algorithm

```
signature = HMAC-SHA256(payload_string, base64_decode(WEBHOOK_HMAC_KEY))
```

- **payload_string**: JSON.stringify(webhook_payload)
- **WEBHOOK_HMAC_KEY**: Base64-encoded HMAC key from merchant config
- **signature**: Base64 string

### Usage

**Protected Endpoints:**
- `POST /api/v1/payment-gateway/webhook` - Beam webhook callback

**Request Headers:**
```http
Content-Type: application/json
x-beam-signature: <beam_calculated_signature>
x-beam-event: <event_type>
```

### Verification Flow

1. Extract webhook signature and event type from headers
2. Get merchant's HMAC key from database (via referenceId)
3. Calculate expected signature using HMAC-SHA256
4. Compare signatures using timing-safe comparison
5. Allow/Deny request

---

## Testing

### Test Device Signature

```bash
# Use the payment_device_simulator.py
cd catcar_api_client
python payment_device_simulator.py

# Input:
# - Device ID: device-0004
# - API Base URL: http://localhost:3000/api/v1
# - MQTT Broker: localhost

# Then select option 1 or 4 to create payment
```

### Test Signature Calculation

**Node.js:**
```javascript
const crypto = require('crypto');

const SECRET_KEY = 'modernchabackdoor';
const payload = {
  device_id: 'device-0004',
  amount: 100,
  payment_method: 'QR_PROMPT_PAY',
  description: 'Car wash payment'
};

const payloadString = JSON.stringify(payload);
const combined = payloadString + SECRET_KEY;
const signature = crypto.createHash('sha256').update(combined, 'utf8').digest('hex');

console.log('Signature:', signature);
```

**Python:**
```python
import hashlib
import json

SECRET_KEY = "modernchabackdoor"
payload = {
    "device_id": "device-0004",
    "amount": 100,
    "payment_method": "QR_PROMPT_PAY",
    "description": "Car wash payment"
}

payload_string = json.dumps(payload, separators=(',', ':'))
combined = payload_string + SECRET_KEY
signature = hashlib.sha256(combined.encode('utf-8')).hexdigest()

print(f"Signature: {signature}")
```

---

## Security Notes

1. **Secret Key**: `modernchabackdoor` is hardcoded for device authentication
2. **Timing-Safe Comparison**: Guards use timing-safe comparison to prevent timing attacks
3. **HTTPS**: Always use HTTPS in production to protect signatures in transit
4. **Key Rotation**: Consider implementing key rotation mechanism for production
5. **Rate Limiting**: Implement rate limiting to prevent brute force attacks

---

## Implementation Details

### DeviceSignatureGuard

- **File**: `device-signature.guard.ts`
- **Type**: Synchronous guard (returns boolean directly)
- **Scope**: Applied per-endpoint using `@UseGuards(DeviceSignatureGuard)`
- **Dependencies**: None (uses hardcoded SECRET_KEY)

### BeamWebhookSignatureGuard

- **File**: `beam-webhook-signature.guard.ts`
- **Type**: Asynchronous guard (returns Promise<boolean>)
- **Scope**: Applied per-endpoint using `@UseGuards(BeamWebhookSignatureGuard)`
- **Dependencies**: ConfigService, PrismaService (for HMAC key lookup)

---

## Troubleshooting

### Common Issues

1. **Signature Mismatch**
   - Check JSON key order (must match between client and server)
   - Verify no whitespace in JSON string
   - Ensure UTF-8 encoding
   - Compare hex strings case-insensitively

2. **Missing Signature Header**
   - Ensure `x-signature` header is included
   - Check header name spelling

3. **Empty Body**
   - For GET requests, use empty object `{}`
   - For POST with empty body, use `{}`

### Debug Mode

Guards log detailed information at DEBUG level:
- Payload string
- Combined string (payload + SECRET_KEY)
- Computed signature
- Received signature

Enable debug logs:
```typescript
// In main.ts or app configuration
app.useLogger(['error', 'warn', 'log', 'debug']);
```

---

## References

- **PLAN-COMUNICATION.md**: Full communication specification
- **payment_device_simulator.py**: Python implementation example
- **Beam Checkout API**: https://docs.beamcheckout.com/

