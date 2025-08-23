# Operations Runbook - United Cars Platform

## Overview

This runbook provides comprehensive operational procedures for the United Cars platform, including deployment, monitoring, troubleshooting, and maintenance procedures.

## Architecture Overview

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Load Balancer  │───▶│  Next.js App    │───▶│   PostgreSQL    │
│   (HTTPS/SSL)   │    │   (Port 3000)   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │  (Cache/Queue)  │
                       └─────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15 with React 18
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis (optional)
- **Monitoring**: Structured logging with external integrations
- **Testing**: Jest (unit), Playwright (e2e)

## Deployment Procedures

### 1. Pre-deployment Checklist

#### Environment Verification
- [ ] Configuration validation passes
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Dependencies updated and secure
- [ ] Tests passing (unit + e2e)

```bash
# Pre-deployment validation
npm run typecheck
npm run lint
npm run test:ci
npm run test:e2e
npm run build
```

#### Database Preparation
```bash
# Run migrations
DATABASE_URL="$PROD_DB_URL" pnpm db:migrate

# Verify schema
DATABASE_URL="$PROD_DB_URL" pnpm db:status

# Create backup
pg_dump $PROD_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Deployment Process

#### Standard Deployment
```bash
# 1. Build application
npm run build

# 2. Run startup validation
npm run validate:startup

# 3. Deploy with zero-downtime
# (Specific to your deployment platform)
```

#### Emergency Deployment
```bash
# Hot-fix deployment process
git checkout main
git cherry-pick <hotfix-commit>
npm run build
# Deploy immediately
# Monitor closely for 30 minutes
```

#### Rollback Procedures
```bash
# Quick rollback to previous version
# (Platform specific - examples below)

# Docker/Kubernetes
kubectl rollout undo deployment/united-cars

# Vercel/Netlify
# Use platform UI to rollback to previous deployment

# Manual rollback
git revert <problematic-commit>
git push origin main
# Redeploy
```

### 3. Post-deployment Verification

#### Health Checks
```bash
# Application health
curl -f https://yourdomain.com/api/health

# Database connectivity
curl -f https://yourdomain.com/api/health/db

# Authentication flow
curl -f https://yourdomain.com/api/auth/verify
```

#### Performance Verification
- Response times < 2s for main pages
- Database query times < 500ms average
- Error rate < 0.1%
- Memory usage stable
- No memory leaks detected

## Monitoring & Alerting

### 1. Key Metrics

#### Application Metrics
- **Response Time**: P95 < 2000ms
- **Error Rate**: < 0.1% of total requests
- **Uptime**: > 99.9% monthly
- **Active Users**: Peak concurrent users
- **Database Performance**: Query time P95 < 500ms

#### Infrastructure Metrics
- **CPU Usage**: Average < 70%, Peak < 90%
- **Memory Usage**: < 80% of available
- **Disk Usage**: < 85% of available
- **Network I/O**: Monitor for anomalies
- **SSL Certificate**: Days until expiration

### 2. Alert Configurations

#### Critical Alerts (Immediate Response)
```yaml
# Application Down
- condition: health_check_failure > 3 consecutive
  action: page_on_call_engineer
  channels: [slack_critical, pagerduty]

# High Error Rate
- condition: error_rate > 5% over 5 minutes
  action: investigate_immediately
  channels: [slack_critical, email]

# Database Connection Issues
- condition: db_connection_failures > 10 over 2 minutes
  action: check_database_status
  channels: [slack_critical, pagerduty]
```

#### Warning Alerts (Business Hours Response)
```yaml
# Performance Degradation
- condition: response_time_p95 > 3000ms over 10 minutes
  action: investigate_performance
  channels: [slack_alerts]

# High Memory Usage
- condition: memory_usage > 85% over 15 minutes
  action: check_memory_leaks
  channels: [slack_alerts, email]

# SSL Certificate Expiration
- condition: ssl_cert_expires_in < 30 days
  action: renew_certificate
  channels: [slack_alerts, email]
```

### 3. Monitoring Dashboards

#### Production Dashboard
- **System Overview**: Health, uptime, version
- **Performance Metrics**: Response times, throughput
- **Error Tracking**: Error rates, top errors
- **User Activity**: Active users, authentication
- **Infrastructure**: CPU, memory, disk, network

#### Security Dashboard
- **Authentication Events**: Login attempts, failures
- **Access Control**: Authorization denials
- **Security Events**: Rate limiting, suspicious activity
- **File Uploads**: Upload attempts, validations
- **API Usage**: Rate limiting, abuse detection

## Troubleshooting Guide

### 1. Common Issues

#### Application Won't Start
```bash
# Check configuration
npm run validate:config

# Check logs
docker logs united-cars-app
# or
tail -f /var/log/united-cars/app.log

# Common fixes:
# 1. Missing environment variables
# 2. Database connection issues
# 3. Port already in use
# 4. Insufficient permissions
```

#### Database Connection Issues
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check connection pool
# Look for: "too many clients" errors
# Solution: Reduce DB_MAX_CONNECTIONS

# Check for long-running queries
SELECT pid, query, state, query_start 
FROM pg_stat_activity 
WHERE query_start < NOW() - INTERVAL '5 minutes';
```

#### High Memory Usage
```bash
# Check Node.js memory usage
curl http://localhost:3000/api/admin/performance

# Generate heap dump (if monitoring enabled)
kill -USR2 <node-process-id>

# Common causes:
# 1. Memory leaks in code
# 2. Large file uploads not being cleaned
# 3. Circular references
# 4. Database result sets too large
```

#### Performance Issues
```bash
# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Check application performance
curl http://localhost:3000/api/admin/performance

# Common solutions:
# 1. Add database indexes
# 2. Implement query optimization
# 3. Add Redis caching
# 4. Optimize N+1 queries
```

### 2. Error Investigation

#### 500 Internal Server Errors
1. **Check application logs** for stack traces
2. **Review recent deployments** for code changes
3. **Check database connectivity** and migrations
4. **Verify environment configuration**
5. **Look for resource exhaustion** (memory, disk)

#### Authentication Issues
1. **Verify NEXTAUTH_SECRET** configuration
2. **Check session storage** (cookies, database)
3. **Review user permissions** and roles
4. **Test with known good credentials**
5. **Check rate limiting** for locked accounts

#### File Upload Failures
1. **Check file size limits** configuration
2. **Verify MIME type validation** settings
3. **Test disk space** in upload directory
4. **Review file permissions** on storage
5. **Check antivirus scanning** if enabled

## Maintenance Procedures

### 1. Regular Maintenance Tasks

#### Daily Tasks (Automated)
- **Health check verification**
- **Log rotation and cleanup**
- **Database backup creation**
- **SSL certificate status check**
- **Security patch scanning**

#### Weekly Tasks
```bash
# Database maintenance
VACUUM ANALYZE;

# Log analysis
npm run analyze:logs

# Dependency security scan
npm audit

# Performance review
npm run performance:report
```

#### Monthly Tasks
```bash
# Full database backup
pg_dump $DATABASE_URL > monthly_backup_$(date +%Y%m).sql

# Security review
npm run security:audit

# Certificate renewal check
npm run ssl:check

# Access control review
npm run audit:permissions
```

### 2. Database Maintenance

#### Backup Procedures
```bash
# Automated daily backups
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Retention: Keep 7 daily, 4 weekly, 12 monthly
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

#### Migration Procedures
```bash
# Safe migration process
1. Create database backup
2. Test migration on staging
3. Schedule maintenance window
4. Run migration with rollback plan
5. Verify application functionality
6. Monitor for issues post-migration
```

#### Performance Optimization
```sql
-- Identify missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('Vehicle', 'InsuranceClaim', 'ServiceRequest');

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Security Maintenance

#### Certificate Management
```bash
# Check certificate expiration
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"

# Automated renewal (Let's Encrypt)
certbot renew --nginx

# Update application configuration
# Restart services if needed
```

#### Security Updates
```bash
# Weekly security scan
npm audit --audit-level moderate

# Update dependencies
npm update
npm audit fix

# Review security advisories
# Apply patches promptly
```

#### Access Control Audit
```bash
# Review user permissions quarterly
npm run audit:users

# Check for inactive accounts
npm run audit:inactive-users

# Verify role assignments
npm run audit:roles
```

## Disaster Recovery

### 1. Backup Strategy

#### Data Backup
- **Database**: Daily automated backups with 30-day retention
- **File Uploads**: Daily sync to cloud storage
- **Configuration**: Version-controlled in Git
- **SSL Certificates**: Backup in secure storage

#### Recovery Time Objectives (RTO)
- **Critical System Recovery**: < 4 hours
- **Database Recovery**: < 2 hours
- **Full Service Restoration**: < 8 hours
- **Data Loss (RPO)**: < 1 hour

### 2. Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM Vehicle;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM InsuranceClaim;"

# Run application startup validation
npm run validate:startup
```

#### Application Recovery
```bash
# Restore application from backup
git clone https://github.com/org/united-cars.git
cd united-cars
git checkout <last-known-good-commit>

# Restore configuration
cp /backup/config/.env.production .env.local

# Deploy application
npm run build
npm run start
```

### 3. Business Continuity

#### Communication Plan
1. **Incident Commander**: Coordinates response
2. **Technical Team**: Implements recovery
3. **Communications Lead**: Updates stakeholders
4. **Management**: Makes business decisions

#### Service Degradation Modes
- **Read-Only Mode**: Disable writes, allow read access
- **Emergency Mode**: Core functionality only
- **Maintenance Mode**: User-friendly maintenance page

## Performance Optimization

### 1. Application Performance

#### Monitoring Key Metrics
```typescript
// Performance tracking in code
const tracker = new PerformanceTracker('/api/vehicles', requestContext)
const result = await getVehicles(params)
const responseTime = tracker.finish()

// Alert if response time > threshold
if (responseTime > 1000) {
  logger.warn(LogCategory.PERFORMANCE, 'Slow response detected', {
    endpoint: '/api/vehicles',
    responseTime,
    params
  })
}
```

#### Optimization Strategies
- **Database Query Optimization**: Use indexes, avoid N+1 queries
- **Response Caching**: Implement Redis caching for frequent queries
- **Image Optimization**: Compress and resize uploaded images
- **Code Splitting**: Lazy load non-critical components
- **CDN Usage**: Serve static assets from CDN

### 2. Database Performance

#### Query Optimization
```sql
-- Find slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements 
WHERE calls > 100
ORDER BY mean_time DESC 
LIMIT 20;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_vehicles_org_status 
ON vehicles(org_id, status) 
WHERE status IN ('available', 'sold');
```

#### Connection Pool Optimization
```typescript
// Prisma configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
  connection_limit = 10
  pool_timeout = 30
  statement_timeout = 60
}
```

## Contact Information

### 1. Emergency Contacts

#### On-Call Rotation
- **Primary**: Senior Engineer (24/7)
- **Secondary**: Lead Developer (24/7)
- **Escalation**: Engineering Manager (business hours)

#### Contact Methods
- **Slack**: #critical-alerts channel
- **PagerDuty**: Critical incidents
- **Phone**: Emergency hotline
- **Email**: ops@united-cars.com

### 2. Vendor Contacts

#### Infrastructure Providers
- **Cloud Provider**: Support portal + phone
- **CDN Provider**: Support email
- **Certificate Authority**: Renewal support
- **Monitoring Service**: Technical support

#### Third-party Services
- **Database Provider**: Support portal
- **Email Service**: SMTP support
- **Payment Processor**: Technical support

---

*This operations runbook is maintained by the DevOps team and updated regularly. For questions or suggestions, contact the operations team.*