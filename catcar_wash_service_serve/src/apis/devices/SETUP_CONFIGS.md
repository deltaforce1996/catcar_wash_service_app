# Device Configuration Update API

This document describes the device configuration update endpoint that has been added to the devices API.

## Endpoint

### PUT /api/v1/devices/update-configs/:id

Updates device configuration values only. This endpoint preserves existing unit and description while allowing you to update only the parameter values using simple key:value format. The configuration is type-specific, meaning WASH and DRYING devices have different available parameters.

## Available Parameters by Device Type

### WASH Device Parameters:
- `hp_water` - High pressure water duration
- `foam` - Foam application duration  
- `air` - Air drying duration
- `water` - Water rinse duration
- `vacuum` - Vacuum service duration
- `black_tire` - Tire cleaning duration
- `wax` - Wax application duration
- `air_conditioner` - Air freshener duration
- `parking_fee` - Parking fee penalty
- `promotion` - Discount percentage

### DRYING Device Parameters:
- `blow_dust` - Dust blowing duration
- `sterilize` - Sterilization duration
- `uv` - UV treatment duration
- `ozone` - Ozone cleaning duration
- `drying` - Air drying duration
- `perfume` - Perfume application duration
- `start_service_fee` - Starting service fee
- `promotion` - Discount percentage

**Request Body Format:**

For **WASH devices** (value-based, shorthand):
```json
{
  "configs": {
    "system": { ... },
    "sale": {
      "hp_water": 30,
      "foam": 15
    },
    "pricing": {
      "promotion": 10
    }
  }
}
```

Or explicit format:
```json
{
  "configs": {
    "sale": {
      "hp_water": { "value": 30 },
      "foam": { "value": 15 }
    }
  }
}
```

For **DRYING devices** (time range-based):
```json
{
  "configs": {
    "system": { ... },
    "sale": {
      "uv": { "start": 200, "end": 300 },
      "ozone": { "start": 300, "end": 400 }
    },
    "pricing": {
      "base_fee": 10,
      "work_period": 600
    }
  }
}
```

## Examples

### Example 1: Update WASH Device Sale Configs (Shorthand)
```json
{
  "configs": {
    "sale": {
      "hp_water": 35,
      "foam": 20,
      "vacuum": 65
    }
  }
}
```

### Example 2: Update DRYING Device Sale Configs
```json
{
  "configs": {
    "sale": {
      "blow_dust": { "start": 0, "end": 25 },
      "sterilize": { "start": 25, "end": 60 },
      "uv": { "start": 60, "end": 90 }
    }
  }
}
```

### Example 2b: Update DRYING Partial Config (start or end only)
```json
{
  "configs": {
    "sale": {
      "uv": { "end": 300 },
      "ozone": { "start": 300 }
    }
  }
}
```

### Example 3: Update System Configuration Only
```json
{
  "configs": {
    "system": {
      "on_time": "07:00",
      "off_time": "23:00",
      "payment_method": {
        "coin": false,
        "promptpay": true,
        "bank_note": true
      }
    }
  }
}
```

### Example 4: Mixed Update for WASH Device
```json
{
  "configs": {
    "system": {
      "on_time": "08:00"
    },
    "sale": {
      "hp_water": 40
    },
    "pricing": {
      "promotion": 10
    }
  }
}
```

### Example 5: Mixed Update for DRYING Device
```json
{
  "configs": {
    "system": {
      "on_time": "08:00"
    },
    "sale": {
      "uv": { "start": 200, "end": 300 }
    },
    "pricing": {
      "base_fee": 15,
      "promotion": 10
    }
  }
}
```

## Response Format

```json
{
  "success": true,
  "message": "Device configurations updated successfully",
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
      "system": {
        "on_time": "06:00",
        "off_time": "22:00",
        "payment_method": {
          "coin": true,
          "promptpay": true,
          "bank_note": false
        }
      },
      "sale": {
        "hp_water": {
          "value": 30,
          "unit": "วินาที",
          "description": "น้ำแรงดันสูง"
        },
        "foam": {
          "value": 15,
          "unit": "วินาที",
          "description": "โฟม"
        }
      },
      "pricing": {
        "base_fee": {
          "value": 10,
          "unit": "บาท",
          "description": "ค่าบริการเริ่มต้น"
        },
        "work_period": {
          "value": 600,
          "unit": "วินาที",
          "description": "ระยะเวลาการทำงาน"
        }
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

## Configuration Structure

### Sale Configuration

Sale parameters have **different structures** based on device type:

#### WASH Devices (value-based):
- Each parameter has a single `value` (in seconds per baht)
- `unit` and `description` are preserved and cannot be updated
- **Shorthand format (recommended)**: `"hp_water": 30`
- **Explicit format**: `"hp_water": { "value": 30 }`
- Both formats work the same way

#### DRYING Devices (time range-based):
- Each parameter has `start` and `end` values (in seconds)
- `unit` and `description` are preserved and cannot be updated
- You can update `start`, `end`, or both
- Structure: `{ "parameter_name": { "start"?: number, "end"?: number } }`
- Example: `"uv": { "start": 200, "end": 300 }`

### Pricing Configuration
Pricing parameters use a simple value structure:
- Send only the numeric value to update
- `unit` and `description` are preserved and cannot be updated
- Structure: Send `number` directly (e.g., `"base_fee": 10`)
- Works the same for both WASH and DRYING devices

## Key Features

1. **Type-Specific Configuration**: Different parameters and structures for WASH vs DRYING devices.
2. **Flexible Sale Updates**: 
   - WASH devices: Use shorthand `"hp_water": 30` or explicit `"hp_water": { "value": 30 }`
   - DRYING devices: Update `start`, `end`, or both `"uv": { "start": 200, "end": 300 }`
3. **Simple Pricing Updates**: Update pricing with simple numeric values.
4. **Preserve Metadata**: Unit and description fields are automatically preserved.
5. **Partial Updates**: Allows updating only specific parameters without affecting others.
6. **System Configuration**: Can update operating hours and payment methods.
7. **Safe Updates**: Prevents accidental changes to unit and description fields.
8. **Parameter Validation**: Throws error when trying to update parameters that don't exist for the device type.
9. **Auto-Detection**: Automatically detects device structure (value vs start/end) and updates accordingly.

## Error Handling

- **Device Not Found**: Returns 404 if the device doesn't exist
- **Validation Errors**: Returns 400 for invalid request data

## Authentication

This endpoint requires JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```
