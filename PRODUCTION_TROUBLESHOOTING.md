# Production Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. ❌ Invalid Port Number Error

**Error Message:**
```
PrismaClientInitializationError:
The provided database string is invalid. Error parsing connection string: invalid port number in database URL.
```

**Cause:**
Your `POSTGRES_PASSWORD` contains special characters that are not URL-encoded in the connection string.

**Solution:**

#### Option A: Use Simple Password (Recommended for Quick Fix)
Use a password without special characters:
```bash
# In your .env.prod file
POSTGRES_PASSWORD=MyStrongPassword123
# Only use: A-Z, a-z, 0-9
```

#### Option B: URL-Encode Special Characters
If you must use special characters, encode them:

```bash
# Original password: MyP@ss:word#123
# URL-encoded:       MyP%40ss%3Aword%23123

# In your .env.prod
POSTGRES_PASSWORD=MyP%40ss%3Aword%23123
```

**Special Character Encoding Table:**
```
Character → Encoded
@ → %40
: → %3A
/ → %2F
? → %3F
# → %23
[ → %5B
] → %5D
& → %26
= → %3D
+ → %2B
$ → %24
, → %2C
% → %25
space → %20
! → %21
* → %2A
' → %27
( → %28
) → %29
```

#### Option C: Use PostgreSQL Connection Components Separately

Instead of using a full DATABASE_URL, you can set components separately (requires code changes):

```yaml
# In docker-compose.prod.yml
environment:
  - POSTGRES_HOST=postgres
  - POSTGRES_PORT=5432
  - POSTGRES_DB=${POSTGRES_DB}
  - POSTGRES_USER=${POSTGRES_USER}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

---

### 2. ❌ Database Connection Timeout

**Error Message:**
```
Error: Connection timeout
P1001: Can't reach database server
```

**Solutions:**

#### A. Check Database Service is Running
```bash
# Check if postgres container is running
docker ps | grep postgres

# Check postgres logs
docker logs catcar_wash_postgres_prod
```

#### B. Verify Database Health
```bash
# Check healthcheck status
docker inspect catcar_wash_postgres_prod | grep -A 10 Health
```

#### C. Wait for Database
The Dockerfile.prod now includes a 3-second wait. If needed, increase it:
```bash
# In Dockerfile.prod startup script
sleep 5  # Increase from 3 to 5 seconds
```

---

### 3. ❌ Migration Failed

**Error Message:**
```
ERROR: Migration failed!
```

**Solutions:**

#### A. Check Migration Files
```bash
# List migrations
ls -la catcar_wash_service_serve/prisma/migrations/
```

#### B. Reset Database (Development Only!)
```bash
# WARNING: This deletes all data
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

#### C. Manual Migration
```bash
# Run migration manually
docker exec -it catcar_wash_backend_prod pnpm prisma migrate deploy
```

---

### 4. ❌ Seed Failed

**Error Message:**
```
WARNING: Seeding failed but continuing...
```

**Note:** The application will continue to run even if seeding fails.

**Solutions:**

#### A. Manual Seeding
```bash
# Run seed manually in production mode
docker exec -it catcar_wash_backend_prod sh -c "NODE_ENV=production pnpm prisma db seed"
```

#### B. Check Seed Logs
```bash
# View seed output
docker logs catcar_wash_backend_prod | grep -A 50 "Seeding database"
```

#### C. Verify Production Mode
```bash
# Ensure NODE_ENV is set to production
docker exec catcar_wash_backend_prod env | grep NODE_ENV
# Should output: NODE_ENV=production
```

---

### 5. ❌ Permission Denied

**Error Message:**
```
EACCES: permission denied
```

**Solution:**
```bash
# Fix ownership of backup directories
sudo chown -R 1001:1001 ./backups/prod/

# Or recreate them
rm -rf ./backups/prod/
mkdir -p ./backups/prod/{postgres_data,emqx_data,emqx_log}
```

---

### 6. ❌ Port Already in Use

**Error Message:**
```
Error: bind: address already in use
```

**Solutions:**

#### A. Change Port
```bash
# In .env.prod
BACKEND_PORT=3001  # Change from 3000
```

#### B. Stop Conflicting Service
```bash
# Find what's using port 3000
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Stop the service or change port
```

---

## Step-by-Step Deployment Guide

### 1. Prepare Environment File

```bash
# Copy example file
cp env.prod.example .env.prod

# Edit with your values
nano .env.prod  # or vim, code, etc.
```

**Required values:**
- `POSTGRES_PASSWORD` - Use simple password or URL-encode
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `EMQX_DASHBOARD_USER`
- `EMQX_DASHBOARD_PASSWORD`

### 2. Create Backup Directories

```bash
# Create directories for persistent data
mkdir -p ./backups/prod/{postgres_data,emqx_data,emqx_log}

# Set proper permissions
chmod 755 ./backups/prod
```

### 3. Build and Start Services

```bash
# Build fresh images
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Services

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Should see:
# - catcar_wash_postgres_prod (healthy)
# - catcar_wash_emqx_prod (healthy)
# - catcar_wash_backend_prod (running)
```

### 5. Test Application

```bash
# Test API health endpoint
curl http://localhost:3000/api/health

# Check backend logs
docker logs -f catcar_wash_backend_prod
```

### 6. Verify Seeding

```bash
# Check seed output in logs
docker logs catcar_wash_backend_prod | grep "Essential Data"

# Should see:
# [Essential Data] Seeding permissions...
# [Essential Data] Permission ADMIN created/updated
# [Essential Data] SuperAdmin employee: superadmin-0001
# NO [Demo Data] messages (production mode)
```

---

## Production Checklist

Before deploying to production:

- [ ] `.env.prod` file created with all required variables
- [ ] `POSTGRES_PASSWORD` uses simple characters or is URL-encoded
- [ ] `JWT_SECRET` is a strong, random 32+ character string
- [ ] Backup directories created with proper permissions
- [ ] pgAdmin service commented out (security)
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates ready
- [ ] Monitoring tools configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

## Monitoring Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail 100 backend
```

### Check Status
```bash
# Service status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats catcar_wash_backend_prod
```

### Database Operations
```bash
# Access database
docker exec -it catcar_wash_postgres_prod psql -U catcar_wash_user_prod -d catcar_wash_db_prod

# Backup database
docker exec catcar_wash_postgres_prod pg_dump -U catcar_wash_user_prod catcar_wash_db_prod > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i catcar_wash_postgres_prod psql -U catcar_wash_user_prod catcar_wash_db_prod < backup_20250101.sql
```

---

## Emergency Rollback

If deployment fails:

```bash
# 1. Stop services
docker-compose -f docker-compose.prod.yml down

# 2. Restore previous database backup
docker-compose -f docker-compose.prod.yml up -d postgres
docker exec -i catcar_wash_postgres_prod psql -U catcar_wash_user_prod catcar_wash_db_prod < backup_previous.sql

# 3. Use previous image version
docker pull your-registry/catcar-backend:previous-version
docker tag your-registry/catcar-backend:previous-version catcar_wash_backend:1.0.0

# 4. Restart services
docker-compose -f docker-compose.prod.yml up -d
```

---

## Support Resources

- **Prisma Connection String Docs**: https://www.prisma.io/docs/reference/database-reference/connection-urls
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Quick Reference: Common Commands

```bash
# Start production
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# Restart backend only
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate backend

# View environment variables
docker exec catcar_wash_backend_prod env

# Access backend shell
docker exec -it catcar_wash_backend_prod sh

# Run manual seed
docker exec -it catcar_wash_backend_prod sh -c "NODE_ENV=production pnpm prisma db seed"

# Check database connection
docker exec -it catcar_wash_backend_prod pnpm prisma db pull
```

