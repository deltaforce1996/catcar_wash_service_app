# Devices API

This API provides CRUD operations and search functionality for devices stored in the `tbl_devices` table.

## Endpoints

### GET /api/v1/devices/search

Search devices with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
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

```
# Search by device name
GET /api/v1/devices/search?query=name:WASH-001

# Search by device type
GET /api/v1/devices/search?query=type:WASH

# Search by status
GET /api/v1/devices/search?query=status:DEPLOYED

# Search by owner
GET /api/v1/devices/search?query=owner:John

# Search by registered by
GET /api/v1/devices/search?query=register:Tech

# Complex search with multiple filters
GET /api/v1/devices/search?query=type:WASH status:DEPLOYED

# With pagination and sorting
GET /api/v1/devices/search?query=type:WASH&page=2&limit=10&sort_by=name&sort_order=asc
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

### PUT /api/v1/devices/update-by-id/:id

Update device by ID.

#### Request Body

```json
{
  "name": "WASH-001 Updated",
  "type": "WASH",
  "status": "DEPLOYED",
  "information": {
    "mac_address": "00:11:22:33:44:55",
    "firmware_version": "1.2.0"
  },
  "configs": {
    "wash_setup": {
      "hp_water": { "value": 85, "unit": "psi", "description": "High pressure water" }
    }
  },
  "owner_id": "new_owner_id"
}
```

#### Authentication

This endpoint requires JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

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
