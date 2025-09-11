# Device Event Logs API

This API provides search functionality for device event logs stored in the `tbl_devices_events` table.

## Endpoints

### GET /api/v1/device-event-logs/search

Search device event logs with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
- `search` (optional): General search term that searches device_id, device_name, and owner fullname fields
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field - 'created_at', 'type', or 'device_id' (default: 'created_at')
- `sort_order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: Event ID (partial match, case-insensitive)
- `device_id`: Device ID (partial match, case-insensitive)
- `device_name`: Device name (partial match, case-insensitive)
- `type`: Event type - 'PAYMENT' or 'INFO'
- `payload_timestemp`: Unix timestamp within payload JSON (format: single timestamp or start-end range)
- `user_id`: User ID within payload JSON
- `payment_status`: Payment status - 'SUCCESS', 'FAILED', or 'CANCELLED'

#### Example Queries

**General Search (searches device_id, device_name, and owner fullname fields):**
```
# Search for "abc123" in device_id, device_name, and owner fullname fields
GET /api/v1/device-event-logs/search?search=abc123

# Search for "WASH" in device_id, device_name, and owner fullname fields
GET /api/v1/device-event-logs/search?search=WASH

# Search for "John" in device_id, device_name, and owner fullname fields
GET /api/v1/device-event-logs/search?search=John
```

**Specific Field Search:**
```
# Query by device ID
GET /api/v1/device-event-logs/search?query=device_id:abc123

# Query by device name
GET /api/v1/device-event-logs/search?query=device_name:WASH-001

# Query by event type
GET /api/v1/device-event-logs/search?query=type:PAYMENT

# Query by payment status
GET /api/v1/device-event-logs/search?query=payment_status:SUCCESS

# Query by single timestamp
GET /api/v1/device-event-logs/search?query=payload_timestemp:1640995200000

# Query by timestamp range
GET /api/v1/device-event-logs/search?query=payload_timestemp:1640995200000-1641081600000

# Query by user ID
GET /api/v1/device-event-logs/search?query=user_id:user123

# Complex query with multiple filters
GET /api/v1/device-event-logs/search?query=device_id:abc123 type:PAYMENT payment_status:SUCCESS

# With pagination and sorting
GET /api/v1/device-event-logs/search?search=WASH&page=1&limit=10&sort_by=created_at&sort_order=asc
```

#### Response Format

**Note:** The `created_at` field is automatically formatted as `YYYY-MM-DD HH:mm:ss` string format.

```json
{
  "success": true,
  "message": "Device event logs fetched successfully",
  "data": {
    "items": [
      {
        "id": "event_id",
        "device_id": "device_id",
        "payload": {
          "type": "PAYMENT",
          "status": "SUCCESS",
          "amount": 100,
          "timestemp": 1640995200000,
          "user_id": "user123"
        },
        "created_at": "2024-01-01 12:00:00",
        "device": {
          "id": "device_id",
          "name": "WASH-001",
          "type": "WASH",
          "owner": {
            "id": "owner_id",
            "fullname": "John Doe",
            "email": "john@example.com"
          }
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### Authentication & Authorization

This endpoint requires JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Access Control:**
- Users with `USER` permission can only access device event logs for devices they own
- Users with other permission types (e.g., `ADMIN`) can access all device event logs
- The service automatically filters results based on the authenticated user's permissions

## Data Types

The API uses various Prisma enums and types:

- `EventType`: 'PAYMENT' | 'INFO'
- `PaymentStatus`: 'SUCCESS' | 'FAILED' | 'CANCELLED'
- `DeviceType`: 'WASH' | 'DRYING'
- `DeviceStatus`: 'DEPLOYED' | 'DISABLED'

## Database Schema

This API queries the `tbl_devices_events` table, which is partitioned by 30 days in PostgreSQL. The table contains:

- `id`: Unique event ID
- `device_id`: Reference to device
- `payload`: JSON containing event data
- `created_at`: Timestamp when the event was recorded
