import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'

export async function GET(request: NextRequest) {
  const checks: Record<string, string> = {}
  let overall = 'healthy'

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1 as test`
    checks.database = 'connected'
  } catch (error) {
    checks.database = 'disconnected'
    overall = 'unhealthy'
  }

  // Test Redis connection (if configured)
  try {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      // Basic Redis connection check would go here
      checks.redis = 'configured'
    } else {
      checks.redis = 'not_configured'
    }
  } catch (error) {
    checks.redis = 'error'
    overall = 'degraded'
  }

  // Generate request ID for tracing
  const requestId = request.headers.get('x-request-id') || 
    Math.random().toString(36).substring(2, 15)

  const health = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    buildId: process.env.BUILD_ID || 'development',
    requestId,
    checks
  }
  
  // Set request ID header for debugging
  const headers = new Headers()
  headers.set('X-Request-ID', requestId)
  
  return NextResponse.json(health, { 
    status: overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503,
    headers
  })
}