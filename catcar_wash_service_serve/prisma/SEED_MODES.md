# Database Seeding Modes

This document explains how to use the database seeding system with production and development modes.

## Overview

The seed script (`seed.ts`) supports two modes controlled by the `NODE_ENV` environment variable:
- **Production Mode**: Seeds only essential data required to run the application
- **Development Mode**: Seeds essential data + demo data for testing and development

## Quick Start

### Production Mode

```bash
# Using environment variable
NODE_ENV=production npx prisma db seed

# Or with npm script
NODE_ENV=production npm run db:seed
```

### Development Mode

```bash
# Default behavior (no NODE_ENV or NODE_ENV=development)
npx prisma db seed

# Or explicitly
NODE_ENV=development npx prisma db seed

# Using npm script
npm run db:seed
```

## What Gets Seeded

### 🔴 Production Mode

**Essential Data Only:**
- ✅ 3 Permission types (ADMIN, TECHNICIAN, USER)
- ✅ Super Admin employee (`superadmin@catcarwash.com`)
- ✅ Technician employee (`technician@catcarwash.com`)
- ✅ System user for device initialization
- ✅ System employee for device registration

**Excluded:**
- ❌ Demo users
- ❌ Demo devices
- ❌ Device events/logs
- ❌ Device states
- ❌ Test data

### 🟢 Development Mode

**Everything:**
- ✅ All essential data (from production mode)
- ✅ 2 demo users with payment information
- ✅ 7 demo devices (WASH and DRYING types)
- ✅ Device payment events (5 per device)
- ✅ Device states (10 historical records per device)
- ✅ Device last states (current state for each device)
- ✅ Materialized view refresh

## Default Accounts

### Production & Development

| Role | Email | Password | Permission |
|------|-------|----------|------------|
| Super Admin | `superadmin@catcarwash.com` | `password!` | ADMIN |
| Technician | `technician@catcarwash.com` | `password!` | ADMIN |
| System User | `device-initial@system.catcarwash.com` | `password!` | USER |
| System Employee | `device-initial-emp@system.catcarwash.com` | `password!` | ADMIN |

### Development Only

| Role | Email | Password | Permission |
|------|-------|----------|------------|
| Demo User 1 | `user@catcarwash.com` | `password!` | USER |
| Demo User 2 | `user2@catcarwash.com` | `password!` | USER |

## Console Output

The seed script provides clear feedback about which mode is running:

### Production Mode Output
```
============================================================
Starting database seeding in PRODUCTION mode
============================================================

[Essential Data] Seeding permissions...
[Essential Data] Permission ADMIN created/updated
[Essential Data] Permission TECHNICIAN created/updated
[Essential Data] Permission USER created/updated
[Essential Data] Creating SuperAdmin employee...
[Essential Data] Creating Technician employee...
[Essential Data] Creating system user for device initialization...
[Essential Data] Creating system employee for device registration...
[Essential Data] SuperAdmin employee: superadmin-0001 (superadmin@catcarwash.com)
[Essential Data] Technician employee: technician-0001 (technician@catcarwash.com)
[Essential Data] Device Initial System User: device-intial (device-initial@system.catcarwash.com)
[Essential Data] Device Initial System Employee: device-intial (device-initial-emp@system.catcarwash.com)
[Essential Data] ✓ Essential data seeding completed

------------------------------------------------------------
Skipping demo data in production mode
------------------------------------------------------------

============================================================
Database seeding completed successfully!
============================================================
```

### Development Mode Output
```
============================================================
Starting database seeding in DEVELOPMENT mode
============================================================

[Essential Data] Seeding permissions...
[Essential Data] Permission ADMIN created/updated
[Essential Data] Permission TECHNICIAN created/updated
[Essential Data] Permission USER created/updated
[Essential Data] Creating SuperAdmin employee...
[Essential Data] Creating Technician employee...
[Essential Data] Creating system user for device initialization...
[Essential Data] Creating system employee for device registration...
[Essential Data] SuperAdmin employee: superadmin-0001 (superadmin@catcarwash.com)
[Essential Data] Technician employee: technician-0001 (technician@catcarwash.com)
[Essential Data] Device Initial System User: device-intial (device-initial@system.catcarwash.com)
[Essential Data] Device Initial System Employee: device-intial (device-initial-emp@system.catcarwash.com)
[Essential Data] ✓ Essential data seeding completed

------------------------------------------------------------
Seeding demo data (development mode only)...
------------------------------------------------------------
[Demo Data] Creating demo users...
[Demo Data] User 1 created: user-0001 (user@catcarwash.com)
[Demo Data] User 2 created: user-0002 (user2@catcarwash.com)
[Demo Data] Creating demo devices...
[Demo Data] Generating device events (payment logs)...
[Demo Data] Generating device states (historical data)...
[Demo Data] Generating device last states (current state)...
[Demo Data] Devices for user 1: 3
[Demo Data] Devices for user 2: 4
[Demo Data] Device events (payments): 35
[Demo Data] Device states (historical): 70
[Demo Data] Device last states: 7
[Demo Data] ✓ Demo data seeding completed

============================================================
Database seeding completed successfully!
============================================================
```

## Security Best Practices

⚠️ **CRITICAL SECURITY NOTES:**

1. **Change Default Passwords**: All accounts use `password!` as the default password. Change these immediately after deployment!

2. **Production Passwords**: Consider using environment variables for production passwords:
   ```typescript
   const hashedPassword = await bcrypt.hash(
     process.env.ADMIN_PASSWORD || 'password!',
     12
   );
   ```

3. **Upsert Safety**: All seeds use `upsert` operations, making them safe to run multiple times without creating duplicates.

4. **Never Commit Credentials**: Keep actual production credentials in environment variables, never in code.

## Docker Usage

In Docker or docker-compose, set the environment variable:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"
```

## CI/CD Integration

```bash
# In your deployment pipeline
if [ "$ENVIRONMENT" = "production" ]; then
  NODE_ENV=production npx prisma db seed
else
  npx prisma db seed
fi
```

## Troubleshooting

### Problem: Demo data appearing in production
**Solution**: Ensure `NODE_ENV=production` is set before running the seed command.

### Problem: "Permission not found" error
**Solution**: The essential data seeding creates permissions first. If this fails, check database connectivity.

### Problem: Seed runs but no data appears
**Solution**: Check database connection string and ensure migrations have been run first.

## Complete Setup Sequence

```bash
# 1. Run migrations
npx prisma migrate deploy

# 2. Seed database (production)
NODE_ENV=production npx prisma db seed

# 3. Start application
npm run start:prod
```

## Related Files

- `prisma/seed.ts` - Main seed script
- `prisma/schema.prisma` - Database schema
- `prisma/README.md` - Complete Prisma documentation

