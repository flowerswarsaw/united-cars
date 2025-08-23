web: cd apps/web && pnpm start
release: cd packages/db && DATABASE_URL=$DATABASE_URL pnpm prisma migrate deploy && DATABASE_URL=$DATABASE_URL pnpm db:seed