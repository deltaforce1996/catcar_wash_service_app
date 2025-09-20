# Device States API

This API provides search functionality for device states stored in the `tbl_devices_state` table.

## Endpoints

### GET /api/v1/device-states/search

Search device states with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field - 'created_at' or 'device_id' (default: 'created_at')
- `sort_order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: State ID (partial match, case-insensitive)
- `device_id`: Device ID (partial match, case-insensitive)
- `device_name`: Device name (partial match, case-insensitive)
- `status`: Device state status - 'normal' or 'error'
- `payload_timestamp`: Unix timestamp within payload JSON (format: timestamp or start-end range)

#### Example Queries

```
# Search by device ID
GET /api/v1/device-states/search?query=device_id:abc123

# Search by device name
GET /api/v1/device-states/search?query=device_name:WASH-001

# Search by status
GET /api/v1/device-states/search?query=status:normal

# Search by timestamp range
GET /api/v1/device-states/search?query=payload_timestamp:1640995200000-1641081600000

# Search by single timestamp
GET /api/v1/device-states/search?query=payload_timestamp:1640995200000

# Complex search with multiple filters
GET /api/v1/device-states/search?query=device_id:abc123 status:normal payload_timestamp:1640995200000-1641081600000

# With pagination and sorting
GET /api/v1/device-states/search?query=status:error&page=2&limit=10&sort_by=created_at&sort_order=asc
```

#### Response Format

**Note:** The `created_at` field is automatically formatted as `YYYY-MM-DD HH:mm:ss` string format, and `state_data` includes a `date_state` field with the same formatted timestamp.

```json
{
  "success": true,
  "message": "Device states fetched successfully",
  "data": {
    "items": [
      {
        "id": "state_id",
        "device_id": "device_id",
        "state_data": {
          "timestamp": 1640995200000,
          "rssi": -65,
          "uptime": 3600,
          "status": "normal",
          "date_state": "2024-01-01 12:00:00"
        },
        "hash_state": "hash_value",
        "created_at": "2024-01-01 12:00:00",
        "device": {
          "id": "device_id",
          "name": "WASH-001",
          "type": "WASH",
          "status": "DEPLOYED",
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
- Users with `USER` permission can only access device states for devices they own
- Users with other permission types (e.g., `ADMIN`) can access device states for all devices
- The service automatically filters results based on the authenticated user's permissions

## Data Types

The API uses the `DeviceState` type from `internal.type.ts`:

```typescript
export type DeviceState = {
  timestamp: number;
  rssi: number;
  uptime: number;
  status: 'normal' | 'error';
};
```

## Database Schema

This API queries the `tbl_devices_state` table, which is partitioned by 60 days in PostgreSQL. The table contains:

- `id`: Unique state ID
- `device_id`: Reference to device
- `state_data`: JSON containing device state information
- `hash_state`: Hash of the state data
- `created_at`: Timestamp when the state was recorded
