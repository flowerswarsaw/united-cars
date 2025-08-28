# United Cars - Vehicle Auction Management Platform

## 🌟 **Revolutionary Dynamic Title Status System**
**World's First Package-Based Title Status Tracking**

United Cars features an innovative title status system where statuses are **dynamically calculated** from package relationships:
- **pending** → No packages assigned 
- **packed** → "Packed" (in shipping package)
- **sent_to** → "Sent to [Organization]" (package shipped)  
- **received_by** → "Received by [Organization]" (package delivered)

**Key Innovation**: Title status automatically updates when package status changes, providing real-time visibility into title locations.

**Status Management**: Title statuses are read-only and controlled exclusively through package operations, ensuring 100% data consistency and complete audit trails.

## 📋 **Complete Platform Features**
A production-grade platform for vehicle auction management with:
- ✅ **Dynamic Title Management** - Revolutionary package-based status system
- ✅ **Package Shipping System** - Complete logistics workflow 
- ✅ **Document Management** - Upload, view, and organize documents
- ✅ **Organization Management** - Auction houses, dealers, processors
- ✅ **Cost Calculators** - Auction fees, shipping, towing calculations
- ✅ **Invoice & Payment Workflows** - Complete financial management
- ✅ **Production Deployment** - Docker + CI/CD + monitoring

## 🚀 Quick Start

Get United Cars running locally with one command:

```bash
corepack enable && corepack prepare pnpm@9 --activate
pnpm install
cp .env.example .env
docker compose up -d --build
pnpm -w prisma migrate deploy
pnpm -w tsx packages/db/seed.ts
pnpm -w test && pnpm --filter web test:e2e
```

Then open http://localhost:3000

## 🔑 Default Login Credentials

- **Admin**: `admin@demo.com` / `admin123` (admin, accountant, ops roles)
- **Dealer**: `dealer@demo.com` / `dealer123` (dealer role)

## 📋 Features

### ✅ Core Functionality (MVP)
- [x] **Authentication & RBAC** - Multi-role user system with org scoping
- [x] **Vehicle Management** - Track vehicles through auction to delivery stages
- [x] **Cost Calculators** - Auction fees, towing, shipping, customs calculations
- [x] **Invoice System** - Generate and manage invoices with PDF export
- [x] **Payment Workflows** - Submit, confirm, and track payment intents
- [x] **Admin Pricing** - Manage fee matrices and pricing rules
- [x] **Audit Logging** - Track all system changes

### 🏗️ Architecture
- **Modular Monolith** - Clean domain separation, ready for future microservices split
- **Next.js 14** - App Router with API routes and server components
- **Prisma** - Type-safe database ORM with PostgreSQL
- **Docker Compose** - One-command development setup
- **PNPM Workspaces** - Monorepo with shared packages

### 📦 Package Structure

```
apps/
  web/           # Next.js application (UI + API routes)
packages/
  db/            # Prisma schema, migrations, seed scripts
  core/          # Shared types, schemas, utils, constants
  ui/            # Shared UI components (shadcn/ui)
  calc/          # Pure calculation functions
  jobs/          # BullMQ queue processors (future)
  pdf/           # PDF generation utilities
  config/        # Shared configuration files
```

## 🛠️ Development

### Prerequisites
- Node.js 20+
- PNPM 9+
- Docker & Docker Compose

### Commands

```bash
# Development
make dev          # Start in development mode
make up           # Start with Docker Compose
make down         # Stop services
make logs         # View logs

# Database
make db           # Run migrations + seed
make reset        # Reset database (destroys data!)

# Maintenance
make clean        # Clean Docker artifacts
make install      # Install dependencies
make build        # Build all packages
make test         # Run tests
make lint         # Run linting
make typecheck    # TypeScript checking
```

### Architecture Decision Records (ADRs)

See [docs/adr/](./docs/adr/) for key architectural decisions:

1. **[ADR-001: Prisma vs Drizzle](./docs/adr/001-prisma-vs-drizzle.md)** - Why we chose Prisma
2. **[ADR-002: Next.js API Routes vs Fastify](./docs/adr/002-nextjs-vs-fastify.md)** - API architecture
3. **[ADR-003: Modular Monolith Strategy](./docs/adr/003-modular-monolith.md)** - Current vs future architecture

## 📊 Domain Model

### Core Entities
- **Organizations** - Dealers, admin orgs with hierarchy
- **Users** - Multi-role users with org scoping  
- **Vehicles** - Tracked through auction to delivery
- **Invoices** - Line items, status tracking, PDF generation
- **Payments** - Intent-based workflow with approval
- **Calculators** - Auction, towing, shipping, customs

### Calculation Engines

All calculators are pure functions with versioned I/O:

```typescript
// Auction Fee Calculator
const result = calculateAuctionFees({
  auction: 'COPART',
  carPriceUSD: 15000,
  accountType: 'C',
  titleType: 'clean',
  payment: 'secured'
}, feeMatrices)

// Outputs detailed breakdown with version
```

## 🔒 Security & Compliance

- **RBAC** - Role-based access control with org scoping
- **CSRF Protection** - Built-in Next.js CSRF protection
- **Audit Logging** - All mutations logged with user context
- **Data Isolation** - Strict org-level data separation
- **Rate Limiting** - API endpoints protected
- **Input Validation** - Zod schemas throughout

## 🚢 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   DATABASE_URL="postgresql://..."
   AUTH_SECRET="secure-production-secret"
   REDIS_URL="redis://..."
   ```

2. **Database Setup**
   ```bash
   pnpm db:migrate
   pnpm db:seed:production
   ```

3. **Build & Start**
   ```bash
   pnpm build
   pnpm start
   ```

### Docker Production
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 📈 Roadmap

### Phase 1: MVP (Current) ✅
- Core vehicle tracking
- Basic calculators
- Invoice & payment workflows
- Admin pricing management

### Phase 2: Logistics 🚧
- Real-time vehicle tracking
- Carrier integration APIs
- Title management workflows
- Document upload/storage

### Phase 3: Control 📋
- Advanced reporting & analytics
- Custom pricing rules engine
- Multi-currency support
- API rate limiting & quotas

### Phase 4: Services 🔌
- Carfax integration
- Insurance claim management
- External shipping APIs
- Automated notifications

### Phase 5: Scale 📊
- Microservices migration
- Event-driven architecture
- Advanced caching strategies
- Performance optimization

## 🧪 Testing

### Test Types
- **Unit Tests** - Calculator functions with full coverage
- **API Tests** - Endpoint smoke tests with authentication
- **E2E Tests** - Playwright flows for critical paths

```bash
# Run all tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Test Data
Seed script creates comprehensive test data:
- 2 organizations (admin + dealer)
- 2 users with different roles
- 5 vehicles in various stages
- Sample invoices and payments
- Complete pricing matrices

## 📚 API Documentation

### Core Endpoints

```bash
# Authentication
POST /api/auth/login
GET  /api/me

# Vehicles
GET  /api/vehicles
POST /api/vehicles
GET  /api/vehicles/[id]

# Calculators
POST /api/calc/auction
POST /api/calc/towing
POST /api/calc/shipping
POST /api/calc/customs

# Invoices
GET  /api/invoices
POST /api/invoices
GET  /api/invoices/[id]/pdf

# Payments
POST /api/payments/intent
POST /api/payments/[id]/confirm
POST /api/payments/[id]/reject

# Admin
GET  /api/admin/pricing/auction-fees
PUT  /api/admin/pricing/auction-fees
```

All endpoints:
- ✅ Input validation with Zod
- ✅ RBAC authorization
- ✅ Org-scoped data access
- ✅ Audit logging
- ✅ Error handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Ensure all checks pass: `make test lint typecheck`
5. Submit pull request

### Code Standards
- TypeScript strict mode
- Zod for all I/O validation
- Prisma for database access
- Tailwind for styling
- ESLint + Prettier formatting

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Architecture**: [docs/architecture.md](./docs/architecture.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with ❤️ by the United Cars team**