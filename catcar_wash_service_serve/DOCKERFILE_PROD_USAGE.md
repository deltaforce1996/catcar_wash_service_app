# Production Dockerfile Usage Guide

## Overview

`Dockerfile.prod` is a production-ready Docker image that includes:
- ✅ Prisma migrations deployment (`migrate deploy`)
- ✅ Production database seeding (essential data only)
- ✅ Optimized multi-stage build
- ✅ Security hardening (non-root user)
- ✅ Minimal image size (Alpine Linux)

## Building the Image

### Basic Build

```bash
# Build from the project root
docker build -f catcar_wash_service_serve/Dockerfile.prod -t catcar-backend:production .

# Or build from the serve directory
cd catcar_wash_service_serve
docker build -f Dockerfile.prod -t catcar-backend:production .
```

### Build with Tags

```bash
# Build with version tag
docker build -f Dockerfile.prod -t catcar-backend:latest -t catcar-backend:v1.0.0 .

# Build for specific platform
docker build --platform linux/amd64 -f Dockerfile.prod -t catcar-backend:production .
```

## Running the Container

### Basic Run

```bash
docker run -d \
  --name catcar-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/catcar_wash_db" \
  -e JWT_SECRET="your-production-jwt-secret" \
  catcar-backend:production
```

### With Environment File

```bash
# Create .env.production file
cat > .env.production << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/catcar_wash_db
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
EOF

# Run with environment file
docker run -d \
  --name catcar-backend \
  -p 3000:3000 \
  --env-file .env.production \
  catcar-backend:production
```

## Docker Compose Usage

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: catcar-db-prod
    environment:
      POSTGRES_USER: catcaruser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: catcar_wash_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U catcaruser"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./catcar_wash_service_serve
      dockerfile: Dockerfile.prod
    container_name: catcar-backend-prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://catcaruser:${DB_PASSWORD}@postgres:5432/catcar_wash_db
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### Start Services

```bash
# Create .env file with secrets
echo "DB_PASSWORD=your_secure_password" > .env
echo "JWT_SECRET=your_secure_jwt_secret" >> .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Startup Sequence

When the container starts, it executes the following sequence:

```
1. 🔄 Running Prisma migrations (migrate deploy)
   - Applies pending migrations to database
   - Safe for production (non-destructive)

2. 🌱 Seeding database (production mode)
   - NODE_ENV=production is set
   - Only essential data is seeded:
     * Permissions (ADMIN, TECHNICIAN, USER)
     * Super Admin account
     * Technician account
     * System accounts for device management
   - NO demo users, devices, or test data

3. 🚀 Starting NestJS application
   - Application starts on port 3000
   - Production optimizations enabled
```

## What Gets Seeded in Production

The production seed creates only essential data:

| Type | Account | Email |
|------|---------|-------|
| Super Admin | Administrator | superadmin@catcarwash.com |
| Technician | Technical Staff | technician@catcarwash.com |
| System User | Device Owner | device-initial@system.catcarwash.com |
| System Employee | Device Registrar | device-initial-emp@system.catcarwash.com |

**Default Password**: `password!`

⚠️ **CRITICAL**: Change all default passwords immediately after deployment!

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret | `your-secure-random-secret` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` (set in Dockerfile) |
| `PORT` | Application port | `3000` |

## Image Details

### Multi-Stage Build

**Stage 1: Build**
- Base: `node:20-alpine`
- Installs all dependencies
- Builds TypeScript application
- Generates Prisma client

**Stage 2: Production**
- Base: `node:20-alpine`
- Only production dependencies
- Includes ts-node for seed script
- Minimal attack surface
- Non-root user (nestjs:nodejs)

### Image Size

- Optimized Alpine-based image
- Approximate size: 300-400 MB
- No development dependencies
- No build tools in final image

## Security Features

1. **Non-Root User**: Application runs as user `nestjs` (UID 1001)
2. **Minimal Base**: Alpine Linux reduces attack surface
3. **Production Only**: No development tools included
4. **Environment Secrets**: Sensitive data via environment variables

## Troubleshooting

### Migrations Fail

```bash
# Check database connectivity
docker exec catcar-backend-prod pnpm prisma db pull

# View migration status
docker exec catcar-backend-prod pnpm prisma migrate status

# View container logs
docker logs catcar-backend-prod
```

### Seed Fails

```bash
# Verify NODE_ENV is set to production
docker exec catcar-backend-prod env | grep NODE_ENV

# Manually run seed
docker exec catcar-backend-prod sh -c "NODE_ENV=production pnpm prisma db seed"

# Check seed logs
docker logs catcar-backend-prod | grep -A 20 "Seeding database"
```

### Application Won't Start

```bash
# Check application logs
docker logs -f catcar-backend-prod

# Verify database connection
docker exec catcar-backend-prod node -e "console.log(process.env.DATABASE_URL)"

# Check if port is in use
docker ps | grep 3000
```

### Demo Data Appearing in Production

```bash
# Verify NODE_ENV in container
docker exec catcar-backend-prod env | grep NODE_ENV

# Should output: NODE_ENV=production
# If not, rebuild the image or check environment variables
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy Production

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build \
            -f catcar_wash_service_serve/Dockerfile.prod \
            -t catcar-backend:${{ github.sha }} \
            .
      
      - name: Push to registry
        run: |
          docker tag catcar-backend:${{ github.sha }} registry.example.com/catcar-backend:latest
          docker push registry.example.com/catcar-backend:latest
```

### GitLab CI Example

```yaml
build-production:
  stage: build
  script:
    - docker build -f catcar_wash_service_serve/Dockerfile.prod -t $CI_REGISTRY_IMAGE:latest .
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
```

## Monitoring

### Health Check

Add to docker-compose.yml:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logs

```bash
# Follow logs
docker logs -f catcar-backend-prod

# Last 100 lines
docker logs --tail 100 catcar-backend-prod

# With timestamps
docker logs -t catcar-backend-prod
```

## Best Practices

1. ✅ Always use specific version tags, not `latest`
2. ✅ Store secrets in environment variables, never in code
3. ✅ Use Docker secrets or vault for sensitive data
4. ✅ Change default passwords immediately after deployment
5. ✅ Monitor container logs for errors
6. ✅ Use health checks in production
7. ✅ Keep database backups before running migrations
8. ✅ Test migrations in staging before production

## Related Documentation

- `prisma/SEED_MODES.md` - Detailed seed modes documentation
- `prisma/README.md` - Complete Prisma setup guide
- `Dockerfile` - Development Dockerfile reference

