# United Cars - Deployment Infrastructure

Complete Docker-based deployment solution for United Cars platform with staging and production environments.

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete setup and operation guide
- **[RUNBOOK_ROLLOUT.md](RUNBOOK_ROLLOUT.md)** - Production deployment procedures

## 🏗️ Structure

```
deploy/
├── compose/                    # Docker Compose configurations
│   ├── docker-compose.staging.yml  # Staging environment
│   ├── docker-compose.prod.yml     # Production environment
│   ├── caddy/
│   │   └── Caddyfile              # Reverse proxy configuration
│   └── env/
│       ├── .staging.example       # Staging environment template
│       └── .prod.example         # Production environment template
├── scripts/
│   ├── bootstrap-host.sh          # Server setup script
│   ├── deploy.sh                  # Main deployment script
│   ├── backup-db.sh               # Database backup utility
│   └── restore-db.sh              # Database restore utility
├── DEPLOYMENT.md                  # Complete deployment guide
├── RUNBOOK_ROLLOUT.md            # Production procedures
└── README.md                     # This file
```

## 🚀 Quick Start

### 1. Server Setup
```bash
# On your Ubuntu 22+ server (as root):
curl -sSL https://raw.githubusercontent.com/your-org/united-cars/main/deploy/scripts/bootstrap-host.sh | bash
```

### 2. Environment Setup
```bash
# Switch to united-cars user and clone repository
sudo su - united-cars
git clone https://github.com/your-org/united-cars.git
cd united-cars/deploy/compose/env

# Configure environment
cp .staging.example .staging  # Edit with your values
# OR for production:
cp .prod.example .prod       # Edit with your values
```

### 3. Deploy
```bash
cd ~/united-cars
./deploy/scripts/deploy.sh staging    # Deploy to staging
./deploy/scripts/deploy.sh prod       # Deploy to production
```

## 🌍 Environments

### Staging
- **Purpose**: Testing and validation
- **Domain**: `staging.your-domain.com`
- **Database**: Isolated staging database
- **SSL**: Automatic HTTPS via Let's Encrypt
- **Backups**: 7-day retention

### Production
- **Purpose**: Live application serving users
- **Domain**: `your-domain.com`
- **Database**: Production PostgreSQL with daily backups
- **SSL**: Automatic HTTPS with HSTS
- **Monitoring**: Full observability stack
- **Backups**: 30-day retention with verification

## 🔧 Key Features

### Security
- ✅ **Non-root containers** - All services run as unprivileged users
- ✅ **Network isolation** - Private networks for backend services
- ✅ **Automatic HTTPS** - Let's Encrypt SSL with auto-renewal
- ✅ **Security headers** - HSTS, CSP, X-Frame-Options
- ✅ **Rate limiting** - Protection against abuse
- ✅ **Firewall** - UFW configured with minimal ports
- ✅ **Intrusion detection** - Fail2Ban monitoring

### Reliability
- ✅ **Health checks** - Automatic container recovery
- ✅ **Database backups** - Automated daily backups with verification
- ✅ **Rollback capability** - Quick revert to previous versions
- ✅ **Migration safety** - Database schema changes with rollback
- ✅ **Resource limits** - Memory and CPU constraints
- ✅ **Log management** - Automatic rotation and cleanup

### Operations
- ✅ **One-command deployment** - `./deploy/scripts/deploy.sh`
- ✅ **Environment parity** - Staging mirrors production
- ✅ **CI/CD integration** - GitHub Actions workflows
- ✅ **Monitoring** - Health endpoints and metrics
- ✅ **Documentation** - Comprehensive guides and runbooks

## 📦 Services

| Service | Purpose | Port | Health Check |
|---------|---------|------|--------------|
| **web** | Next.js application | 3000 | `/api/health` |
| **db** | PostgreSQL 16 | 5432 | `pg_isready` |
| **redis** | Session & cache | 6379 | `redis-cli ping` |
| **caddy** | Reverse proxy | 80/443 | HTTP response |
| **migrate** | Database migrations | - | Exit code |

## 🔄 CI/CD Pipeline

### Automated Workflows

1. **CI Pipeline** (`ci.yml`)
   - Runs on every push/PR
   - Linting, testing, building
   - Security audit
   - Docker image verification

2. **Staging Deploy** (`deploy-staging.yml`)
   - Triggers on release creation
   - Automatic deployment to staging
   - Health verification
   - Team notifications

3. **Production Deploy** (`deploy-prod.yml`)
   - Manual trigger only
   - Requires approval
   - Pre-deployment validation
   - Rollback procedures
   - Incident response

### Release Process

```bash
# 1. Development work merged to main
# 2. CI pipeline validates changes
# 3. Release created automatically
# 4. Staging deploys automatically
# 5. Production deployment via manual approval
```

## 🗄️ Backup Strategy

### Automated Backups
- **Frequency**: Daily at 3 AM UTC
- **Retention**: 14 days (staging), 30 days (production)
- **Compression**: gzip for storage efficiency
- **Verification**: Automatic integrity checks
- **Formats**: SQL dump + custom format for fast restore

### Manual Backup
```bash
# Create backup
./deploy/scripts/backup-db.sh prod 30

# Restore from backup
./deploy/scripts/restore-db.sh prod /path/to/backup.sql.gz
```

## 📊 Monitoring & Logging

### Health Checks
- **Application**: `https://your-domain.com/api/health`
- **Version info**: `https://your-domain.com/api/version`
- **Database**: Container health checks
- **SSL**: Automatic certificate monitoring

### Log Management
- **Location**: `/var/united-cars/logs/`
- **Rotation**: Daily with 30-day retention
- **Compression**: Automatic gzip compression
- **Access**: `docker compose logs -f [service]`

### System Monitoring
```bash
# Overall system status
united-cars-status

# Resource usage
htop

# Service status
docker compose ps

# Real-time logs
docker compose logs -f web
```

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker compose logs web

# Verify environment
cat deploy/compose/env/.prod

# Check dependencies
docker compose ps
```

#### Database Connection Failed
```bash
# Test connectivity
docker compose exec db pg_isready -U postgres

# Check environment variables
grep DATABASE_URL deploy/compose/env/.prod
```

#### SSL Certificate Issues
```bash
# Check Caddy logs
docker compose logs caddy

# Verify domain configuration
dig +short your-domain.com

# Force certificate renewal
docker compose exec caddy caddy reload
```

#### Performance Problems
```bash
# Check resource usage
docker stats

# Monitor database
docker compose exec db pg_stat_activity

# Review application metrics
curl https://your-domain.com/api/health
```

### Emergency Procedures

#### Quick Rollback
```bash
./deploy/scripts/deploy.sh prod rollback
```

#### Database Recovery
```bash
./deploy/scripts/restore-db.sh prod /var/united-cars/backups/db/latest.sql.gz
```

#### Complete Reset (DANGER)
```bash
# This destroys all data - use only in extreme cases
docker compose down -v
docker system prune -a -f
# Then redeploy from scratch
```

## 📞 Support

### Getting Help

1. **Check documentation**: Start with [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Review logs**: Application and system logs
3. **Check health endpoints**: Verify service status
4. **GitHub Issues**: Report bugs with logs and environment details
5. **Team communication**: Contact platform team for urgent issues

### Useful Commands

```bash
# Service management
docker compose ps                    # Service status
docker compose restart web          # Restart service
docker compose logs -f web          # Follow logs

# Database operations
docker compose exec db psql -U postgres -d united_cars
./deploy/scripts/backup-db.sh prod
./deploy/scripts/restore-db.sh prod /path/to/backup.sql.gz

# System maintenance
united-cars-status                   # System overview
sudo ufw status                      # Firewall status
sudo fail2ban-client status         # Security status
```

---

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup instructions.