# United Cars - Claude Code Context

## 🎯 Project Status: Production-Ready Deployment Infrastructure Complete

**Current Phase**: Deployable Release Infrastructure ✅ COMPLETE
- Full staging/production deployment stack
- Docker + Caddy reverse proxy with HTTPS
- CI/CD pipelines with safe migrations
- Comprehensive backup/restore procedures
- Production-grade security and monitoring

## 🏗️ Architecture Overview

```
Internet → Caddy (HTTPS/TLS) → Next.js App → PostgreSQL 16
                             ↗ Redis
                             ↗ File Storage
```

**Tech Stack**:
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with tRPC
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis for sessions and caching
- **Deployment**: Docker Compose with Caddy reverse proxy
- **CI/CD**: GitHub Actions with staging auto-deploy, production manual approval

## 📁 Project Structure

```
/
├── apps/web/                    # Next.js application
├── packages/
│   ├── db/                      # Prisma schema and migrations
│   ├── ui/                      # Shared UI components
│   └── utils/                   # Shared utilities
├── deploy/                      # 🆕 DEPLOYMENT INFRASTRUCTURE
│   ├── compose/                 # Docker Compose configurations
│   │   ├── docker-compose.staging.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── caddy/Caddyfile      # Reverse proxy config
│   │   └── env/                 # Environment templates
│   ├── scripts/                 # Deployment scripts
│   │   ├── bootstrap-host.sh    # Server setup
│   │   ├── deploy.sh           # Main deployment
│   │   ├── backup-db.sh        # Database backup
│   │   └── restore-db.sh       # Database restore
│   ├── DEPLOYMENT.md           # Complete setup guide
│   ├── RUNBOOK_ROLLOUT.md      # Production procedures
│   └── README.md               # Quick start guide
├── .github/workflows/          # 🆕 CI/CD PIPELINES
│   ├── ci.yml                  # Comprehensive testing
│   ├── deploy-staging.yml      # Auto staging deploy
│   └── deploy-prod.yml         # Manual prod deploy
└── Dockerfile                  # 🆕 Multi-stage production build
```

## 🚀 Deployment Capabilities

### Environments
- **Staging**: `staging.your-domain.com` - Auto-deploy on releases
- **Production**: `your-domain.com` - Manual approval required

### Key Features
- ✅ **One-command deployment**: `./deploy/scripts/deploy.sh`
- ✅ **Automatic HTTPS**: Let's Encrypt with Caddy
- ✅ **Database migrations**: Safe schema changes with rollback
- ✅ **Health checks**: Application and service monitoring
- ✅ **Backup/restore**: Daily automated backups with verification
- ✅ **Security hardening**: Firewall, intrusion detection, security headers
- ✅ **CI/CD automation**: GitHub Actions with approval gates

## 🛠️ Development Commands

```bash
# Development
pnpm dev                         # Start development server
pnpm build                       # Build for production
pnpm lint                        # Run linting
pnpm typecheck                   # TypeScript checking
pnpm test                        # Run tests

# Database
pnpm db:generate                 # Generate Prisma client
pnpm db:migrate                  # Run migrations
pnpm db:seed                     # Seed database
pnpm db:reset                    # Reset database

# Deployment (NEW)
./deploy/scripts/deploy.sh staging     # Deploy to staging
./deploy/scripts/deploy.sh prod        # Deploy to production
./deploy/scripts/backup-db.sh prod     # Create database backup
./deploy/scripts/restore-db.sh prod    # Restore from backup
```

## 🎯 Current Implementation Status

### ✅ COMPLETED FEATURES

**Core Platform** (Sprint 2.7):
- Authentication system with NextAuth.js
- User management and profile system
- Vehicle listing and management
- Image upload with file validation
- Search and filtering capabilities
- Responsive UI with Tailwind CSS
- Database schema with proper relationships
- Type-safe API with tRPC
- Form validation with Zod
- Toast notifications and error handling

**Deployment Infrastructure** (Current):
- Docker Compose staging/production configs
- Caddy reverse proxy with automatic HTTPS
- Environment configuration templates
- Server bootstrap script (Ubuntu 22+)
- Safe deployment script with health checks
- Database backup/restore procedures
- GitHub Actions CI/CD pipelines
- Comprehensive deployment documentation
- Production rollout runbook

### 🔧 TECHNICAL CONTEXT

**Database Schema**:
- Users, Vehicles, Images, UserProfiles tables
- Proper foreign key relationships
- UUID primary keys for security
- Timestamps and soft delete support

**Security**:
- Non-root Docker containers
- Network isolation between services
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting and intrusion detection
- Environment-based secret management

**Performance**:
- Multi-stage Docker builds for optimized images
- Redis caching and session storage
- Database connection pooling
- Static asset optimization
- Health checks and monitoring

## 📝 Next Development Areas

When continuing development, consider:

1. **Monitoring & Observability**: Add metrics, logging, and alerting
2. **Advanced Features**: Auction system, payments, advanced search
3. **Performance Optimization**: CDN, database indexes, caching strategies  
4. **Mobile Experience**: PWA features, mobile-specific optimizations
5. **Admin Dashboard**: Content management, user administration
6. **API Extensions**: REST API for third-party integrations
7. **Testing**: E2E tests, load testing, security testing

## 🎯 Development Guidelines

- **Always run tests** before deployment
- **Use the staging environment** for testing changes
- **Follow the deployment runbook** for production changes
- **Database changes require migrations** via Prisma
- **Security-first approach** - validate all inputs, sanitize outputs
- **Performance monitoring** - check metrics after deployments
- **Documentation updates** - keep deployment docs current

## 📞 Operational Procedures

- **Staging Deploy**: Automatic on release creation
- **Production Deploy**: Manual via GitHub Actions with approval
- **Rollback**: `./deploy/scripts/deploy.sh prod rollback`
- **Database Recovery**: `./deploy/scripts/restore-db.sh prod <backup-file>`
- **Health Monitoring**: `https://your-domain.com/api/health`
- **System Status**: `united-cars-status` command on server

---

**Last Updated**: August 23, 2025  
**Status**: Ready for staging/production deployment  
**Documentation**: See `/deploy/DEPLOYMENT.md` for complete setup guide