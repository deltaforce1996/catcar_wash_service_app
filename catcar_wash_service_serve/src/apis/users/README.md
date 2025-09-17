# Users API

This API provides CRUD operations and search functionality for users stored in the `tbl_users` table.

## Endpoints

### GET /api/v1/users/search

Search users with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
- `search` (optional): General search term that searches id, fullname, email, phone, and address fields
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field - 'created_at', 'updated_at', 'fullname', 'email', 'phone', 'address', 'status', or 'permission' (default: 'created_at')
- `sort_order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')
- `exclude_device_counts` (optional): Boolean flag to exclude device counts from response (default: false)

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: User ID (partial match, case-insensitive)
- `fullname`: User full name (partial match, case-insensitive)
- `email`: User email (partial match, case-insensitive)
- `phone`: User phone number (partial match, case-insensitive)
- `address`: User address (partial match, case-insensitive)
- `status`: User status - 'ACTIVE' or 'INACTIVE'
- `permission`: Permission type - 'ADMIN', 'TECHNICIAN', or 'USER'

#### Example Queries

**General Search (searches id, fullname, email, phone, and address fields):**
```
# Search for "john" in id, fullname, email, phone, and address fields
GET /api/v1/users/search?search=john

# Search for "user001" in id, fullname, email, phone, and address fields
GET /api/v1/users/search?search=user001

# Search for "admin" in id, fullname, email, phone, and address fields
GET /api/v1/users/search?search=admin
```

**Specific Field Search:**
```
# Query by full name
GET /api/v1/users/search?query=fullname:John

# Query by email
GET /api/v1/users/search?query=email:john@example.com

# Query by status
GET /api/v1/users/search?query=status:ACTIVE

# Query by permission
GET /api/v1/users/search?query=permission:ADMIN

# Complex query with multiple filters
GET /api/v1/users/search?query=status:ACTIVE permission:ADMIN

# With pagination and sorting
GET /api/v1/users/search?search=john&page=1&limit=10&sort_by=fullname&sort_order=asc

# Exclude device counts for better performance
GET /api/v1/users/search?search=john&exclude_device_counts=true

# Complex query without device counts
GET /api/v1/users/search?query=status:ACTIVE permission:ADMIN&exclude_device_counts=true&page=1&limit=20
```

#### Response Format

**With device counts (default behavior):**
```json
{
  "success": true,
  "message": "Users searched successfully",
  "data": {
    "items": [
      {
        "id": "user_id",
        "fullname": "John Doe",
        "email": "john@example.com",
        "status": "ACTIVE",
        "phone": "+1234567890",
        "address": "123 Main St",
        "custom_name": "Johnny",
        "created_at": "2024-01-01T12:00:00.000Z",
        "updated_at": "2024-01-01T15:30:00.000Z",
        "permission": {
          "id": "permission_id",
          "name": "USER"
        },
        "device_counts": {
          "total": 5,
          "active": 3,
          "inactive": 2
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

**Without device counts (exclude_device_counts=true):**
```json
{
  "success": true,
  "message": "Users searched successfully",
  "data": {
    "items": [
      {
        "id": "user_id",
        "fullname": "John Doe",
        "email": "john@example.com",
        "status": "ACTIVE",
        "phone": "+1234567890",
        "address": "123 Main St",
        "custom_name": "Johnny",
        "created_at": "2024-01-01T12:00:00.000Z",
        "updated_at": "2024-01-01T15:30:00.000Z",
        "permission": {
          "id": "permission_id",
          "name": "USER"
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

### PUT /api/v1/users/update-profile

Update your own user profile information. This endpoint automatically uses the authenticated user's ID from the JWT token.

#### Request Body

```json
{
  "email": "newemail@example.com",
  "fullname": "John Doe Updated",
  "phone": "+1234567890",
  "address": "123 Main St",
  "custom_name": "Johnny",
  "status": "ACTIVE"
}
```

#### Response Format

**Note:** The response includes device counts for each user showing total, active, and inactive devices.

```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "id": "user_id",
    "fullname": "John Doe Updated",
    "email": "newemail@example.com",
    "status": "ACTIVE",
    "phone": "+1234567890",
    "address": "123 Main St",
    "custom_name": "Johnny",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T15:30:00.000Z",
    "permission": {
      "id": "permission_id",
      "name": "USER"
    },
    "device_counts": {
      "total": 5,
      "active": 3,
      "inactive": 2
    }
  }
}
```

### PUT /api/v1/users/update-by-id/:id

Update any user's information by ID. **Admin only.**

#### Request Body

```json
{
  "email": "newemail@example.com",
  "fullname": "John Doe Updated",
  "phone": "+1234567890",
  "address": "123 Main St",
  "custom_name": "Johnny",
  "status": "ACTIVE"
}
```

#### Response Format

Same as update-profile endpoint.

#### Authentication & Authorization

Both endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Permission Requirements:**
- `PUT /api/v1/users/update-profile`: Requires **USER** role - can only update your own profile
- `PUT /api/v1/users/update-by-id/:id`: Requires **ADMIN** role - can update any user's profile

## Data Types

The API uses various Prisma enums and types:

- `UserStatus`: 'ACTIVE' | 'INACTIVE'
- `PermissionType`: 'ADMIN' | 'TECHNICIAN' | 'USER'

## Features

- **Device Counts**: Each user response includes device statistics (can be excluded for better performance):
  - `total`: Total number of devices owned by the user
  - `active`: Number of devices with DEPLOYED status
  - `inactive`: Number of devices with DISABLED status
- **Performance Optimization**: Use `exclude_device_counts=true` to skip device count calculations for faster response times
- **Search Functionality**: Supports both general search and specific field filtering
- **Pagination**: Built-in pagination with configurable page size
- **Role-based Access Control**: 
  - Users can only update their own profile
  - Admins can update any user's profile
  - Proper permission validation using JWT tokens

## Database Schema

This API queries the `tbl_users` table and aggregates data from `tbl_devices` for device counts. The tables contain:

**tbl_users:**
- `id`: Unique user ID
- `fullname`: User's full name
- `email`: User's email address (unique)
- `status`: User status (ACTIVE/INACTIVE)
- `phone`: User's phone number (optional)
- `address`: User's address (optional)
- `password`: Hashed password
- `custom_name`: Custom display name (optional)
- `permission_id`: Reference to permission
- `created_at`: Timestamp when the user was created
- `updated_at`: Timestamp when the user was last updated

**tbl_devices (for device counts):**
- `owner_id`: Reference to user who owns the device
- `status`: Device status (DEPLOYED/DISABLED)
