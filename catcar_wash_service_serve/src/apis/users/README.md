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
```

### PUT /api/v1/users/update-by-id/:id

Update user information by ID.

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

```json
{
  "success": true,
  "message": "User updated successfully",
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
      "name": "ADMIN"
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

- `UserStatus`: 'ACTIVE' | 'INACTIVE'
- `PermissionType`: 'ADMIN' | 'TECHNICIAN' | 'USER'

## Database Schema

This API queries the `tbl_users` table. The table contains:

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
