# CatCar Wash Service - Database Setup Guide

> A comprehensive guide for setting up the CatCar Wash Service database with **PostgreSQL**, **Prisma ORM**, and **partitioned tables** for optimal performance.

## 🚀 Project Overview

The CatCar Wash Service is a full-stack application consisting of:

- **Backend API** (`catcar_wash_service_serve`): NestJS server with Prisma ORM
- **Frontend** (`catcar_wash_service_frontend`): Nuxt.js Vue.js application
- **Scripts** (`catcar_wash_service_script`): Python utilities for database maintenance
- **Database**: PostgreSQL with advanced partitioning and materialized views

## ✅ Prerequisites

* **Node.js** 18+ 
* **PostgreSQL** 13+
* **pnpm** (recommended) or npm
* `psql` CLI for database operations

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd catcar_wash_service_app

# Install dependencies for backend
cd catcar_wash_service_serve
pnpm install

# Install Prisma CLI globally (if not already installed)
pnpm add -g prisma
```

### Environment Configuration

Create `.env` file in `catcar_wash_service_serve/`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/catcar_wash_db?schema=public"
JWT_SECRET="your-jwt-secret-key"
```

---

## 📁 Prisma Folder Structure

```
catcar_wash_service_serve/
├── prisma/                             # Prisma configuration directory
│   ├── migrations/                     # Database migration files
│   │   ├── 20250829112513_carwash_postage_db/
│   │   │   └── migration.sql           # Base tables and core schema
│   │   ├── 20250829112611_partition_60d_devices_events_states/
│   │   │   └── migration.sql           # Partitioned tables setup
│   │   ├── 20250829112710_materialzed_view/
│   │   │   └── migration.sql           # Analytics materialized views
│   │   ├── 20250904160012_add_tbl_device_last_state/
│   │   │   └── migration.sql           # Device state optimization
│   │   └── migration_lock.toml         # Migration lock file
│   ├── schema.prisma                   # Database schema definition
│   ├── seed.ts                         # Database seeding script
│   └── README.md                       # This documentation file
└── src/
    └── database/
        └── prisma/                     # NestJS Prisma integration
            ├── prisma.service.ts       # PrismaClient service wrapper
            └── prisma.module.ts        # Global Prisma module
```

### Key Files Explained

- **`schema.prisma`**: Defines database models, relationships, and enums
- **`migrations/`**: Contains SQL migration files with version history
- **`seed.ts`**: Populates database with initial data (permissions, super admin)
- **`prisma.service.ts`**: NestJS service that extends PrismaClient with lifecycle hooks
- **`prisma.module.ts`**: Global module that provides PrismaService across the app

> The database schema is managed through **Prisma migrations** with **partitioned tables** and **materialized views** for optimal performance.

---

## 🗄️ Database Schema Overview

The CatCar Wash Service database includes the following main entities:

### Core Tables
- **`tbl_permissions`** - User permission levels (ADMIN, TECHNICIAN, USER)
- **`tbl_users`** - Customer user accounts
- **`tbl_emps`** - Employee accounts
- **`tbl_devices`** - Car wash devices (WASH/DRYING types)

### Partitioned Tables (for performance)
- **`tbl_devices_state`** - Device state logs (partitioned by 60 days)
- **`tbl_devices_events`** - Device event logs (partitioned by 30 days)

### Materialized Views (for analytics)
- **`mv_device_payments_hour`** - Hourly payment summaries
- **`mv_device_payments_day`** - Daily payment summaries  
- **`mv_device_payments_month`** - Monthly payment summaries
- **`mv_device_payments_year`** - Yearly payment summaries

### Key Features
- **Partitioning**: Large tables are partitioned by time for optimal query performance
- **Materialized Views**: Pre-computed analytics for dashboard reporting
- **Soft Deletes**: Status-based deletion (ACTIVE/INACTIVE)
- **Audit Trails**: Created/updated timestamps on all entities

---

## 🚀 Quick Setup Guide

### 1. Database Migration

```bash
# Navigate to backend directory
cd catcar_wash_service_serve

# Run database migrations (creates tables, partitions, and views)
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 2. Database Seeding

```bash
# Seed the database with initial data (permissions and super admin)
npm run db:seed
# or
npx prisma db seed
```

### 3. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📊 Database Features

### Partitioning Strategy

The database uses **time-based partitioning** for optimal performance:

- **`tbl_devices_state`**: Partitioned by **60 days**
- **`tbl_devices_events`**: Partitioned by **30 days**

Partitioning is automatically handled through Prisma migrations and Python scripts in `catcar_wash_service_script/`.

### Materialized Views

Pre-computed analytics views for dashboard performance:

```sql
-- Example: Query daily payment summaries
SELECT * FROM mv_device_payments_day 
WHERE day >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY day DESC;
```

---

## 🔧 Prisma Service Integration

The application uses a **PrismaService** that extends PrismaClient with NestJS lifecycle hooks:

```typescript
// src/database/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: config.get<string>('DATABASE_URL'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Usage in Controllers

```typescript
// Example: Using PrismaService in a controller
@Controller('devices')
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.tbl_devices.findMany({
      include: {
        owner: true,
        registered_by: true,
        device_states: {
          take: 10,
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }
}
```

### Materialized View Queries

```typescript
// Query materialized views using raw SQL
async getDailyPayments(deviceId: string, days: number = 30) {
  return this.prisma.$queryRaw`
    SELECT * FROM mv_device_payments_day 
    WHERE device_id = ${deviceId}
    AND day >= CURRENT_DATE - INTERVAL '${days} days'
    ORDER BY day DESC
  `;
}
```

---

## 🔄 Migration Management

### Development Environment

```bash
# Create and apply new migration
npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ DESTROYS ALL DATA)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Production Deployment

```bash
# Deploy migrations to production (safe, non-destructive)
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate
```

### Migration Files Structure

The project includes these key migrations:

1. **`20250829112513_carwash_postage_db`** - Base tables and core schema
2. **`20250829112611_partition_60d_devices_events_states`** - Partitioned tables setup
3. **`20250829112710_materialzed_view`** - Analytics materialized views
4. **`20250904160012_add_tbl_device_last_state`** - Device state optimization

### Custom SQL in Migrations

For complex operations not supported by Prisma schema, add raw SQL to migration files:

```sql
-- Example: Custom partitioning function
CREATE OR REPLACE FUNCTION create_device_state_partition(start_date DATE, end_date DATE)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
BEGIN
    partition_name := 'tbl_devices_state_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF tbl_devices_state 
                   FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

---

## 🗃️ Prisma Schema Configuration

The `schema.prisma` file defines the database structure with these key models:

### Core Models

```prisma
// Permission management
model tbl_permissions {
  id         String         @id @default(cuid())
  name       PermissionType @unique
  created_at DateTime       @default(now())
  updated_at DateTime       @updatedAt
  users      tbl_users[]
  employees  tbl_emps[]
  @@map("tbl_permissions")
}

// Device management
model tbl_devices {
  id           String       @id @default(cuid())
  name         String
  type         DeviceType   // WASH or DRYING
  status       DeviceStatus @default(DISABLED)
  owner_id     String
  register_by_id String
  created_at   DateTime     @default(now())
  
  owner         tbl_users @relation(fields: [owner_id], references: [id])
  registered_by tbl_emps  @relation(fields: [register_by_id], references: [id])
  device_states tbl_devices_state[]
  device_events tbl_devices_events[]
  
  @@map("tbl_devices")
}
```

### Partitioned Models (Performance)

```prisma
// Partitioned by 60 days
model tbl_devices_state {
  id         String   @id @default(cuid())
  device_id  String
  state_data Json?
  hash_state String?
  created_at DateTime @default(now())
  
  device tbl_devices @relation(fields: [device_id], references: [id])
  @@map("tbl_devices_state")
  @@index([device_id, created_at])
}

// Partitioned by 30 days
model tbl_devices_events {
  id         String    @default(cuid())
  device_id  String
  payload    Json?
  created_at DateTime  @default(now())
  
  device tbl_devices @relation(fields: [device_id], references: [id])
  @@id([id, created_at])
  @@map("tbl_devices_events")
}
```

### Materialized Views (Analytics)

```prisma
// Ignored by Prisma migrations but queryable
model mv_device_payments_day {
  device_id    String
  day          DateTime
  status       String?
  total_amount Decimal
  coin_sum     Decimal?
  bank_sum     Decimal?
  qr_net_sum   Decimal?
  
  @@id([device_id, day, status])
  @@map("mv_device_payments_day")
  @@ignore // Prevents Prisma from creating/managing this table
}
```

> **Note**: Materialized views are marked with `@@ignore` to prevent Prisma from managing them, but they can still be queried using `$queryRaw`.

---

## 🔄 Development Workflow

### Typical Development Cycle

1. **Schema Changes**: Modify `schema.prisma`
2. **Create Migration**: `npx prisma migrate dev --name describe_change`
3. **Generate Client**: `npx prisma generate` (automatic with migrate dev)
4. **Test Changes**: Run application and test functionality
5. **Deploy**: `npx prisma migrate deploy` (production)

### Working with Partitions

```bash
# Check partition status
psql "$DATABASE_URL" -c "SELECT schemaname, tablename, partitionname 
FROM pg_tables 
WHERE tablename LIKE 'tbl_devices_%' 
ORDER BY tablename;"

# Create new partitions (run Python script)
cd ../catcar_wash_service_script
python partition_60d_cron.py
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Migration Conflicts

```bash
# Reset database (⚠️ DESTROYS DATA)
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate resolve --applied "migration_name"
```

#### 2. Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check connection string format
echo $DATABASE_URL
```

#### 3. Partition Management

```sql
-- Check if partitions exist
SELECT * FROM pg_partitions 
WHERE parent_table = 'tbl_devices_state';

-- Create missing partitions manually
SELECT create_device_state_partition('2025-01-01', '2025-02-01');
```

#### 4. Materialized View Refresh

```sql
-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_day;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_hour;
```

### Performance Optimization

#### Database Indexes

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Add missing indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_owner_status 
ON tbl_devices(owner_id, status);
```

#### Query Optimization

```typescript
// Use select to limit fields
const devices = await prisma.tbl_devices.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    owner: {
      select: { fullname: true, email: true }
    }
  },
  take: 50,
  orderBy: { created_at: 'desc' }
});

// Use raw queries for complex analytics
const analytics = await prisma.$queryRaw`
  SELECT device_id, COUNT(*) as event_count
  FROM tbl_devices_events 
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY device_id
  ORDER BY event_count DESC
`;
```

---

## 📚 Best Practices

### Schema Design
- Use `cuid()` for primary keys (better than auto-increment)
- Include `created_at` and `updated_at` on all tables
- Use enums for fixed value sets
- Mark materialized views with `@@ignore`

### Performance
- Partition large tables by time ranges
- Create indexes on foreign keys and commonly queried columns
- Use `$queryRaw` for complex analytics queries
- Implement connection pooling in production

### Security
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Use parameterized queries to prevent SQL injection
- Regular security updates for dependencies

---

## 🔗 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Partitioning Guide](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [NestJS Database Integration](https://docs.nestjs.com/recipes/prisma)

---

> **Ready to go!** 🚀 The CatCar Wash Service database is now set up with optimal performance through partitioning and materialized views.






## 🌱 Database Seeding

The `seed.ts` file populates the database with initial data. The seeding behavior depends on the `NODE_ENV` environment variable:

### Seeding Modes

#### 🔴 Production Mode (`NODE_ENV=production`)

Seeds **essential data only** - the minimum required to run the application:

1. **Permission Types**:
   - `ADMIN` - Full administrative access
   - `TECHNICIAN` - Technical staff access  
   - `USER` - Regular user access

2. **Super Admin Account**:
   - **Email**: `superadmin@catcarwash.com`
   - **Password**: `password!`
   - **Permission**: ADMIN
   - **Status**: ACTIVE

3. **Technician Account**:
   - **Email**: `technician@catcarwash.com`
   - **Password**: `password!`
   - **Permission**: ADMIN
   - **Status**: ACTIVE

4. **System Accounts** (for device management):
   - System User: `device-initial@system.catcarwash.com`
   - System Employee: `device-initial-emp@system.catcarwash.com`

**No demo users, devices, or test data are created in production mode.**

#### 🟢 Development Mode (`NODE_ENV=development` or not set)

Seeds **all data** including:
- All essential data (above)
- 2 demo users with payment information
- 7 demo devices (wash and drying machines)
- Device events (payment logs)
- Device states (historical and current)
- Materialized view refresh

### Running the Seed

```bash
# Production mode (essential data only)
NODE_ENV=production npx prisma db seed

# Development mode (all data including demos)
npx prisma db seed
# or
NODE_ENV=development npx prisma db seed
```

### Important Security Notes

⚠️ **CRITICAL**: Change the default admin passwords immediately after first deployment!

- All passwords are hashed with bcrypt (12 salt rounds)
- Seed uses `upsert` operations (safe to run multiple times)
- **Always change default credentials in production**
- Consider using environment variables for production passwords

### Complete Setup Sequence

```bash
# 1. Run migrations
npx prisma migrate dev

# 2. Generate Prisma client  
npx prisma generate

# 3. Seed initial data
npm run db:seed

# 4. Start development server
npm run start:dev
```
