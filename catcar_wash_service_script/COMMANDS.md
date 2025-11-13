# Quick Command Reference

## 🚀 Docker Commands

### Start Services
```bash
# Start all services (from project root)
docker-compose -f docker-compose.develop.yml up -d

# Start only db_scripts service
docker-compose -f docker-compose.develop.yml up -d db_scripts

# Rebuild and start
docker-compose -f docker-compose.develop.yml up -d --build db_scripts
```

### Stop Services
```bash
# Stop all services
docker-compose -f docker-compose.develop.yml down

# Stop only db_scripts
docker-compose -f docker-compose.develop.yml stop db_scripts
```

### View Logs
```bash
# View all logs
docker logs catcar_wash_db_scripts

# Follow logs in real-time
docker logs -f catcar_wash_db_scripts

# View last 50 lines
docker logs --tail 50 catcar_wash_db_scripts

# View partition logs
docker exec catcar_wash_db_scripts cat /var/log/partition_cron.log

# View backup logs
docker exec catcar_wash_db_scripts cat /var/log/backup_cron.log

# Follow both cron logs
docker exec catcar_wash_db_scripts tail -f /var/log/partition_cron.log /var/log/backup_cron.log
```

## 🔧 Manual Operations

### Run Partition Script
```bash
# Create next partition
docker exec catcar_wash_db_scripts python3 /app/partition_60d_cron.py
```

### Run Backup Script
```bash
# Backup database now
docker exec catcar_wash_db_scripts python3 /app/backup_database_python.py

# Backup to custom directory
docker exec catcar_wash_db_scripts python3 /app/backup_database_python.py --output-dir /app/backups
```

### Access Backups
```bash
# List all backups
docker exec catcar_wash_db_scripts ls -lh /app/backups

# Copy backup to host
docker cp catcar_wash_db_scripts:/app/backups/catcar_wash_db_backup_20251113_020000.sql ./

# View backup volume location
docker volume inspect catcar_wash_app_db_backups
```

## 🔍 Database Operations

### Check Partitions
```bash
docker exec -it catcar_wash_postgres psql -U catcar -d catcar_wash_db -c "
SELECT
  child.relname as partition,
  pg_get_expr(child.relpartbound, child.oid) as range,
  pg_size_pretty(pg_total_relation_size(child.oid)) as size
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'tbl_devices_events'
ORDER BY child.relname DESC;
"
```

### Check Table Info
```bash
docker exec -it catcar_wash_postgres psql -U catcar -d catcar_wash_db -c "
SELECT COUNT(*) as total_rows FROM tbl_devices_events;
"

docker exec -it catcar_wash_postgres psql -U catcar -d catcar_wash_db -c "
SELECT
  MIN(created_at) as oldest,
  MAX(created_at) as newest,
  COUNT(*) as total_rows
FROM tbl_devices_events;
"
```

### Restore from Backup
```bash
# Copy backup from container
docker cp catcar_wash_db_scripts:/app/backups/catcar_wash_db_backup_20251113_020000.sql ./

# Restore to database
docker exec -i catcar_wash_postgres psql -U catcar -d catcar_wash_db < catcar_wash_db_backup_20251113_020000.sql
```

## 🛠️ Maintenance

### Check Cron Status
```bash
# List cron jobs
docker exec catcar_wash_db_scripts crontab -l

# Check if cron is running
docker exec catcar_wash_db_scripts ps aux | grep cron
```

### Delete Old Backups
```bash
# Delete backups older than 30 days
docker exec catcar_wash_db_scripts find /app/backups -name "*.sql" -mtime +30 -delete

# Keep only last 10 backups
docker exec catcar_wash_db_scripts bash -c 'cd /app/backups && ls -t *.sql | tail -n +11 | xargs rm -f'
```

### Access Container Shell
```bash
# Enter container
docker exec -it catcar_wash_db_scripts bash

# Run commands inside container
cd /app
python3 partition_60d_cron.py
python3 backup_database_python.py
exit
```

## 🐛 Troubleshooting

### Check Database Connection
```bash
# Test connection
docker exec catcar_wash_db_scripts pg_isready -h postgres -p 5432 -U catcar

# Test query
docker exec catcar_wash_db_scripts psql -h postgres -U catcar -d catcar_wash_db -c "SELECT version();"

# Test network
docker exec catcar_wash_db_scripts ping -c 3 postgres
```

### Check Disk Space
```bash
# Check backup sizes
docker exec catcar_wash_db_scripts du -h /app/backups

# Check volume usage
docker system df -v
```

### Restart Service
```bash
# Restart db_scripts service
docker-compose -f docker-compose.develop.yml restart db_scripts

# Force rebuild
docker-compose -f docker-compose.develop.yml up -d --force-recreate --build db_scripts
```

## 📦 Volume Management

### Backup Volume
```bash
# Create backup of entire volume
docker run --rm -v catcar_wash_app_db_backups:/data -v $(pwd):/backup \
  alpine tar czf /backup/db_backups.tar.gz /data

# Restore backup volume
docker run --rm -v catcar_wash_app_db_backups:/data -v $(pwd):/backup \
  alpine tar xzf /backup/db_backups.tar.gz -C /
```

### Clean Volume
```bash
# Remove all backups from volume
docker run --rm -v catcar_wash_app_db_backups:/data alpine sh -c "rm -rf /data/*"

# Remove volume (when service is stopped)
docker volume rm catcar_wash_app_db_backups
```

## 📊 Monitoring

### Watch Logs in Real-time
```bash
# Terminal 1: Container logs
docker logs -f catcar_wash_db_scripts

# Terminal 2: Partition logs
docker exec catcar_wash_db_scripts tail -f /var/log/partition_cron.log

# Terminal 3: Backup logs
docker exec catcar_wash_db_scripts tail -f /var/log/backup_cron.log
```

### Check Service Health
```bash
# Check if service is running
docker ps | grep db_scripts

# Check resource usage
docker stats catcar_wash_db_scripts

# Check all containers
docker-compose -f docker-compose.develop.yml ps
```

---

**Tip:** ใช้ alias เพื่อความสะดวก:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias dclogs='docker logs -f catcar_wash_db_scripts'
alias dcpartition='docker exec catcar_wash_db_scripts python3 /app/partition_60d_cron.py'
alias dcbackup='docker exec catcar_wash_db_scripts python3 /app/backup_database_python.py'
alias dcshell='docker exec -it catcar_wash_db_scripts bash'
```

