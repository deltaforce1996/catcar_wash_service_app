# Dashboard API

This API provides dashboard data and analytics for the car wash service application, focusing on revenue analytics across different time periods.

## Endpoints

### GET /api/v1/dashboard

Get dashboard revenue summary with various filtering options and time-based analytics.

#### Query Parameters

- `user_id` (optional): Filter by specific user ID
- `device_id` (optional): Filter by specific device ID
- `device_status` (optional): Filter by device status - 'DEPLOYED' or 'DISABLED'
- `device_type` (optional): Filter by device type - 'WASH' or 'DRYING'
- `payment_status` (optional): Filter by payment status - 'SUCCESS', 'FAILED', or 'CANCELLED' (defaults to 'SUCCESS')
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

# Get dashboard data with device type filter
GET /api/v1/dashboard?device_type=WASH

# Get dashboard data with payment status filter
GET /api/v1/dashboard?payment_status=SUCCESS

# Get dashboard data for specific date
GET /api/v1/dashboard?date=2024-01-01

# Get dashboard data with charts
GET /api/v1/dashboard?include_charts=true

# Complex filtering
GET /api/v1/dashboard?device_status=DEPLOYED&device_type=WASH&payment_status=SUCCESS&date=2024-01-01&include_charts=true
```

#### Response Format

```json
{
  "success": true,
  "message": "Dashboard data fetched successfully",
  "data": {
    "monthly": {
      "revenue": 50000.00,
      "change": 15.5,
      "data": [
        { "month": "01", "amount": 4200.00 },
        { "month": "02", "amount": 4800.00 },
        { "month": "03", "amount": 5100.00 }
      ]
    },
    "daily": {
      "revenue": 1500.00,
      "change": -5.2,
      "data": [
        { "day": "01", "amount": 120.00 },
        { "day": "02", "amount": 150.00 },
        { "day": "03", "amount": 180.00 }
      ]
    },
    "hourly": {
      "revenue": 75.00,
      "change": 12.3,
      "data": [
        { "hour": "00", "amount": 5.00 },
        { "hour": "01", "amount": 8.00 },
        { "hour": "02", "amount": 12.00 }
      ]
    },
    "payment_status": "SUCCESS"
  }
}
```

#### Authentication & Authorization

This endpoint requires JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Access Control:**
- Users with `USER` permission can only access dashboard data for devices they own
- Users with other permission types (e.g., `ADMIN`) can access dashboard data for all devices
- The service automatically filters results based on the authenticated user's permissions

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

## Analytics Features

- **Monthly Revenue**: Shows revenue data for each month of the year with year-over-year percentage change
- **Daily Revenue**: Shows revenue data for each day of the month with month-over-month percentage change  
- **Hourly Revenue**: Shows revenue data for each hour of the day with day-over-day percentage change
- **Percentage Changes**: Calculates percentage changes compared to previous periods:
  - Monthly: Compared to same month previous year
  - Daily: Compared to same day previous month
  - Hourly: Compared to same hour previous day

## Performance Notes

- Uses materialized views for aggregated payment data (`mv_device_payments_month`, `mv_device_payments_day`, `mv_device_payments_hour`)
- Optimized queries for dashboard performance with proper indexing
- Chart data is conditionally included based on `include_charts` parameter
- Filters are applied at database level for efficiency
- Uses raw SQL queries for complex aggregations and time-based calculations