# Firmware Management Module

Module สำหรับจัดการ firmware versions สำหรับอุปกรณ์ Carwash และ Helmet

## File Naming Convention

### HW Variant (Hardware)
```
{type}_HW_{hw_version}_V{sw_version}.bin
```
ตัวอย่าง:
- `carwash_HW_1.0_V1.0.0.bin`
- `helmet_HW_1.0_V1.0.0.bin`

### QR Variant (QR Code Scanner)
```
{type}_QR_HW_{hw_version}_V{sw_version}.bin
```
ตัวอย่าง:
- `carwash_QR_HW_1.0_V1.0.0.bin`
- `helmet_QR_HW_1.0_V1.0.0.bin`

### Parameters
- `{type}`: ประเภทอุปกรณ์ (`carwash` หรือ `helmet`)
- `{hw_version}`: Hardware version (เช่น `1.0`, `2.0`)
- `{sw_version}`: Software version ในรูปแบบ semantic versioning (เช่น `1.0.0`, `1.2.3`)

## Upload Requirements

1. **จำนวนไฟล์**: ต้อง upload 2 ไฟล์พร้อมกัน (HW และ QR)
2. **Software Version**: ทั้ง 2 ไฟล์ต้องมี software version ตรงกัน
3. **File Type**: ไฟล์ต้องเป็นนามสกุล `.bin` เท่านั้น
4. **File Size**: ไม่เกิน 10MB ต่อไฟล์
5. **Type Match**: ไฟล์ทั้ง 2 ต้องเป็น type เดียวกัน (carwash หรือ helmet)

## API Endpoints

### Upload Carwash Firmware (Admin Only)
```
POST /api/v1/firmwares/upload-carwash
Content-Type: multipart/form-data

files: [File, File] // 2 files: HW and QR
```

### Upload Helmet Firmware (Admin Only)
```
POST /api/v1/firmwares/upload-helmet
Content-Type: multipart/form-data

files: [File, File] // 2 files: HW and QR
```

### Get Latest Firmware (Public)
```
GET /api/v1/firmwares/latest?type=carwash
GET /api/v1/firmwares/latest?type=helmet
```

## Storage Structure

```
public/firmwares/
├── v1.0.0/
│   ├── carwash_HW_1.0_V1.0.0.bin
│   ├── carwash_QR_HW_1.0_V1.0.0.bin
│   ├── helmet_HW_1.0_V1.0.0.bin
│   ├── helmet_QR_HW_1.0_V1.0.0.bin
│   └── manifest.json
├── v1.0.1/
│   └── ...
```

## Manifest.json Structure

```json
{
  "version": "1.0.0",
  "carwash": {
    "hw": {
      "filename": "carwash_HW_1.0_V1.0.0.bin",
      "url": "http://domain/firmwares/v1.0.0/carwash_HW_1.0_V1.0.0.bin",
      "sha256": "3f5a8f1b...",
      "size": 972800,
      "hw_version": "1.0"
    },
    "qr": {
      "filename": "carwash_QR_HW_1.0_V1.0.0.bin",
      "url": "http://domain/firmwares/v1.0.0/carwash_QR_HW_1.0_V1.0.0.bin",
      "sha256": "c9d1e0ab...",
      "size": 856320,
      "hw_version": "1.0"
    }
  },
  "helmet": {
    "hw": { /* ... */ },
    "qr": { /* ... */ }
  },
  "uploaded_at": "2025-10-28T12:00:00Z"
}
```

## Version Management

- Latest version ถูกกำหนดโดย **semantic versioning comparison**
- รองรับ multiple versions พร้อมกัน
- แต่ละ version มี manifest.json เป็นของตัวเอง
- `/firmwares/latest?type=xxx` จะ return **latest version ที่มี firmware ของ type นั้นๆ**
  - ตัวอย่าง: ถ้า v1.0.0 มี carwash, v1.0.1 มี helmet, v1.0.2 มี carwash
  - `GET /latest?type=carwash` จะ return v1.0.2 (latest carwash)
  - `GET /latest?type=helmet` จะ return v1.0.1 (latest helmet)
- ESP32 devices จะดึง latest version ของประเภทตัวเองอัตโนมัติ

## Security

- Upload endpoints ต้อง authenticate ด้วย JWT token
- เฉพาะ ADMIN role เท่านั้นที่สามารถ upload ได้
- File validation: type, size, format
- SHA256 checksum สำหรับ verify integrity
