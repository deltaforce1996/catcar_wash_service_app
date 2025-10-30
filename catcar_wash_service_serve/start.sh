#!/bin/sh
# =============================================================================
# Production Startup Script for CatCar Wash Service Backend
# =============================================================================
# This script handles:
# 1. Database connection waiting
# 2. Prisma migrations (migrate deploy)
# 3. Production database seeding
# 4. Starting the NestJS application

set -e  # Exit immediately if a command exits with a non-zero status

echo "============================================================"
echo "Starting CatCar Wash Service - Production Mode"
echo "============================================================"
echo ""

echo "Waiting for database connection..."
sleep 3
echo ""

echo "Running Prisma migrations..."
pnpm prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "ERROR: Migration failed! Check DATABASE_URL and database connection."
  exit 1
fi
echo ""

echo "Seeding database (production mode - essential data only)..."
NODE_ENV=production pnpm prisma db seed
if [ $? -ne 0 ]; then
  echo "WARNING: Seeding failed but continuing..."
fi
echo ""

echo "Starting NestJS application..."
exec node dist/src/main.js
