# Dashboard API

This API provides dashboard data and analytics for the car wash service application.

## Endpoints

### GET /api/v1/dashboard

Get dashboard data with various filtering options.

#### Query Parameters

- `user_id` (optional): Filter by specific user ID
- `device_id` (optional): Filter by specific device ID
- `device_status` (optional): Filter by device status - 'DEPLOYED' or 'DISABLED'
- `payment_status` (optional): Filter by payment status - 'SUCCESS', 'FAILED', or 'CANCELLED'
- `date` (optional): Filter by specific date (ISO 8601 format: YYYY-MM-DD)
- `include_charts` (optional): Include chart data in response (boolean: true/false)

#### Example Queries

```
# Get basic dashboard data
GET /api/v1/dashboard

# Get dashboard data for specific user
GET /api/v1/dashboard?user_id=user123

# Get dashboard data for specific device
GET /api/v1/dashboard?device_id=device123

# Get dashboard data with device status filter
GET /api/v1/dashboard?device_status=DEPLOYED

# Get dashboard data with payment status filter
GET /api/v1/dashboard?payment_status=SUCCESS

# Get dashboard data for specific date
GET /api/v1/dashboard?date=2024-01-01

# Get dashboard data with charts
GET /api/v1/dashboard?include_charts=true

# Complex filtering
GET /api/v1/dashboard?device_status=DEPLOYED&payment_status=SUCCESS&date=2024-01-01&include_charts=true
```

#### Response Format

```json
{
  "success": true,
  "message": "Dashboard data fetched successfully",
  "data": {
    "summary": {
      "total_devices": 50,
      "active_devices": 45,
      "total_users": 1200,
      "total_revenue": 50000.00,
      "today_transactions": 150,
      "success_rate": 95.5
    },
    "devices": [
      {
        "id": "device_id",
        "name": "WASH-001",
        "type": "WASH",
        "status": "DEPLOYED",
        "today_revenue": 500.00,
        "today_transactions": 25,
        "success_rate": 96.0
      }
    ],
    "recent_transactions": [
      {
        "id": "transaction_id",
        "device_id": "device_id",
        "amount": 50.00,
        "status": "SUCCESS",
        "timestamp": "2024-01-01T12:00:00.000Z",
        "user_id": "user123"
      }
    ],
    "charts": {
      "revenue_by_hour": [
        { "hour": 0, "revenue": 100.00 },
        { "hour": 1, "revenue": 150.00 }
      ],
      "transactions_by_status": [
        { "status": "SUCCESS", "count": 140 },
        { "status": "FAILED", "count": 7 },
        { "status": "CANCELLED", "count": 3 }
      ],
      "device_performance": [
        {
          "device_id": "device_id",
          "name": "WASH-001",
          "revenue": 500.00,
          "transactions": 25,
          "success_rate": 96.0
        }
      ]
    }
  }
}
```

#### Authentication

This endpoint requires JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Data Types

The API uses various Prisma enums and types:

- `DeviceStatus`: 'DEPLOYED' | 'DISABLED'
- `DeviceType`: 'WASH' | 'DRYING'
- `PaymentStatus`: 'SUCCESS' | 'FAILED' | 'CANCELLED'

## Database Schema

This API queries multiple tables:

- `tbl_devices`: Device information and status
- `tbl_devices_events`: Device event logs and transactions
- `tbl_users`: User information
- `tbl_emps`: Employee information
- `mv_device_payments_hour`: Materialized view for hourly payment data
- `mv_device_payments_day`: Materialized view for daily payment data
- `mv_device_payments_month`: Materialized view for monthly payment data
- `mv_device_payments_year`: Materialized view for yearly payment data

## Performance Notes

- Uses materialized views for aggregated payment data
- Optimized queries for dashboard performance
- Chart data is cached for better response times
- Filters are applied at database level for efficiency