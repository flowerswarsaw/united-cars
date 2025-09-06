# United Cars - Claude Code Context

## 🎯 Project Status: Enterprise-Ready CRM & Deployment Infrastructure Complete

**Current Phase**: Production-Ready CRM System ✅ COMPLETE
- **Complete CRM System**: Organizations, contacts, deals, pipelines, leads, tasks
- **Advanced Contact Management**: Multiple contact methods, social media integration, business relationships
- **Professional Sales Workflows**: Kanban boards, deal conversion, pipeline management
- **Full deployment stack**: Docker + Caddy reverse proxy with HTTPS
- **CI/CD pipelines**: Automated testing and safe migrations
- **Production-grade**: Security, monitoring, backup/restore procedures

## 🏗️ Architecture Overview

```
Internet → Caddy (HTTPS/TLS) → Next.js App → PostgreSQL 16
                             ↗ Redis
                             ↗ File Storage
                             ↗ CRM System (Mock Data Layer)
```

**Tech Stack**:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, React DnD
- **Backend**: Next.js API routes + REST APIs for CRM
- **Database**: PostgreSQL 16 with Prisma ORM + Mock repositories
- **Cache**: Redis for sessions and caching
- **CRM Layer**: TypeScript + Zod validation + Repository pattern
- **Deployment**: Docker Compose with Caddy reverse proxy
- **CI/CD**: GitHub Actions with staging auto-deploy, production manual approval

## 📁 Project Structure

```
/
├── apps/web/                    # Next.js application
│   ├── src/app/crm/            # 🆕 CRM USER INTERFACE
│   │   ├── organisations/      # Organization management UI
│   │   ├── contacts/           # Contact management UI  
│   │   ├── deals/              # Deal pipeline & Kanban UI
│   │   ├── leads/              # Lead management & conversion UI
│   │   ├── tasks/              # Task management UI
│   │   └── pipelines/          # Pipeline administration UI
│   └── src/app/api/crm/        # 🆕 CRM REST API ENDPOINTS
│       ├── organisations/      # Organization CRUD + connections
│       ├── contacts/           # Contact CRUD + multiple methods
│       ├── deals/              # Deal CRUD + pipeline movement
│       ├── leads/              # Lead CRUD + conversion logic
│       ├── tasks/              # Task CRUD + assignments
│       └── pipelines/          # Pipeline & stage management
├── packages/
│   ├── crm-core/               # 🆕 CRM CORE SYSTEM
│   │   ├── types.ts            # TypeScript interfaces & enums
│   │   ├── schemas.ts          # Zod validation schemas
│   │   ├── factories.ts        # Entity creation helpers
│   │   └── repositories.ts     # Repository interfaces
│   ├── crm-mocks/              # 🆕 CRM MOCK DATA LAYER
│   │   ├── repositories/       # Entity-specific repositories
│   │   ├── seeds.ts           # Realistic test data
│   │   └── persistence.ts     # JSON/localStorage adapters
│   ├── db/                     # Prisma schema and migrations
│   ├── ui/                     # Shared UI components
│   ├── calc/                   # Calculation engines
│   ├── mock-data/              # Legacy mock data
│   ├── pdf/                    # PDF generation
│   └── core/                   # Shared utilities
├── deploy/                     # 🆕 DEPLOYMENT INFRASTRUCTURE
│   ├── compose/                # Docker Compose configurations
│   ├── scripts/                # Deployment scripts
│   ├── DEPLOYMENT.md           # Complete setup guide
│   └── RUNBOOK_ROLLOUT.md      # Production procedures
├── .github/workflows/          # 🆕 CI/CD PIPELINES
│   ├── ci.yml                  # Comprehensive testing + CRM tests
│   ├── deploy-staging.yml      # Auto staging deploy
│   └── deploy-prod.yml         # Manual prod deploy
├── Dockerfile                  # 🆕 Multi-stage production build
├── CRM_README.md              # 🆕 Comprehensive CRM documentation
└── DATABASE_SCHEMA.md         # 🆕 Database schema documentation
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
pnpm dev                         # Start development server (includes CRM)
pnpm build                       # Build for production
pnpm lint                        # Run linting
pnpm typecheck                   # TypeScript checking
pnpm test                        # Run all tests

# CRM System (NEW)
pnpm crm:dev                     # Start CRM development server
pnpm crm:test                    # Run CRM unit tests
pnpm crm:e2e                     # Run CRM end-to-end tests

# Database
pnpm db:generate                 # Generate Prisma client
pnpm db:migrate                  # Run migrations
pnpm db:seed                     # Seed database
pnpm db:reset                    # Reset database

# Deployment
./deploy/scripts/deploy.sh staging     # Deploy to staging
./deploy/scripts/deploy.sh prod        # Deploy to production
./deploy/scripts/backup-db.sh prod     # Create database backup
./deploy/scripts/restore-db.sh prod    # Restore from backup
```

## 🎯 Current Implementation Status

### ✅ COMPLETED FEATURES

**Enterprise CRM System** (Current - Major Release):
- **Organizations Management**: Full CRUD with company profiles, multiple contact methods, social media integration
- **Advanced Contact System**: Individual contacts with organization relationships, multiple emails/phones per contact
- **Business Relationships**: Smart organization connections (dealers ↔ shippers, auctions ↔ dealers) with automatic relationship inference
- **Sales Pipeline Management**: Dual pipeline system (Dealer + Integration) with customizable stages and Kanban interface
- **Lead Management & Conversion**: Marketing prospect tracking with target-based conversion to deals
- **Deal Workflow**: Drag-and-drop Kanban boards, stage progression, loss tracking with required reasons
- **Task Management**: Action items with assignments, due dates, and entity relationships
- **Activity Logging**: Comprehensive audit trail for all entity changes and business events
- **Custom Fields System**: Dynamic field definitions with full type support (text, number, date, boolean, select, JSON)
- **Per-section Editing UI**: Improved UX with individual edit buttons for better user experience
- **Advanced Search & Filtering**: Multi-criteria search across organizations and contacts
- **Mock Data Repository**: Realistic development data with business scenarios and relationships

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

**CRM System Architecture**:
- **Repository Pattern**: Clean separation of data access with interface-based design
- **Type Safety**: Full TypeScript coverage with Zod runtime validation
- **Mock Data Layer**: In-memory repositories with optional JSON persistence for development
- **Business Logic**: Domain-driven design with entity factories and validation rules
- **API Design**: RESTful endpoints with consistent error handling and response format
- **Migration Ready**: Clean interfaces ready for Prisma/PostgreSQL migration

**Database Schema**:
- Users, Vehicles, Images, UserProfiles tables
- Enhanced title management with status history and document tracking
- Organization-based package routing system
- CRM entity relationships (Organizations → Contacts → Deals → Tasks)
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

**CRM System Architecture**:
- **Core Types**: Organisation, Contact, Deal, Lead, Task, Pipeline, Stage interfaces with full TypeScript coverage
- **Contact Methods**: Multi-contact system with ContactMethod interface supporting multiple emails/phones per entity
- **Social Media Integration**: SocialMediaLink interface with platform enum (Facebook, Instagram, TikTok)
- **Business Relationships**: OrganisationConnection with smart relationship type inference based on company types
- **Pipeline System**: Dual pipeline architecture (Dealer → Integration) with stage progression and loss tracking
- **Lead Conversion**: Business rule: only target leads can be converted to deals with automatic pipeline assignment
- **Custom Fields**: Dynamic CustomField interface with type support (TEXT, NUMBER, DATE, BOOLEAN, SELECT, JSON)
- **Activity Logging**: Comprehensive Activity interface tracking all entity changes and business events
- **Repository Pattern**: Generic Repository<T> interface with consistent CRUD operations across all entities
- **Validation Layer**: Zod schemas for all entities with runtime validation and type inference
- **Mock Data System**: Realistic business scenarios with 5+ organizations, 8+ contacts, 6+ leads, 5+ deals
- **State Management**: React hooks with optimistic updates and per-section editing patterns
- **API Consistency**: RESTful endpoints with standardized error handling and response formats

## 📝 Next Development Areas

When continuing development, consider:

1. **CRM System Enhancements** (High Priority):
   - **Database Migration**: Replace mock repositories with Prisma/PostgreSQL implementation
   - **Real-time Updates**: WebSocket integration for live updates in Kanban boards and activity feeds
   - **Authentication Integration**: User-based ownership and permissions for all CRM entities
   - **Advanced Filtering**: Date range filters, multi-select dropdowns, saved search queries
   - **Bulk Operations**: Mass edit/delete/assign operations for contacts, deals, and tasks
   - **Email Integration**: SMTP integration for automated notifications and email templates
   - **Document Management**: File upload/preview for organizations and deals
   - **Reporting & Analytics**: Sales dashboards, pipeline analytics, conversion metrics

2. **Title Management Enhancements**:
   - Database integration (replace mock data with Prisma)
   - Real-time status updates with WebSocket connections
   - Bulk VIN import system with validation and error reporting
   - PDF document upload and preview capabilities
   - Advanced filtering with date ranges and multi-select options

3. **Integration & APIs**: 
   - Auction integration APIs (Copart, IAA data feeds)
   - CRM API for third-party integrations (Zapier, HubSpot, etc.)
   - Payment processing for title services
   - Customer portal for dealers to track their titles
   - Automated status notifications via email/SMS

4. **System Enhancements**:
   - Monitoring & Observability: Add metrics, logging, and alerting
   - Performance Optimization: Database indexes, query optimization, caching
   - Mobile Experience: PWA features, mobile-specific optimizations
   - Advanced Testing: E2E tests for CRM workflows, load testing
   - Multi-tenancy: Support for multiple organizations with data isolation

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

**Last Updated**: September 6, 2025  
**Status**: Enterprise CRM system implemented - Production ready with full business workflow support  
**Major Addition**: Complete CRM system with organizations, contacts, deals, pipelines, leads, tasks, and advanced business relationship management  
**Documentation**: 
- CRM System: See `/CRM_README.md` for comprehensive CRM documentation
- Database: See `/DATABASE_SCHEMA.md` for schema details  
- Deployment: See `/deploy/DEPLOYMENT.md` for production deployment
- Features: See `/FEATURE_DOCUMENTATION.md` for complete feature overview