# Emps (Technicians) API

This API provides CRUD operations and search functionality for technicians (employees) stored in the `tbl_emps` table.

## Endpoints

### POST /api/v1/emps/register

Register a new technician. **Admin only.**

#### Request Body

```json
{
  "fullname": "John Technician",
  "email": "john.tech@example.com",
  "phone": "+1234567890",
  "address": "123 Tech St",
  "custom_name": "Johnny"
}
```

#### Response Format

```json
{
  "success": true,
  "message": "Technician registered successfully",
  "data": {
    "id": "emp_id",
    "fullname": "John Technician",
    "email": "john.tech@example.com",
    "status": "ACTIVE",
    "phone": "+1234567890",
    "address": "123 Tech St",
    "custom_name": "Johnny",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z",
    "permission": {
      "id": "permission_id",
      "name": "TECHNICIAN"
    }
  }
}
```

### GET /api/v1/emps/search

Search technicians with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
- `search` (optional): General search term that searches id, name, email, line, and address fields
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field - 'created_at', 'updated_at', 'name', 'email', 'phone', 'line', 'address', 'status', or 'permission' (default: 'created_at')
- `sort_order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: Technician ID (exact match)
- `name`: Technician name (partial match, case-insensitive)
- `email`: Technician email (partial match, case-insensitive)
- `phone`: Technician phone number (partial match, case-insensitive)
- `line`: Technician LINE ID (partial match, case-insensitive)
- `address`: Technician address (partial match, case-insensitive)
- `status`: Technician status - 'ACTIVE' or 'INACTIVE'
- `permission`: Permission type - 'TECHNICIAN'

#### Example Queries

```bash
# General search (searches id, name, email, line, and address fields)
GET /api/v1/emps/search?search=john

# Search by specific field
GET /api/v1/emps/search?query=name:John

# Search by status
GET /api/v1/emps/search?query=status:ACTIVE

# Search by email
GET /api/v1/emps/search?query=email:john@example.com

# Complex query with multiple filters
GET /api/v1/emps/search?query=status:ACTIVE permission:TECHNICIAN

# With pagination and sorting
GET /api/v1/emps/search?search=tech&page=1&limit=10&sort_by=name&sort_order=asc
```

### GET /api/v1/emps/find-by-id/:id

Get technician information by ID.

#### Response Format

Same as register endpoint.

### PUT /api/v1/emps/update-profile

Update your own technician profile information. This endpoint automatically uses the authenticated technician's ID from the JWT token.

#### Request Body

```json
{
  "email": "newemail@example.com",
  "fullname": "John Technician Updated",
  "phone": "+1234567890",
  "address": "123 Tech St Updated",
  "custom_name": "Johnny Updated"
}
```

#### Response Format

```json
{
  "success": true,
  "message": "Emp profile updated successfully",
  "data": {
    "id": "emp_id",
    "fullname": "John Technician Updated",
    "email": "newemail@example.com",
    "status": "ACTIVE",
    "phone": "+1234567890",
    "address": "123 Tech St Updated",
    "custom_name": "Johnny Updated",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T15:30:00.000Z",
    "permission": {
      "id": "permission_id",
      "name": "TECHNICIAN"
    }
  }
}
```

### PUT /api/v1/emps/update-by-id/:id

Update any technician's information by ID. **Admin only.**

#### Request Body

Same as update-profile endpoint.

#### Response Format

Same as update-profile endpoint.

## Authentication & Authorization

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Permission Requirements:**
- `POST /api/v1/emps/register`: Requires **ADMIN** role
- `GET /api/v1/emps/search`: Requires **ADMIN** or **TECHNICIAN** role
- `GET /api/v1/emps/find-by-id/:id`: Requires **ADMIN** or **TECHNICIAN** role
- `PUT /api/v1/emps/update-profile`: Requires **TECHNICIAN** role - can only update your own profile
- `PUT /api/v1/emps/update-by-id/:id`: Requires **ADMIN** role - can update any technician's profile

## Data Types

The API uses various Prisma enums and types:

- `UserStatus`: 'ACTIVE' | 'INACTIVE'
- `PermissionType`: 'ADMIN' | 'TECHNICIAN' | 'USER'

## Features

- **Role-based Access Control**: 
  - Technicians can only update their own profile
  - Admins can update any technician's profile
  - Proper permission validation using JWT tokens
- **Search Functionality**: Supports both general search and specific field filtering
- **Pagination**: Built-in pagination with configurable page size

## Database Schema

This API queries the `tbl_emps` table. The table contains:

**tbl_emps:**
- `id`: Unique technician ID
- `fullname`: Technician's full name
- `email`: Technician's email address (unique)
- `status`: Technician status (ACTIVE/INACTIVE)
- `phone`: Technician's phone number (optional)
- `address`: Technician's address (optional)
- `password`: Hashed password
- `custom_name`: Custom display name (optional)
- `permission_id`: Reference to permission (TECHNICIAN)
- `created_at`: Timestamp when the technician was created
- `updated_at`: Timestamp when the technician was last updated