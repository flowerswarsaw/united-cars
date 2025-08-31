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

**Professional Title Management System** (Current):
- Unified admin panel for titles and packages with tab-based navigation
- Business-logical organization routing: Auctions → Processing Center → Dealers
- Enhanced title workflow: received → processing → quality_review → ready_to_ship → shipped → completed
- Package management with sender/recipient organizations (no artificial "type" field)
- Comprehensive mock data with 15+ realistic title scenarios
- Status history tracking and audit trails
- Document management integration ready
- VIN validation system with vehicle relationships
- Professional UI without emoji icons or unprofessional elements
- Package detail routes with full CRUD operations

**Professional Pricing Matrix System** (Current):
- **Towing Matrix**: Auction location → shipping port route-based pricing with vehicle type rates
- **Shipping Matrix**: US shipping port → international destination port pricing with dual structure
- Route-specific business logic: each matrix entry represents actual operational routes
- Dual pricing structure: individual vehicle types + container consolidation options
- Simple inline editing: click any price to edit with Enter/Escape/blur functionality
- Dynamic form system: add/remove multiple destinations with individual pricing
- Container-only shipping (no RORO) with 1/4, 1/3, 1/2, full container options
- Clean, consistent UI across both towing and shipping matrices
- Professional styling without excessive visual elements
- Comprehensive mock data with realistic pricing scenarios

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
- Enhanced title management with status history and document tracking
- Organization-based package routing system
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

**Title Management Architecture**:
- Mock data system supporting 15+ realistic title processing scenarios
- Organization types: Auctions (Copart, IAA, Manheim), Processing Centers, Dealers
- Status-driven workflow with proper business logic progression
- Package routing system connecting organizations without artificial "types"
- TypeScript interfaces: EnhancedTitle, EnhancedPackage, TitleStatusHistory
- VIN validation system with comprehensive error handling
- Document management ready for PDF upload/preview
- Activity logging for complete audit trails

**Pricing Matrix Architecture**:
- **Towing System**: TowingMatrix interface with portPricing structure for route-specific pricing
- **Shipping System**: ShippingMatrix interface with destinationPricing + dual pricing (vehicle/consolidation)
- Route-based data structure: `{ [portName: string]: VehicleTypePricing | ConsolidationPricing }`
- TypeScript interfaces: VehicleTypePricing, ConsolidationPricing, TowingMatrix, ShippingMatrix
- Mock data system with realistic pricing scenarios across multiple routes
- Inline editing state management with React hooks (useState for editing context)
- Form validation ensuring at least one destination/port per matrix
- Clean separation between auction house data, port data, and pricing data
- Consistent UI patterns across both towing and shipping pricing matrices

## 📝 Next Development Areas

When continuing development, consider:

1. **Title Management Enhancements**:
   - Database integration (replace mock data with Prisma)
   - Real-time status updates with WebSocket connections
   - Bulk VIN import system with validation and error reporting
   - PDF document upload and preview capabilities
   - Advanced filtering with date ranges and multi-select options

2. **Advanced Features**: 
   - Auction integration APIs (Copart, IAA data feeds)
   - Payment processing for title services
   - Customer portal for dealers to track their titles
   - Automated status notifications via email/SMS

3. **System Enhancements**:
   - Monitoring & Observability: Add metrics, logging, and alerting
   - Performance Optimization: Database indexes, query optimization, caching
   - Mobile Experience: PWA features, mobile-specific optimizations
   - API Extensions: REST API for third-party integrations
   - Testing: E2E tests for title workflows, load testing

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

**Last Updated**: August 28, 2025  
**Status**: Professional title management system implemented - Ready for production deployment  
**Major Addition**: Complete title and package management with business-logical workflows  
**Documentation**: See `/deploy/DEPLOYMENT.md` for deployment, `enhanced-title-model.md` for title system architecture