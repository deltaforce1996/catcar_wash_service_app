# Database Seeding

This directory contains the database seeding configuration for the CatCar Wash Service application.

## Seed File

The `seed.ts` file populates the database with:

1. **Permissions**: Creates the three permission types defined in the schema:
   - `ADMIN` - Full administrative access
   - `TECHNICIAN` - Technical staff access
   - `USER` - Regular user access

2. **SuperAdmin Employee**: Creates a default super administrator account with the following credentials:
   - **Email**: `superadmin@catcarwash.com`
   - **Password**: `SuperAdmin123!`
   - **Name**: Super Admin
   - **Permission**: ADMIN
   - **Status**: ACTIVE

## Running the Seed

You can run the seed in two ways:

### Method 1: Using npm script
```bash
npm run db:seed
```

### Method 2: Using Prisma CLI
```bash
npx prisma db seed
```

## Important Notes

- The seed uses `upsert` operations, so it's safe to run multiple times
- The SuperAdmin password is hashed using bcrypt with a salt rounds of 12
- Make sure to change the default SuperAdmin password after the first login
- The seed will create permissions if they don't exist, or update them if they do

## Security

⚠️ **Important**: The default SuperAdmin password (`SuperAdmin123!`) should be changed immediately after the first deployment to production.

## Database Requirements

Make sure your database is migrated and the Prisma client is generated before running the seed:

```bash
npx prisma migrate dev
npx prisma generate
```
