# Database Scripts - Docker Service

> **Automated Database Partition Creation & Backup in Docker**

This service runs as a Docker container with scheduled cron jobs for:
- 🔄 **Partition Creation**: Automatically creates 60-day partitions for `tbl_devices_events`
- 💾 **Database Backup**: Daily SQL backups of the entire database

---

## 📦 What's Included

```
catcar_wash_service_script/
├── Dockerfile                    # Container definition
├── docker-entrypoint.sh          # Startup script with cron setup
├── backup_database_python.py     # Backup script
├── partition_60d_cron.py        # Partition management script
├── requirments.txt              # Python dependencies
└── DOCKER_README.md             # This file
```

---

## 🚀 Quick Start

### 1. Start the services

```bash
# From project root
docker-compose -f docker-compose.develop.yml up -d
```

This will start:
- PostgreSQL
- pgAdmin
- EMQX
- Backend (NestJS)
- **db_scripts** (this service) ✨

### 2. Check if the service is running

```bash
# View logs
docker logs catcar_wash_db_scripts

# Follow logs in real-time
docker logs -f catcar_wash_db_scripts

# Check cron logs
docker exec catcar_wash_db_scripts cat /var/log/partition_cron.log
docker exec catcar_wash_db_scripts cat /var/log/backup_cron.log
```

---

## ⏰ Schedule

### Automatic Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| **Partition Creation** | Every Monday at 3:00 AM | Creates next 60-day partition if needed |
| **Database Backup** | Every day at 2:00 AM | Full SQL backup of all tables |

### Timezone

Container uses **UTC timezone** by default. Adjust the cron schedule in `Dockerfile` if you need a different timezone:

```dockerfile
# Example: Change to Thailand time (UTC+7)
# Add this before cron setup:
RUN ln -sf /usr/share/zoneinfo/Asia/Bangkok /etc/localtime
```

---

## 🔧 Manual Operations

### Run partition script manually

```bash
# Create next partition now
docker exec catcar_wash_db_scripts python3 /app/partition_60d_cron.py
```

### Run backup manually

```bash
# Backup database now
docker exec catcar_wash_db_scripts python3 /app/backup_database_python.py

# Backup to custom directory
docker exec catcar_wash_db_scripts python3 /app/backup_database_python.py --output-dir /app/backups
```

### Access backup files

Backups are stored in a Docker volume named `db_backups`:

```bash
# List all backups
docker exec catcar_wash_db_scripts ls -lh /app/backups

# Copy backup to host
docker cp catcar_wash_db_scripts:/app/backups/catcar_wash_db_backup_20251113_020000.sql ./

# Or access through volume
docker volume inspect catcar_wash_app_db_backups
```

---

## 📊 Monitoring

### View recent logs

```bash
# Partition creation logs (last 50 lines)
docker exec catcar_wash_db_scripts tail -n 50 /var/log/partition_cron.log

# Backup logs (last 50 lines)
docker exec catcar_wash_db_scripts tail -n 50 /var/log/backup_cron.log

# Follow both logs in real-time
docker exec catcar_wash_db_scripts tail -f /var/log/partition_cron.log /var/log/backup_cron.log
```

### Check cron status

```bash
# List active cron jobs
docker exec catcar_wash_db_scripts crontab -l

# Check if cron is running
docker exec catcar_wash_db_scripts ps aux | grep cron
```

### Check partition status

```bash
# Connect to database and check partitions
docker exec -it catcar_wash_postgres psql -U catcar -d catcar_wash_db -c "
SELECT
  child.relname as partition,
  pg_get_expr(child.relpartbound, child.oid) as range,
  pg_size_pretty(pg_total_relation_size(child.oid)) as size
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'tbl_devices_events'
ORDER BY child.relname DESC
LIMIT 5;
"
```

---

## 🔐 Configuration

### Environment Variables

The service uses these environment variables (configured in `docker-compose.develop.yml`):

```yaml
environment:
  - PGHOST=postgres          # PostgreSQL host
  - PGPORT=5432             # PostgreSQL port
  - PGUSER=catcar           # Database user
  - PGPASSWORD=password     # Database password
  - PGDATABASE=catcar_wash_db  # Database name
  - DATABASE_URL=postgresql://catcar:password@postgres:5432/catcar_wash_db
```

### Customize Schedule

Edit the cron schedule in `Dockerfile`:

```dockerfile
# Current schedule
RUN echo "0 3 * * 1 cd /app && python3 partition_60d_cron.py ..." >> /etc/cron.d/db-scripts  # Mon 3:00 AM
RUN echo "0 2 * * * cd /app && python3 backup_database_python.py ..." >> /etc/cron.d/db-scripts  # Daily 2:00 AM

# Examples of different schedules:
# Every 6 hours:        0 */6 * * *
# Every Sunday 1 AM:    0 1 * * 0
# Every 1st of month:   0 2 1 * *
```

Then rebuild:

```bash
docker-compose -f docker-compose.develop.yml up -d --build db_scripts
```

---

## 🛠️ Troubleshooting

### Service won't start

```bash
# Check logs
docker logs catcar_wash_db_scripts

# Check if PostgreSQL is accessible
docker exec catcar_wash_db_scripts pg_isready -h postgres -p 5432 -U catcar

# Rebuild the service
docker-compose -f docker-compose.develop.yml up -d --build db_scripts
```

### Cron jobs not running

```bash
# Check if cron daemon is running
docker exec catcar_wash_db_scripts ps aux | grep cron

# Check cron job definition
docker exec catcar_wash_db_scripts cat /etc/cron.d/db-scripts

# Check cron logs
docker exec catcar_wash_db_scripts cat /var/log/cron.log
```

### Backups are too large

```bash
# Check backup sizes
docker exec catcar_wash_db_scripts du -h /app/backups

# Delete old backups (keep only last 7 days)
docker exec catcar_wash_db_scripts find /app/backups -name "*.sql" -mtime +7 -delete

# Or keep only last 10 backups
docker exec catcar_wash_db_scripts bash -c 'cd /app/backups && ls -t *.sql | tail -n +11 | xargs rm -f'
```

### Database connection issues

```bash
# Test connection
docker exec catcar_wash_db_scripts psql -h postgres -U catcar -d catcar_wash_db -c "SELECT version();"

# Check network connectivity
docker exec catcar_wash_db_scripts ping -c 3 postgres
```

---

## 🗑️ Cleanup

### Remove old backups

Add a cleanup job to the Dockerfile:

```dockerfile
# Add cleanup job - delete backups older than 30 days
RUN echo "0 4 * * * find /app/backups -name '*.sql' -mtime +30 -delete" >> /etc/cron.d/db-scripts
```

### Remove old partitions

```sql
-- Connect to database
docker exec -it catcar_wash_postgres psql -U catcar -d catcar_wash_db

-- Drop partitions older than 1 year
DO $$
DECLARE
  part_name TEXT;
  cutoff_date DATE := CURRENT_DATE - INTERVAL '365 days';
BEGIN
  FOR part_name IN
    SELECT child.relname
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    WHERE parent.relname = 'tbl_devices_events'
      AND to_date(substring(child.relname from '_(\d{8})_to_'), 'YYYYMMDD') < cutoff_date
  LOOP
    RAISE NOTICE 'Dropping old partition: %', part_name;
    EXECUTE format('DROP TABLE IF EXISTS %I', part_name);
  END LOOP;
END$$;
```

---

## 🔄 Restore from Backup

### 1. Find the backup file

```bash
docker exec catcar_wash_db_scripts ls -lh /app/backups
```

### 2. Restore data

```bash
# Copy backup to local machine
docker cp catcar_wash_db_scripts:/app/backups/catcar_wash_db_backup_20251113_020000.sql ./

# Restore to database (make sure schema exists first!)
docker exec -i catcar_wash_postgres psql -U catcar -d catcar_wash_db < catcar_wash_db_backup_20251113_020000.sql

# Or restore directly from container
docker exec catcar_wash_db_scripts psql -h postgres -U catcar -d catcar_wash_db -f /app/backups/catcar_wash_db_backup_20251113_020000.sql
```

### 3. Verify restore

```sql
-- Check row counts
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_tup_ins - n_tup_del as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
```

---

## 📋 Production Checklist

Before deploying to production:

- [ ] ✅ Test backup and restore process
- [ ] ✅ Verify partition creation works correctly
- [ ] ✅ Set appropriate timezone for cron jobs
- [ ] ✅ Configure backup retention policy (auto-delete old backups)
- [ ] ✅ Set up monitoring alerts for failed jobs
- [ ] ✅ Ensure adequate disk space for backups
- [ ] ✅ Test database connection from container
- [ ] ✅ Document restore procedures for your team
- [ ] ✅ Set up log rotation (to prevent disk full)
- [ ] ✅ Configure secure database credentials (not defaults!)

---

## 🐳 Docker Commands Reference

```bash
# Start services
docker-compose -f docker-compose.develop.yml up -d

# Stop services
docker-compose -f docker-compose.develop.yml down

# View logs
docker-compose -f docker-compose.develop.yml logs db_scripts

# Rebuild service
docker-compose -f docker-compose.develop.yml up -d --build db_scripts

# Restart service
docker-compose -f docker-compose.develop.yml restart db_scripts

# Execute command in container
docker exec catcar_wash_db_scripts <command>

# Access container shell
docker exec -it catcar_wash_db_scripts bash

# View backup volume location
docker volume inspect catcar_wash_app_db_backups
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker logs catcar_wash_db_scripts`
2. Verify PostgreSQL is running: `docker ps | grep postgres`
3. Test database connection manually
4. Check GitHub issues or contact DevOps team

---

## 📚 Related Documentation

- [Main Database Partitioning Guide](./README.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Cron Syntax Guide](https://crontab.guru/)

---

**Created by:** Claude Code  
**Last Updated:** 2025-11-13  
**Version:** 1.0

