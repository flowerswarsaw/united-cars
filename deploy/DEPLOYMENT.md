# United Cars - Deployment Guide

Complete deployment guide for United Cars platform to staging and production environments.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 22.04+ (recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum, SSD recommended
- **Network**: Static IP with domain name
- **SSH**: Key-based authentication configured

### Local Requirements
- Docker & Docker Compose installed
- Git configured with repository access
- SSH access to target servers
- Domain name with DNS management

## 🚀 Quick Start

### 1. Server Setup

Run the bootstrap script on your Ubuntu server:

```bash
# On your server, as root:
curl -sSL https://raw.githubusercontent.com/your-org/united-cars/main/deploy/scripts/bootstrap-host.sh | bash

# Or download and review first:
wget https://raw.githubusercontent.com/your-org/united-cars/main/deploy/scripts/bootstrap-host.sh
sudo bash bootstrap-host.sh
```

This script will:
- Install Docker and Docker Compose
- Create `united-cars` user
- Configure firewall (UFW) and Fail2Ban
- Set up directories and permissions
- Configure log rotation and monitoring

### 2. Repository Setup

```bash
# Switch to united-cars user
sudo su - united-cars

# Clone repository
git clone https://github.com/your-org/united-cars.git
cd united-cars
```

### 3. Environment Configuration

```bash
cd deploy/compose/env

# For staging:
cp .staging.example .staging
# Edit .staging with your actual values

# For production:
cp .prod.example .prod
# Edit .prod with your actual values
```

### 4. Deploy

```bash
# Deploy to staging
./deploy/scripts/deploy.sh staging

# Deploy to production (after testing staging)
./deploy/scripts/deploy.sh prod
```

## 🏗️ Architecture Overview

```
Internet → Caddy (HTTPS/TLS) → Next.js App → PostgreSQL
                             ↗ Redis
                             ↗ File Storage
```

### Components
- **Caddy**: Reverse proxy with automatic HTTPS via Let's Encrypt
- **Next.js**: Web application server
- **PostgreSQL 16**: Primary database with automated backups
- **Redis**: Session storage and caching
- **Docker Compose**: Container orchestration

## 🔧 Environment Configuration

### Required Variables

#### Core Application
```bash
DOMAIN=your-domain.com              # Your domain name
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key     # Generate with: openssl rand -base64 32
```

#### Database
```bash
DATABASE_URL=postgresql://username:password@db:5432/united_cars
POSTGRES_PASSWORD=secure-password   # Use strong password
POSTGRES_DB=united_cars
```

#### Email (Optional)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Monitoring (Optional)
```bash
WEBHOOK_URL=https://hooks.slack.com/...  # For notifications
```

### Environment-Specific Settings

#### Staging (`.staging`)
- Uses staging subdomain: `staging.your-domain.com`
- Less strict security policies for testing
- Smaller resource limits
- More verbose logging

#### Production (`.prod`)
- Primary domain: `your-domain.com`
- Maximum security policies
- Full resource allocation
- Optimized performance settings

## 🚢 Deployment Process

### Manual Deployment

```bash
# 1. Navigate to project
cd ~/united-cars

# 2. Update code
git pull origin main

# 3. Run deployment
./deploy/scripts/deploy.sh [staging|prod]
```

### What the Deployment Script Does

1. **Pre-deployment checks**
   - Validates environment configuration
   - Checks Docker and Docker Compose
   - Verifies network connectivity

2. **Infrastructure setup**
   - Starts database and Redis
   - Waits for services to be ready
   - Creates networks and volumes

3. **Database migrations**
   - Runs pending Prisma migrations
   - Updates database schema safely
   - Verifies migration success

4. **Application deployment**
   - Builds and starts web container
   - Configures Caddy reverse proxy
   - Enables automatic HTTPS

5. **Health verification**
   - Tests application endpoints
   - Verifies database connectivity
   - Confirms SSL certificate

6. **Post-deployment**
   - Updates deployment metadata
   - Sends notifications (if configured)
   - Cleans up old resources

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The project includes three GitHub Actions workflows:

#### 1. CI Pipeline (`.github/workflows/ci.yml`)
**Triggers**: Push to main/develop, Pull Requests
- Linting and type checking
- Unit and integration tests
- Docker image build verification
- Security dependency audit
- Deployment readiness validation

#### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)
**Triggers**: Release published, Manual dispatch
- Automatic deployment to staging environment
- Full deployment verification
- Health checks and smoke tests
- Notification to team channels

#### 3. Production Deployment (`.github/workflows/deploy-prod.yml`)
**Triggers**: Manual dispatch only (with approval)
- Pre-deployment security checklist
- Staging environment verification
- Manual approval gate
- Production backup creation
- Gradual rollout with health monitoring
- Rollback procedures on failure

### Setting up CI/CD

1. **Repository Secrets** (in GitHub Settings > Secrets):
   ```
   STAGING_SSH_PRIVATE_KEY  # SSH key for staging server
   STAGING_HOST             # Staging server IP/hostname
   STAGING_DOMAIN           # staging.your-domain.com
   
   PROD_SSH_PRIVATE_KEY     # SSH key for production server
   PROD_HOST                # Production server IP/hostname
   PROD_DOMAIN              # your-domain.com
   
   SLACK_WEBHOOK_URL        # Optional: Slack notifications
   ```

2. **GitHub Environments**:
   - Create "staging" environment (auto-deploy)
   - Create "production" environment (required reviewers)

3. **Release Process**:
   ```bash
   # CI creates releases automatically from main branch
   # Staging deploys automatically on release
   # Production requires manual workflow dispatch
   ```

## 🗄️ Backup & Recovery

### Automated Backups

Daily backups are configured via cron job (3 AM UTC):

```bash
# View backup status
ls -la /var/united-cars/backups/db/

# Manual backup
./deploy/scripts/backup-db.sh [staging|prod] [retention-days]
```

### Backup Features
- **Compressed storage**: gzip compression for space efficiency
- **Multiple formats**: SQL dump + custom format for fast restore
- **Metadata tracking**: Deployment info, size, verification data
- **Automatic rotation**: Configurable retention period
- **Integrity verification**: Automatic backup validation

### Restore Process

```bash
# List available backups
./deploy/scripts/restore-db.sh staging  # Shows available backups

# Restore specific backup
./deploy/scripts/restore-db.sh staging /var/united-cars/backups/db/backup_20240101_030000.sql.gz
```

### Recovery Features
- **Safety confirmations**: Multiple prompts for production
- **Pre-restore backup**: Automatic safety backup before restore
- **Health verification**: Post-restore application testing
- **Rollback capability**: Can revert if restore fails

## 🔐 Security

### Network Security
- **Firewall**: UFW configured (SSH, HTTP, HTTPS only)
- **Fail2Ban**: Automatic IP blocking for failed attempts
- **SSL/TLS**: Automatic HTTPS via Let's Encrypt
- **Security Headers**: HSTS, CSP, X-Frame-Options

### Application Security
- **Non-root containers**: All services run as non-root users
- **Secret management**: Environment-based configuration
- **Database isolation**: Private network for backend services
- **Rate limiting**: API and authentication endpoints protected

### Regular Security Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Check container security
docker scout cves

# Review access logs
tail -f /var/united-cars/logs/access.log

# Monitor failed authentications
sudo fail2ban-client status sshd
```

## 📊 Monitoring & Logging

### Application Logs
```bash
# Application logs
docker compose -f deploy/compose/docker-compose.prod.yml logs -f web

# Database logs
docker compose -f deploy/compose/docker-compose.prod.yml logs -f db

# All service logs
docker compose -f deploy/compose/docker-compose.prod.yml logs -f
```

### System Monitoring
```bash
# System status overview
united-cars-status

# Resource usage
htop

# Disk usage
ncdu /var/united-cars
```

### Health Checks

The application provides several health check endpoints:

- **`/api/health`**: Basic application health
- **`/api/version`**: Build and deployment information
- **`/api/metrics`**: Application metrics (if enabled)

### Log Management
- **Automatic rotation**: 30 days retention
- **Compression**: gzip for historical logs  
- **Centralized location**: `/var/united-cars/logs/`

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check container status
docker compose ps

# View application logs
docker compose logs web

# Check environment configuration
grep -v "^#" deploy/compose/env/.prod | grep -v "^$"
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
docker compose exec db pg_isready -U postgres

# Check database logs
docker compose logs db

# Verify database URL
echo $DATABASE_URL
```

#### 3. SSL Certificate Problems
```bash
# Check Caddy logs
docker compose logs caddy

# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# Verify domain DNS
dig +short your-domain.com
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Monitor database performance
docker compose exec db pg_stat_activity

# Review slow queries
tail -f /var/united-cars/logs/slow-query.log
```

### Emergency Procedures

#### Application Rollback
```bash
# Quick rollback to previous version
cd ~/united-cars
./deploy/scripts/deploy.sh prod rollback
```

#### Database Recovery
```bash
# Find recent backup
ls -la /var/united-cars/backups/db/

# Restore from backup
./deploy/scripts/restore-db.sh prod /var/united-cars/backups/db/latest.sql.gz
```

#### Complete System Reset
```bash
# DANGER: This will destroy all data
docker compose -f deploy/compose/docker-compose.prod.yml down -v
docker system prune -a -f
# Then redeploy from scratch
```

## 📞 Support & Maintenance

### Regular Maintenance Schedule

#### Daily
- Automated backups (via cron)
- Log rotation
- Security monitoring

#### Weekly  
- System package updates
- Docker image updates
- Performance metrics review

#### Monthly
- SSL certificate renewal check
- Backup verification test
- Security audit
- Capacity planning review

### Getting Help

1. **Documentation**: Check this deployment guide first
2. **Logs**: Review application and system logs
3. **Monitoring**: Check health endpoints and metrics
4. **GitHub Issues**: Create issue with logs and error details
5. **Team Channel**: Contact platform team for urgent issues

### Useful Commands Reference

```bash
# Service management
systemctl status docker
systemctl restart docker

# Container management  
docker compose ps
docker compose restart web
docker compose exec web /bin/sh

# Database management
docker compose exec db psql -U postgres -d united_cars
./deploy/scripts/backup-db.sh prod
./deploy/scripts/restore-db.sh prod /path/to/backup.sql.gz

# System monitoring
united-cars-status
htop
df -h
journalctl -f

# Security
sudo ufw status
sudo fail2ban-client status
```

---

## 🎯 Next Steps

After successful deployment:

1. **Verify functionality**: Test all major application features
2. **Set up monitoring**: Configure alerts and dashboards  
3. **Plan maintenance**: Schedule regular updates and backups
4. **Document customizations**: Record any environment-specific changes
5. **Train team**: Ensure team members understand deployment procedures

For questions or issues, please refer to the [troubleshooting section](#-troubleshooting) or create a GitHub issue with detailed information about your environment and the problem encountered.