#!/bin/bash
# --- United Cars: One-Shot Run ---
set -e

echo "🚗 Starting United Cars setup..."

# 1) Enable pnpm
echo "📦 Setting up pnpm..."
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9 --activate >/dev/null 2>&1 || true

# 2) Install deps & env
echo "⬇️  Installing dependencies..."
pnpm install --silent

echo "⚙️  Setting up environment..."
[ -f .env ] || cp .env.example .env

# 3) Start stack
echo "🐳 Starting Docker services..."
docker compose down -v >/dev/null 2>&1 || true
docker compose up -d --build

# 4) Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker compose exec postgres pg_isready -U postgres >/dev/null 2>&1; then
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Postgres failed to start"
    exit 1
fi

# 5) Generate Prisma client and setup database
echo "🗄️  Setting up database..."
docker compose exec web sh -c "cd packages/db && npx prisma generate"
docker compose exec web sh -c "cd packages/db && npx prisma migrate deploy"
docker compose exec web sh -c "cd packages/db && npx tsx src/seed.ts"

# 6) Verify everything is working
echo "🔍 Verifying setup..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo ""
    echo "✅ United Cars is running successfully!"
    echo ""
    echo "🌐 Open:   http://localhost:3000"
    echo "👤 Admin:  admin@demo.com  /  admin123"
    echo "🏪 Dealer: dealer@demo.com /  dealer123"
    echo ""
    echo "📋 Try these features:"
    echo "   • Login and view dashboard"
    echo "   • Check vehicles page"
    echo "   • Test cost calculators"
    echo "   • Create invoices"
    echo "   • Admin pricing management"
    echo ""
    echo "🛠️  Commands:"
    echo "   make logs    # View logs"
    echo "   make down    # Stop services"
    echo "   make reset   # Reset database"
else
    echo "❌ Setup completed but web server not responding"
    echo "Check logs with: docker compose logs web"
    exit 1
fi