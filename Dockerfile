# United Cars - Production Docker Build
ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    curl \
    netcat-openbsd \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for dependency caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install dependencies (frozen lockfile for production builds)
RUN pnpm install --frozen-lockfile --prefer-offline

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules
COPY --from=deps /app/apps/*/node_modules ./apps/*/node_modules

# Copy source code
COPY . .

# Build arguments for build-time configuration
ARG BUILD_ID=unknown
ARG COMMIT_SHA=unknown
ARG NODE_ENV=production

# Set build environment
ENV NODE_ENV=${NODE_ENV}
ENV BUILD_ID=${BUILD_ID}
ENV COMMIT_SHA=${COMMIT_SHA}
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Generate Prisma client and build all packages
RUN pnpm db:generate
RUN pnpm build

# Create standalone output for minimal runtime (Next.js 13+)
RUN cd apps/web && \
    if [ -d ".next/standalone" ]; then \
      mkdir -p ./standalone/apps/web && \
      cp -r ./.next/standalone/* ./standalone/ && \
      cp -r ./public ./standalone/apps/web/ 2>/dev/null || true && \
      cp -r ./.next/static ./standalone/apps/web/.next/static 2>/dev/null || true; \
    fi

# Development image
FROM base AS development
WORKDIR /app

RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["pnpm", "dev"]

# Production runtime image
FROM base AS runner
WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create necessary directories with correct permissions
RUN mkdir -p /app/uploads /app/logs .next && \
    chown -R nextjs:nodejs /app

# Copy built application from builder stage
# Try standalone first, fallback to regular build
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/standalone ./apps/web/ 2>/dev/null || \
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next

# Copy public assets and static files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public 2>/dev/null || true

# Copy essential files for database operations
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/dist ./packages/db/dist 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/

# Copy deployment scripts
COPY --chown=nextjs:nodejs deploy/scripts/*.sh ./scripts/
RUN chmod +x ./scripts/*.sh 2>/dev/null || true

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Default command - can be overridden in compose
CMD ["node", "apps/web/server.js"]

# =============================================================================
# Build Metadata & Labels
# =============================================================================
LABEL maintainer="United Cars Platform Team"
LABEL description="United Cars - Production Ready Vehicle Management Platform"
LABEL version="1.0.0"
LABEL org.opencontainers.image.title="United Cars Web Application"
LABEL org.opencontainers.image.description="Production-ready vehicle auction management platform"
LABEL org.opencontainers.image.vendor="United Cars Platform"
LABEL security.non-root-user="nextjs"