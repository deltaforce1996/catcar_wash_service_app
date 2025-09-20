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
- `exclude_all_ref_table` (optional): Boolean flag to exclude reference tables (owner, registered_by) from response (default: false)

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: Device ID (partial match, case-insensitive)
- `name`: Device name (partial match, case-insensitive)
- `owner`: Owner name (partial match, case-insensitive)
- `register`: Registered by employee name (partial match, case-insensitive)
- `type`: Device type - 'WASH' or 'DRYING'
- `status`: Device status - 'DEPLOYED' or 'DISABLED'
- `search`: General search term that searches device ID, device name, and owner fullname fields

#### Example Queries

**General Search (searches device ID, device name, and owner fullname):**

```
# Search for "เครื่องที 1" in device ID, name, and owner fullname fields
GET /api/v1/devices/search?query=search:เครื่องที 1

# Search for "id01" in device ID, name, and owner fullname fields
GET /api/v1/devices/search?query=search:id01

# Search for "John" in device ID, name, and owner fullname fields
GET /api/v1/devices/search?query=search:John
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
GET /api/v1/devices/search?query=search:เครื่องที 1&page=1&limit=10&sort_by=name&sort_order=asc

# Exclude reference tables for better performance
GET /api/v1/devices/search?query=search:เครื่องที 1&exclude_all_ref_table=true

# Complex query without reference tables
GET /api/v1/devices/search?query=type:WASH status:DEPLOYED&exclude_all_ref_table=true&page=1&limit=20
```

#### Response Format

**With reference tables (default behavior):**

```json
{
  "success": true,
  "message": "Devices searched successfully",
  "data": {
    "items": [
      {
        "id": "device_id",
        "name": "WASH-001",
        "type": "WASH",
        "status": "DEPLOYED",
        "information": {
          "mac_address": "00:11:22:33:44:55",
          "firmware_version": "1.0.0"
        },
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
        },
        "last_state": {
          "state_data": {
            "rssi": -62,
            "status": "error",
            "uptime": 77499,
            "timestamp": 1758344236409,
            "datetime": "2025-09-20 11:57:16"
          }
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Without reference tables (exclude_all_ref_table=true):**

```json
{
  "success": true,
  "message": "Devices searched successfully",
  "data": {
    "items": [
      {
        "id": "device_id",
        "name": "WASH-001",
        "type": "WASH",
        "status": "DEPLOYED",
        "information": {
          "mac_address": "00:11:22:33:44:55",
          "firmware_version": "1.0.0"
        },
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
        },
        "created_at": "2024-01-01T12:00:00.000Z",
        "updated_at": "2024-01-01T15:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
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
    },
    "last_state": {
      "state_data": {
        "rssi": -62,
        "status": "error",
        "uptime": 77499,
        "timestamp": 1758344236409,
        "datetime": "2025-09-20 11:57:16"
      }
    }
  }
}
```

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
    "system": {
      "on_time": "08:00",
      "off_time": "20:00",
      "payment_method": {
        "coin": true,
        "promptpay": true,
        "bank_note": false
      }
    },
    "sale": {
      "hp_water": 80,
      "foam": 60,
      "air": 40,
      "water": 30,
      "vacuum": 50
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
      "on_time": "09:00",
      "off_time": "21:00",
      "payment_method": {
        "coin": true,
        "promptpay": true,
        "bank_note": true
      }
    },
    "sale": {
      "hp_water": 85,
      "foam": 65,
      "air": 45,
      "water": 35,
      "vacuum": 55
    }
  }
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

## Usage Examples

### Creating a Device

```bash
# Create a new WASH device
curl -X POST "https://api.example.com/api/v1/devices/create" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WASH-001",
    "type": "WASH",
    "owner_id": "owner-id-123",
    "register_by": "emp-id-456",
    "information": {
      "mac_address": "00:11:22:33:44:55",
      "firmware_version": "1.0.0"
    },
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
  }'
```

### Updating Device Configurations

```bash
# Update device configurations
curl -X PUT "https://api.example.com/api/v1/devices/update-configs/device-id-123" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "configs": {
      "system": {
        "on_time": "09:00",
        "off_time": "21:00"
      },
      "sale": {
        "hp_water": 85,
        "foam": 65
      }
    }
  }'
```

## Features

- **Performance Optimization**: Use `exclude_all_ref_table=true` to skip reference table joins for faster response times
- **Permission-based Access Control**:
  - Users with `USER` permission can only access devices they own
  - Users with other permission types can access all devices
  - Automatic filtering based on authenticated user's permissions
- **Search Functionality**: Supports both general search and specific field filtering
- **Pagination**: Built-in pagination with configurable page size
- **Reference Table Control**: Can exclude owner and registered_by information for better performance
- **Device State Tracking**: Includes last device state information in responses
- **Configuration Management**: Separate endpoints for basic device info and configuration updates

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
- `information`: JSON containing device information (mac_address, firmware_version, etc.)
- `configs`: JSON containing device configurations (system settings, sale parameters)
- `owner_id`: Reference to device owner (user)
- `register_by_id`: Reference to employee who registered the device
- `created_at`: Timestamp when the device was created
- `updated_at`: Timestamp when the device was last updated

### Related Tables

- `tbl_users`: Device owners (referenced by `owner_id`)
- `tbl_emps`: Employees who register devices (referenced by `register_by_id`)
- `tbl_device_states`: Device state tracking (referenced by `last_state`)
