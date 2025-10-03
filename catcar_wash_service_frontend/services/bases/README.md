# API Services Documentation

## BaseApiClient

`BaseApiClient` เป็น base class ที่ให้ฟังก์ชันการทำงานพื้นฐานสำหรับการเรียก API ทั้งหมด สามารถ extend เพื่อสร้าง API client เฉพาะสำหรับแต่ละ service ได้

### Features

- ✅ Automatic authentication token handling
- ✅ Request/Response interceptors
- ✅ Error handling
- ✅ Logging
- ✅ Configurable base URL, timeout, and headers
- ✅ HTTP methods: GET, POST, PUT, PATCH, DELETE

### Basic Usage

```typescript
import { BaseApiClient } from "./base-api-client";

class MyApiClient extends BaseApiClient {
  constructor() {
    super(); // ใช้ default configuration
  }

  async getUsers() {
    return this.get<User[]>('/users');
  }

  async createUser(userData: CreateUserRequest) {
    return this.post<User>('/users', userData);
  }
}
```

### Custom Configuration

```typescript
class CustomApiClient extends BaseApiClient {
  constructor() {
    super(
      "https://api.example.com", // Custom base URL
      15000, // Custom timeout (15 seconds)
      {
        "X-Service": "my-service", // Custom headers
        "X-Version": "1.0"
      }
    );
  }
}
```

### Available Methods

#### HTTP Methods
- `get<T>(url, config?)` - GET request
- `post<T>(url, data?, config?)` - POST request
- `put<T>(url, data?, config?)` - PUT request
- `patch<T>(url, data?, config?)` - PATCH request
- `delete<T>(url, config?)` - DELETE request

#### Configuration Methods
- `setBaseURL(baseURL)` - เปลี่ยน base URL
- `setTimeout(timeout)` - เปลี่ยน timeout
- `setDefaultHeader(key, value)` - เพิ่ม/แก้ไข default header
- `removeDefaultHeader(key)` - ลบ default header
- `getAxiosInstance()` - ได้ axios instance สำหรับการใช้งานขั้นสูง

### Error Handling

BaseApiClient จัดการ error ต่างๆ อัตโนมัติ:

- **401/403**: ลบ token และ log warning
- **500**: Log error message
- **อื่นๆ**: Log error และ reject promise

### Authentication

Token จะถูกเพิ่มเข้าไปใน header อัตโนมัติผ่าน `authTokenManager`:

```typescript
// Token จะถูกเพิ่มเข้าไปใน Authorization header อัตโนมัติ
// Authorization: Bearer <token>
```

### Logging

BaseApiClient ใช้ logging system จาก config:

- 🚀 Request logging
- ✅ Response logging  
- 🚫 Request error logging
- 💥 Response error logging
- 🔒 Authentication error logging
- 🔥 Server error logging

## Examples

ดูไฟล์ `example-api-clients.ts` สำหรับตัวอย่างการใช้งานที่หลากหลาย:

1. **UserApiClient** - API client สำหรับจัดการ users
2. **DeviceApiClient** - API client สำหรับจัดการ devices พร้อม custom configuration
3. **ExternalApiClient** - API client สำหรับ external APIs พร้อม API key

## Migration from Old API Client

หากคุณมี code เดิมที่ใช้ `apiClient` จาก `api.ts` เก่า สามารถใช้งานได้เหมือนเดิม:

```typescript
// เดิม
import { apiClient } from "~/services/api";

// ใช้งานเหมือนเดิม
const response = await apiClient.get('/users');
```

`apiClient` ใหม่ยังคงเป็น singleton instance ที่ extend จาก `BaseApiClient` และมีฟังก์ชันการทำงานเหมือนเดิม
