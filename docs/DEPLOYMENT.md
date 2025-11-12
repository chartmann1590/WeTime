# WeTime Deployment Guide

## Overview

WeTime is designed to run in Docker containers using Docker Compose. This guide covers deployment in various environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v3.9+
- 2GB+ RAM available
- 10GB+ disk space

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd cupla-clone
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set required variables:

```env
# Database
DATABASE_URL=postgresql://wetime:wetime_password@db:5432/wetime

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-cookie-secret-here

# Internal Services
INTERNAL_CRON_TOKEN=your-random-token-here

# Timezone
DEFAULT_TIMEZONE=America/New_York
```

**Security Note**: Generate strong random secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate cookie secret
openssl rand -base64 32

# Generate cron token
openssl rand -base64 32
```

### 3. Start Services

```bash
docker compose up -d --build
```

This will:
- Build all Docker images
- Start PostgreSQL database
- Start backend API
- Start frontend app
- Start worker service
- Start nginx reverse proxy

### 4. Initialize Database

The backend automatically runs Prisma migrations on startup. To verify:

```bash
docker compose logs backend | grep -i migration
```

### 5. Seed Demo Data (Optional)

```bash
make seed
# Or:
docker compose exec backend npm run seed
```

### 6. Access Application

- **Frontend**: https://localhost (accept self-signed certificate)
- **API**: https://localhost/api

> **Note**: Verify all services are running with `docker compose ps`. All services should show "Up" status. The output will show all containers (db, backend, frontend, worker, nginx) with their status and port mappings.

## Docker Services

### Database (`db`)

**Image**: `postgres:16-alpine`

**Configuration:**
- Database: `wetime`
- User: `wetime`
- Password: `wetime_password` (change in production!)
- Port: 5432 (internal only)
- Volume: `dbdata` (persistent storage)

**Health Check:**
- Checks every 10 seconds
- Timeout: 5 seconds
- Retries: 10

**Backup:**
```bash
docker compose exec db pg_dump -U wetime wetime > backup.sql
```

**Restore:**
```bash
docker compose exec -T db psql -U wetime wetime < backup.sql
```

---

### Backend (`backend`)

**Image**: Built from `apps/backend/Dockerfile`

**Configuration:**
- Port: 3001 (internal)
- Auto-runs Prisma migrations on startup
- Environment variables from `.env`

**Health Check:**
- Depends on database health
- Auto-restarts on failure

**Logs:**
```bash
docker compose logs -f backend
```

---

### Frontend (`frontend`)

**Image**: Built from `apps/frontend/Dockerfile`

**Configuration:**
- Port: 3000 (internal)
- Built as production Next.js app
- Served via nginx

**Rebuild:**
```bash
docker compose build frontend
docker compose up -d frontend
```

---

### Worker (`worker`)

**Image**: Built from `apps/worker/Dockerfile`

**Configuration:**
- Runs cron jobs
- Calls backend API endpoints
- Requires `BACKEND_URL` and `INTERNAL_CRON_TOKEN`

**Scheduled Jobs:**
- ICS refresh: Every 15 minutes
- Email reminders: Every minute

**Logs:**
```bash
docker compose logs -f worker
```

---

### Nginx (`nginx`)

**Image**: Built from `deploy/nginx/Dockerfile`

**Configuration:**
- Ports: 80 (HTTP), 443 (HTTPS)
- SSL/TLS termination
- Reverse proxy for frontend/backend
- Self-signed certificates (auto-generated)

**SSL Certificates:**
- Auto-generated on first run
- Stored in `certs` volume
- Self-signed (browser warning expected)

**Custom SSL (Production):**
1. Place certificates in `deploy/nginx/certs/`:
   - `wetime.crt`
   - `wetime.key`
2. Update `deploy/nginx/nginx.conf` to use custom certs
3. Rebuild nginx:
```bash
docker compose build nginx
docker compose up -d nginx
```

---

## Production Deployment

### Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://user:password@db:5432/wetime
JWT_SECRET=<strong-random-secret>
COOKIE_SECRET=<strong-random-secret>
INTERNAL_CRON_TOKEN=<strong-random-secret>
DEFAULT_TIMEZONE=America/New_York
```

**Optional:**
```env
NODE_ENV=production
LOG_LEVEL=info
```

### Security Checklist

- [ ] Change default database password
- [ ] Use strong JWT and cookie secrets
- [ ] Replace self-signed SSL with valid certificates
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring
- [ ] Review nginx security headers
- [ ] Disable debug logging in production

### Database Security

**Change Default Password:**

1. Update `.env`:
```env
POSTGRES_PASSWORD=your-strong-password
DATABASE_URL=postgresql://wetime:your-strong-password@db:5432/wetime
```

2. Update `docker-compose.yml`:
```yaml
db:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

3. Restart database:
```bash
docker compose down db
docker compose up -d db
```

### SSL/TLS Configuration

**Option 1: Let's Encrypt (Recommended)**

Use certbot with nginx:

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

**Option 2: Custom Certificates**

1. Obtain certificates from your CA
2. Place in `deploy/nginx/certs/`
3. Update nginx configuration
4. Rebuild nginx service

### Scaling

**Horizontal Scaling:**

1. **Backend**: Run multiple instances behind load balancer
2. **Frontend**: Stateless, can run multiple instances
3. **Worker**: Can run multiple instances (idempotent jobs)
4. **Database**: Use read replicas for scaling reads

**Example docker-compose.override.yml:**
```yaml
services:
  backend:
    deploy:
      replicas: 3
  frontend:
    deploy:
      replicas: 2
```

### Monitoring

**Health Checks:**

All services have health checks. Monitor via:

```bash
docker compose ps
```

**Logs:**

Centralized logging:
```bash
docker compose logs -f
```

**Metrics:**

Consider adding:
- Prometheus for metrics
- Grafana for dashboards
- ELK stack for log aggregation

---

## Cloud Deployment

### AWS

**ECS (Elastic Container Service):**

1. Build and push images to ECR
2. Create ECS task definitions
3. Create ECS services
4. Use Application Load Balancer
5. Use RDS for PostgreSQL

**EC2:**

1. Launch EC2 instance
2. Install Docker and Docker Compose
3. Clone repository
4. Configure security groups
5. Run `docker compose up -d`

### Google Cloud

**Cloud Run:**

1. Build container images
2. Deploy to Cloud Run
3. Use Cloud SQL for PostgreSQL
4. Configure Cloud Load Balancer

**GKE (Kubernetes):**

1. Convert docker-compose to Kubernetes manifests
2. Deploy to GKE cluster
3. Use Cloud SQL Proxy

### Azure

**Azure Container Instances:**

1. Build and push to Azure Container Registry
2. Deploy containers
3. Use Azure Database for PostgreSQL

**AKS (Kubernetes):**

1. Convert to Kubernetes
2. Deploy to AKS
3. Use Azure Database for PostgreSQL

---

## Backup & Recovery

### Database Backups

**Automated Backup Script:**

```bash
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db pg_dump -U wetime wetime | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
```

**Cron Job:**

```cron
0 2 * * * /path/to/backup.sh
```

**Restore:**

```bash
gunzip < backup_20240101_020000.sql.gz | docker compose exec -T db psql -U wetime wetime
```

### Volume Backups

**Backup Volumes:**

```bash
docker run --rm -v cupla-clone_dbdata:/data -v $(pwd):/backup alpine tar czf /backup/dbdata_backup.tar.gz /data
```

**Restore Volumes:**

```bash
docker run --rm -v cupla-clone_dbdata:/data -v $(pwd):/backup alpine tar xzf /backup/dbdata_backup.tar.gz -C /
```

---

## Troubleshooting

### Services Won't Start

**Check Logs:**
```bash
docker compose logs
```

**Check Status:**
```bash
docker compose ps
```

**Restart Service:**
```bash
docker compose restart <service-name>
```

### Database Connection Issues

**Verify Connection:**
```bash
docker compose exec db psql -U wetime -d wetime -c "SELECT 1;"
```

**Check Environment:**
```bash
docker compose exec backend env | grep DATABASE_URL
```

### SSL Certificate Issues

**Regenerate Certificates:**
```bash
docker compose down nginx
docker volume rm cupla-clone_certs
docker compose up -d nginx
```

### Port Conflicts

**Change Ports in docker-compose.yml:**
```yaml
nginx:
  ports:
    - "8080:80"
    - "8443:443"
```

---

## Maintenance

### Update Application

```bash
git pull
docker compose build
docker compose up -d
```

### Database Migrations

Migrations run automatically on backend startup. To run manually:

```bash
docker compose exec backend npx prisma migrate deploy
```

### Clear Cache

**Frontend Cache:**
```bash
docker compose restart frontend
```

**Database Cache:**
```bash
docker compose exec db psql -U wetime -d wetime -c "VACUUM;"
```

---

## Performance Tuning

### Database

**Connection Pooling:**

Update Prisma connection string:
```
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20
```

**Indexes:**

Ensure all indexes are created:
```bash
docker compose exec backend npx prisma db push
```

### Nginx

**Caching:**

Already configured in `deploy/nginx/nginx.conf`:
- Static assets: 1 year
- API responses: No cache

**Gzip:**

Already enabled for text-based content.

---

## Security Hardening

### Firewall Rules

**Allow Only Required Ports:**
- 80 (HTTP) - redirect to HTTPS
- 443 (HTTPS) - application access

**Block Direct Database Access:**
- Don't expose port 5432 externally

### Nginx Security Headers

Already configured in `deploy/nginx/nginx.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

### Database Security

- Use strong passwords
- Limit connection sources
- Enable SSL connections
- Regular security updates

---

## Support

For deployment issues:
1. Check logs: `docker compose logs`
2. Verify environment variables
3. Check service health: `docker compose ps`
4. Review documentation in `docs/`


