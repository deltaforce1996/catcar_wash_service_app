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

**Request Body:**
```json
{
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
      "hp_water": 30,
      "foam": 15
    }
  }
}
```

## Examples

### Example 1: Update WASH Device Values Only
```json
{
  "configs": {
    "sale": {
      "hp_water": 35,
      "foam": 20,
      "vacuum": 65,
      "promotion": 15
    }
  }
}
```

### Example 2: Update DRYING Device Values Only
```json
{
  "configs": {
    "sale": {
      "blow_dust": 25,
      "sterilize": 35,
      "start_service_fee": 25,
      "promotion": 20
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

### Example 4: Mixed Update (System + Sale)
```json
{
  "configs": {
    "system": {
      "on_time": "08:00"
    },
    "sale": {
      "hp_water": 40,
      "promotion": 20
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
          "description": "ปริมาณน้ำ"
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

## Key Features

1. **Type-Specific Configuration**: Different parameters available for WASH vs DRYING devices.
2. **Simple Key:Value Format**: Use simple key:value pairs for easy parameter updates.
3. **Value-Only Updates**: Can only update parameter values, preserving existing unit and description.
4. **Preserve Structure**: Maintains existing configuration structure while updating only values.
5. **Partial Updates**: Allows updating only specific parameters without affecting others.
6. **System Configuration**: Can update operating hours and payment methods.
7. **Safe Updates**: Prevents accidental changes to unit and description fields.
8. **Parameter Validation**: Warns when trying to update parameters that don't exist for the device type.

## Error Handling

- **Device Not Found**: Returns 404 if the device doesn't exist
- **Validation Errors**: Returns 400 for invalid request data

## Authentication

This endpoint requires JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```
