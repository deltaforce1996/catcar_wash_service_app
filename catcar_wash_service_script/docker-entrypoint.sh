#!/bin/bash
set -e

echo "============================================================"
echo "Database Scripts Container Starting..."
echo "============================================================"
echo ""
echo "Environment:"
echo "  PGHOST: ${PGHOST}"
echo "  PGPORT: ${PGPORT}"
echo "  PGUSER: ${PGUSER}"
echo "  PGDATABASE: ${PGDATABASE}"
echo ""

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"; do
  echo "  PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "[OK] PostgreSQL is ready!"
echo ""

# Run partition creation on startup (initial setup)
echo "Running initial partition creation..."
python3 /app/partition_60d_cron.py
echo ""

echo "============================================================"
echo "Scheduled Jobs:"
echo "  - Partition Creation: Every Monday at 3:00 AM"
echo "  - Database Backup:    Every day at 2:00 AM"
echo "============================================================"
echo ""
echo "Logs:"
echo "  - Partition: /var/log/partition_cron.log"
echo "  - Backup:    /var/log/backup_cron.log"
echo ""
echo "Starting cron daemon..."

# Start cron in foreground
cron && tail -f /var/log/partition_cron.log /var/log/backup_cron.log

