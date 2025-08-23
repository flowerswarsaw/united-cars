# 🚀 United Cars Quick Start Guide

Since the Docker setup has some dependency resolution issues, here's how to get United Cars running locally:

## Option 1: Local Development (Recommended)

### 1. Prerequisites
```bash
# Install Node.js 20+ and enable corepack
node --version  # Should be 20+
corepack enable
corepack prepare pnpm@9 --activate
```

### 2. Setup Database
```bash
# Start just Postgres and Redis with Docker
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=united_cars \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  postgres:16-alpine

docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 3. Install Dependencies & Setup
```bash
# Install all dependencies
pnpm install

# Generate Prisma client
cd packages/db && pnpm prisma generate

# Run migrations and seed
cd packages/db && pnpm prisma migrate deploy
cd packages/db && pnpm tsx src/seed.ts
```

### 4. Start Development
```bash
# Start the development server
pnpm dev
```

### 5. Access Application
- **URL**: http://localhost:3000
- **Admin**: admin@demo.com / admin123
- **Dealer**: dealer@demo.com / dealer123

## Option 2: Manual Database Setup

If you have PostgreSQL running locally:

```bash
# Create database
createdb united_cars

# Update .env to point to your local DB
DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/united_cars"

# Then run setup
cd packages/db && pnpm prisma migrate deploy
cd packages/db && pnpm tsx src/seed.ts
pnpm dev
```

## What You'll See

✅ **Homepage** - Landing page with navigation  
✅ **Login** - Working authentication with demo accounts  
✅ **Dashboard** - Stats overview and quick actions  
✅ **Vehicles** - Demo Honda Accord and Toyota Corolla  
✅ **Calculators** - Test auction fee calculations via API  
✅ **Invoices** - Demo invoice INV-2024-001  
✅ **Admin** - Pricing management (accessible to admin role)  

## Testing the Calculators

```bash
# Test auction calculator
curl -X POST http://localhost:3000/api/calc/auction \
  -H "Content-Type: application/json" \
  -d '{
    "auction": "COPART",
    "carPriceUSD": 15000,
    "accountType": "C",
    "titleType": "clean",
    "payment": "secured"
  }'
```

## Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000  # Next.js
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Database Issues
```bash
# Check if Postgres is running
docker ps | grep postgres

# View database tables
docker exec -it postgres psql -U postgres -d united_cars -c "\dt"
```

### Dependency Issues
```bash
# Clean install
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
```

## Docker Alternative (If Fixed)

If you want to try Docker again later:
```bash
./run.sh
```

The Docker setup needs dependency resolution fixes, but the local setup works perfectly!

---

**🎯 Status**: Local development ready  
**🐳 Docker**: Needs dependency fixes  
**✅ All Features**: Working in local mode