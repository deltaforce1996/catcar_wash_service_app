# Employees API

This API provides CRUD operations and search functionality for employees stored in the `tbl_emps` table.

## Endpoints

### GET /api/v1/emps/search

Search employees with various filtering options.

#### Query Parameters

- `query` (optional): Search query string with key-value pairs
- `search` (optional): General search term that searches id, name, email, line, and address fields
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field - 'created_at', 'updated_at', 'name', 'email', 'phone', 'line', 'address', 'status', or 'permission' (default: 'created_at')
- `sort_order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')

#### Query String Format

The `query` parameter supports the following searchable fields:

- `id`: Employee ID (exact match)
- `name`: Employee name (partial match, case-insensitive)
- `email`: Employee email (partial match, case-insensitive)
- `phone`: Employee phone number (partial match, case-insensitive)
- `line`: Employee LINE ID (partial match, case-insensitive)
- `address`: Employee address (partial match, case-insensitive)
- `status`: Employee status - 'ACTIVE' or 'INACTIVE'
- `permission`: Permission type - 'ADMIN', 'TECHNICIAN', or 'USER'

#### Example Queries

**General Search (searches id, name, email, line, and address fields):**
```
# Search for "john" in id, name, email, line, and address fields
GET /api/v1/emps/search?search=john

# Search for "emp001" in id, name, email, line, and address fields
GET /api/v1/emps/search?search=emp001

# Search for "tech" in id, name, email, line, and address fields
GET /api/v1/emps/search?search=tech
```

**Specific Field Search:**
```
# Query by name
GET /api/v1/emps/search?query=name:John

# Query by email
GET /api/v1/emps/search?query=email:john@company.com

# Query by status
GET /api/v1/emps/search?query=status:ACTIVE

# Query by permission
GET /api/v1/emps/search?query=permission:TECHNICIAN

# Query by LINE ID
GET /api/v1/emps/search?query=line:john_line

# Complex query with multiple filters
GET /api/v1/emps/search?query=status:ACTIVE permission:TECHNICIAN

# With pagination and sorting
GET /api/v1/emps/search?search=john&page=1&limit=10&sort_by=name&sort_order=asc
```

### PUT /api/v1/emps/update-by-id/:id

Update employee information by ID.

#### Request Body

```json
{
  "email": "newemail@company.com",
  "name": "John Smith Updated",
  "phone": "+1234567890",
  "line": "john_line_updated",
  "address": "456 Tech St",
  "status": "ACTIVE"
}
```

#### Response Format

```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": "emp_id",
    "name": "John Smith Updated",
    "email": "newemail@company.com",
    "phone": "+1234567890",
    "line": "john_line_updated",
    "address": "456 Tech St",
    "status": "ACTIVE",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T15:30:00.000Z",
    "permission": {
      "id": "permission_id",
      "name": "TECHNICIAN"
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

- `EmpStatus`: 'ACTIVE' | 'INACTIVE'
- `PermissionType`: 'ADMIN' | 'TECHNICIAN' | 'USER'

## Database Schema

This API queries the `tbl_emps` table. The table contains:

- `id`: Unique employee ID
- `name`: Employee's name
- `email`: Employee's email address (unique)
- `phone`: Employee's phone number (optional)
- `line`: Employee's LINE ID (optional)
- `address`: Employee's address (optional)
- `password`: Hashed password
- `permission_id`: Reference to permission
- `status`: Employee status (ACTIVE/INACTIVE)
- `created_at`: Timestamp when the employee was created
- `updated_at`: Timestamp when the employee was last updated
