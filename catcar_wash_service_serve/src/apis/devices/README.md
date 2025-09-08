# Devices API

This API provides CRUD operations and search functionality for devices stored in the `tbl_devices` table.

## Endpoints

### GET /api/v1/devices/search

Search devices with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
- `search` (optional): General search term that searches device ID, device name, and owner fullname fields
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field - 'created_at', 'updated_at', 'name', 'type', 'status', or 'register_at' (default: 'created_at')
- `sort_order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: Device ID (partial match, case-insensitive)
- `name`: Device name (partial match, case-insensitive)
- `owner`: Owner name (partial match, case-insensitive)
- `register`: Registered by employee name (partial match, case-insensitive)
- `type`: Device type - 'WASH' or 'DRYING'
- `status`: Device status - 'DEPLOYED' or 'DISABLED'

#### Example Queries

**General Search (searches device ID, device name, and owner fullname):**
```
# Search for "เครื่องที 1" in device ID, name, and owner fullname fields
GET /api/v1/devices/search?search=เครื่องที 1

# Search for "id01" in device ID, name, and owner fullname fields
GET /api/v1/devices/search?search=id01

# Search for "John" in device ID, name, and owner fullname fields
GET /api/v1/devices/search?search=John
```

**Specific Field Search:**
```
# Query by device name
GET /api/v1/devices/search?query=name:WASH-001

# Query by device ID
GET /api/v1/devices/search?query=id:DEV001

# Query by device type
GET /api/v1/devices/search?query=type:WASH

# Query by status
GET /api/v1/devices/search?query=status:DEPLOYED

# Query by owner
GET /api/v1/devices/search?query=owner:John

# Query by registered by
GET /api/v1/devices/search?query=register:Tech

# Query search with multiple filters
GET /api/v1/devices/search?query=type:WASH status:DEPLOYED

# With pagination and sorting
GET /api/v1/devices/search?search=เครื่องที 1&page=1&limit=10&sort_by=name&sort_order=asc
```

### GET /api/v1/devices/find-by-id/:id

Get device by ID.

#### Response Format

```json
{
  "success": true,
  "message": "Device found successfully",
  "data": {
    "id": "device_id",
    "name": "WASH-001",
    "type": "WASH",
    "status": "DEPLOYED",
    "information": {
      "mac_address": "00:11:22:33:44:55",
      "firmware_version": "1.0.0"
    },
    "configs": {
      "wash_setup": {
        "hp_water": { "value": 80, "unit": "psi", "description": "High pressure water" }
      }
    },
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T15:30:00.000Z",
    "owner": {
      "id": "owner_id",
      "fullname": "John Doe",
      "email": "john@example.com"
    },
    "registered_by": {
      "id": "emp_id",
      "name": "Tech Smith",
      "email": "tech@company.com"
    }
  }
}
```

### GET /api/v1/devices/by-owner/:ownerId

Get devices by owner ID.

### POST /api/v1/devices/create

Create a new device.

#### Request Body

```json
{
  "name": "WASH-002",
  "type": "WASH",
  "owner_id": "owner_id",
  "register_by": "emp_id",
  "information": {
    "mac_address": "00:11:22:33:44:56",
    "firmware_version": "1.1.0"
  },
  "configs": {
    "wash_setup": {
      "hp_water": { "value": 80, "unit": "psi", "description": "High pressure water" }
    }
  }
}
```

### PUT /api/v1/devices/update-by-id-basic/:id

Update basic device information by ID.

#### Request Body

```json
{
  "name": "WASH-001 Updated"
}
```

### PUT /api/v1/devices/update-configs/:id

Update device configurations by ID.

#### Request Body

```json
{
  "configs": {
    "system": {
      "on_time": "08:00",
      "off_time": "20:00"
    },
    "sale": {
      "hp_water": 80,
      "foam": 60,
      "air": 40
    }
  }
}
```

### PUT /api/v1/devices/set-status/:id

Set device status by ID. This endpoint allows updating the device status with permission-based access control.

#### Request Body

```json
{
  "status": "DEPLOYED"
}
```

#### Permission Rules

- **USER permission**: Can only set status for devices they own
- **Other permissions** (ADMIN, etc.): Can set status for any device

#### Response Format

```json
{
  "success": true,
  "data": null,
  "message": "Device status updated successfully"
}
```

## Authentication & Authorization

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Access Control:**
- Users with `USER` permission can only access devices they own
- Users with other permission types (e.g., `ADMIN`) can access all devices
- The service automatically filters results based on the authenticated user's permissions
- For device status updates, USER role can only set status for devices they own

## Usage Examples

### Setting Device Status

```bash
# Set device status to DEPLOYED (requires appropriate permissions)
curl -X PUT "https://api.example.com/api/v1/devices/set-status/device-id-123" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "DEPLOYED"}'

# Set device status to DISABLED
curl -X PUT "https://api.example.com/api/v1/devices/set-status/device-id-123" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "DISABLED"}'
```

### Permission-Based Access

- **USER role**: Can only set status for devices they own
- **ADMIN/SUPER_ADMIN roles**: Can set status for any device

If a USER tries to set status for a device they don't own, they will receive a "Device not found or access denied" error.

## Data Types

The API uses various Prisma enums and types:

- `DeviceType`: 'WASH' | 'DRYING'
- `DeviceStatus`: 'DEPLOYED' | 'DISABLED'

## Database Schema

This API queries the `tbl_devices` table. The table contains:

- `id`: Unique device ID
- `name`: Device name
- `type`: Device type (WASH/DRYING)
- `status`: Device status (DEPLOYED/DISABLED)
- `information`: JSON containing device information
- `configs`: JSON containing device configurations
- `owner_id`: Reference to device owner (user)
- `register_by_id`: Reference to employee who registered the device
- `created_at`: Timestamp when the device was created
- `updated_at`: Timestamp when the device was last updated
