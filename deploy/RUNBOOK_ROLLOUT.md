# United Cars - Production Rollout Runbook

Step-by-step procedures for safe production deployments, monitoring, and incident response.

## 🎯 Overview

This runbook provides detailed operational procedures for:
- Pre-deployment preparation and validation
- Production deployment execution
- Post-deployment verification and monitoring
- Incident response and rollback procedures

## 📋 Pre-Deployment Checklist

### 1. Release Readiness Review

**Duration**: 30 minutes  
**Participants**: Platform team, Product owner  
**Required**: 24-48 hours before deployment  

#### Code Review Checklist
- [ ] All PRs reviewed and approved by 2+ team members
- [ ] CI pipeline passed (linting, tests, security scans)
- [ ] Staging environment tested and validated
- [ ] Database migration plan reviewed (if applicable)
- [ ] Security impact assessment completed

#### Infrastructure Checklist
- [ ] Production environment health verified
- [ ] SSL certificates valid (>30 days remaining)
- [ ] Database backup completed and verified
- [ ] Server resources adequate (CPU <70%, RAM <80%, Disk <80%)
- [ ] Monitoring systems operational
- [ ] Rollback plan prepared and tested

#### Communication Checklist
- [ ] Stakeholders notified of deployment window
- [ ] On-call rotation confirmed
- [ ] Incident response team identified
- [ ] Customer communication prepared (if needed)

### 2. Technical Validation

```bash
# Run these commands before deployment

# 1. Verify staging environment
curl -f https://staging.your-domain.com/api/health
curl -f https://staging.your-domain.com/api/version

# 2. Check production backup status
ssh united-cars@prod-server 'ls -la /var/united-cars/backups/db/ | head -5'

# 3. Verify SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# 4. Check server resources
ssh united-cars@prod-server 'free -h && df -h && uptime'

# 5. Test database connectivity
ssh united-cars@prod-server 'cd united-cars && docker compose -f deploy/compose/docker-compose.prod.yml exec -T db pg_isready -U postgres'
```

## 🚀 Deployment Execution

### Phase 1: Pre-Deployment Setup (5 minutes)

#### 1. Team Assembly
- [ ] Platform engineer (primary deployer)
- [ ] On-call engineer (secondary)
- [ ] Product owner (business validation)

#### 2. Communication
- [ ] Post deployment start notification in #deployments
- [ ] Update status page (if maintenance window required)

#### 3. Final Validation
```bash
# Last-minute health checks
curl -f https://your-domain.com/api/health
ssh united-cars@prod-server 'united-cars-status'

# Verify deployment artifacts
docker manifest inspect ghcr.io/your-org/united-cars:v2024.01.15-a1b2c3d
```

### Phase 2: Deployment (10-15 minutes)

#### 1. Initiate GitHub Actions Deployment

**Using GitHub CLI** (recommended):
```bash
# Trigger production deployment workflow
gh workflow run deploy-prod.yml -f tag=v2024.01.15-a1b2c3d

# Monitor deployment progress
gh run watch
```

**Using GitHub Web Interface**:
1. Navigate to Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Enter release tag and click "Run workflow"
5. Monitor progress in real-time

#### 2. Monitor Deployment Progress

Track these key stages:
- [ ] **Pre-deployment checks** (2 min)
- [ ] **Docker image build** (5 min)
- [ ] **Server preparation** (2 min)
- [ ] **Application deployment** (3 min)
- [ ] **Health verification** (2 min)
- [ ] **Post-deployment validation** (1 min)

#### 3. Real-time Monitoring Commands

Run these in parallel terminals:

**Terminal 1 - Application logs**:
```bash
ssh united-cars@prod-server 'cd united-cars && docker compose -f deploy/compose/docker-compose.prod.yml logs -f --tail=50 web'
```

**Terminal 2 - Database logs**:
```bash
ssh united-cars@prod-server 'cd united-cars && docker compose -f deploy/compose/docker-compose.prod.yml logs -f --tail=50 db'
```

**Terminal 3 - System monitoring**:
```bash
ssh united-cars@prod-server 'watch -n 5 "docker stats --no-stream && echo && curl -s http://localhost:3000/api/health"'
```

### Phase 3: Post-Deployment Verification (10-15 minutes)

#### 1. Automated Verification

The deployment workflow automatically performs:
- [ ] Health endpoint checks
- [ ] Database connectivity tests
- [ ] SSL certificate validation
- [ ] Basic functional tests

#### 2. Manual Verification Checklist

**Application Health** (5 minutes):
```bash
# Core functionality tests
curl -f https://your-domain.com/
curl -f https://your-domain.com/api/health
curl -f https://your-domain.com/api/version

# Authentication flow test
curl -f https://your-domain.com/auth/signin

# Database connectivity
curl -f https://your-domain.com/api/vehicles  # If this endpoint exists
```

**Performance Verification** (3 minutes):
```bash
# Response time check
time curl -s https://your-domain.com/ > /dev/null

# Load test (basic)
for i in {1..10}; do curl -s https://your-domain.com/api/health > /dev/null & done; wait
```

**Security Verification** (2 minutes):
```bash
# SSL grade check
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com&publish=off&all=done&ignoreMismatch=on" | jq '.endpoints[0].grade'

# Security headers check
curl -I https://your-domain.com/ | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"
```

#### 3. Business Validation (5 minutes)

Product owner performs:
- [ ] User registration flow
- [ ] Login/logout functionality
- [ ] Core business features
- [ ] Payment processing (if applicable)
- [ ] Critical user journeys

### Phase 4: Production Monitoring (30 minutes)

#### 1. Intensive Monitoring Period

Monitor for **30 minutes** post-deployment:

**Metrics to Track**:
- Response times (target: <2 seconds)
- Error rates (target: <1%)
- CPU usage (target: <80%)
- Memory usage (target: <85%)
- Database connections (monitor for leaks)

**Commands**:
```bash
# Continuous health monitoring
watch -n 10 'curl -s https://your-domain.com/api/health && echo " - $(date)"'

# Application metrics
ssh united-cars@prod-server 'cd united-cars && docker compose -f deploy/compose/docker-compose.prod.yml stats --no-stream'

# Error log monitoring
ssh united-cars@prod-server 'tail -f /var/united-cars/logs/error.log'
```

#### 2. User Traffic Monitoring

If using analytics/monitoring tools:
- [ ] Real-time user count
- [ ] Page load times
- [ ] Conversion funnel metrics
- [ ] Error tracking dashboard

## 🚨 Incident Response Procedures

### Level 1: Minor Issues (Non-blocking)

**Symptoms**: Slower response times, minor UI glitches, non-critical feature issues

**Response** (within 15 minutes):
1. Document issue in incident channel
2. Continue monitoring for degradation
3. Prepare rollback plan (don't execute yet)
4. Investigate root cause
5. Apply hotfix if simple, otherwise plan rollback

### Level 2: Major Issues (Service Degraded)

**Symptoms**: Significant performance degradation, authentication issues, database errors

**Response** (within 10 minutes):
1. **Alert team**: Page on-call engineer
2. **Assess impact**: Check error rates and user impact
3. **Decision point**: Fix forward vs. rollback
4. **If rollback needed**: Execute rollback procedure

### Level 3: Critical Issues (Service Down)

**Symptoms**: Application completely unavailable, database down, SSL certificate issues

**Response** (within 5 minutes):
1. **Immediate rollback**: Execute emergency rollback
2. **Alert stakeholders**: Notify leadership and customer support
3. **Incident commander**: Assign incident lead
4. **Status page**: Update customer-facing status
5. **Post-mortem**: Schedule incident review

## 🔄 Rollback Procedures

### Quick Rollback (5-10 minutes)

**When to use**: Application issues, minor data corruption

```bash
# 1. Connect to production server
ssh united-cars@prod-server
cd united-cars

# 2. Check current and previous versions
cat .current-prod-version
cat .previous-prod-version

# 3. Execute quick rollback
./deploy/scripts/deploy.sh prod rollback

# 4. Verify rollback success
curl -f https://your-domain.com/api/health
docker compose -f deploy/compose/docker-compose.prod.yml ps
```

### Database Rollback (15-30 minutes)

**When to use**: Database schema issues, data corruption

```bash
# 1. Stop application to prevent further writes
cd ~/united-cars/deploy/compose
docker compose -f docker-compose.prod.yml stop web

# 2. Find pre-deployment backup
ls -la /var/united-cars/backups/db/pre-restore-safety-backup_*.sql.gz

# 3. Restore database
./deploy/scripts/restore-db.sh prod /var/united-cars/backups/db/pre-restore-safety-backup_20240115_120000.sql.gz

# 4. Start application with previous version
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=v2024.01.14-xyz789/' deploy/compose/env/.prod
docker compose -f docker-compose.prod.yml up -d

# 5. Verify restoration
curl -f https://your-domain.com/api/health
```

### Emergency Rollback (GitHub Actions)

**When to use**: Need to rollback from outside server

```bash
# Trigger emergency rollback workflow
gh workflow run emergency-rollback.yml -f environment=production -f reason="Critical production issue"
```

## 📊 Post-Deployment Activities

### Immediate (within 1 hour)

- [ ] **Metrics review**: Check performance dashboards
- [ ] **User feedback**: Monitor support channels
- [ ] **Error tracking**: Review error rates and new issues
- [ ] **Team update**: Post deployment summary in #deployments

### Short-term (within 24 hours)

- [ ] **Performance analysis**: Compare pre/post deployment metrics
- [ ] **User behavior**: Analyze usage patterns for changes
- [ ] **Cost monitoring**: Check infrastructure costs for anomalies
- [ ] **Documentation update**: Record any issues or lessons learned

### Medium-term (within 1 week)

- [ ] **Success metrics**: Evaluate deployment against goals
- [ ] **User satisfaction**: Review NPS/satisfaction scores
- [ ] **Process improvement**: Update runbook based on experience
- [ ] **Team retrospective**: Discuss deployment process improvements

## 📈 Key Performance Indicators

### Deployment Success Metrics

- **Deployment frequency**: Target weekly releases
- **Lead time**: <2 hours from merge to production
- **Mean time to recovery**: <30 minutes for critical issues
- **Change failure rate**: <5% of deployments require rollback

### Application Performance Metrics

- **Availability**: 99.9% uptime target
- **Response time**: 95th percentile <2 seconds
- **Error rate**: <1% of requests
- **Database performance**: <100ms query response time

### Business Impact Metrics

- **User engagement**: Session duration and page views
- **Conversion rates**: Key business metrics
- **Customer satisfaction**: Support ticket volume and ratings
- **Revenue impact**: Financial metrics relevant to changes

## 🛠️ Tools and Resources

### Required Tools
- **GitHub CLI**: `gh` command for workflow management
- **SSH client**: Access to production servers
- **curl**: API testing and monitoring
- **jq**: JSON processing for API responses
- **Docker**: Container management and logs

### Monitoring Dashboards
- **Application health**: `/api/health` endpoint
- **System metrics**: Grafana dashboard (if configured)
- **Error tracking**: Sentry or similar error monitoring
- **User analytics**: Google Analytics or equivalent

### Communication Channels
- **#deployments**: Real-time deployment updates
- **#incidents**: Critical issue coordination
- **#platform-team**: Technical discussions
- **Status page**: Customer-facing status updates

## 📞 Emergency Contacts

### Platform Team
- **Primary On-call**: [Phone number]
- **Secondary On-call**: [Phone number]
- **Platform Lead**: [Phone number]

### Escalation Path
1. **Level 1**: On-call engineer
2. **Level 2**: Platform team lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO/VP Engineering

### External Vendors
- **DNS Provider**: [Contact information]
- **SSL Certificate Provider**: [Contact information]
- **Cloud Infrastructure**: [Contact information]

---

## 🔄 Continuous Improvement

This runbook is a living document. After each deployment:

1. **Review effectiveness**: Did the procedures work smoothly?
2. **Update based on learnings**: Add new steps or modify existing ones
3. **Team feedback**: Gather input from all deployment participants
4. **Version control**: Commit updates to this runbook

Last updated: [Date]  
Next review: [Date + 1 month]