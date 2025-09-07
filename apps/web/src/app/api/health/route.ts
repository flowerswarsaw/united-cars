import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: Record<string, any> = {}
  let overall = 'healthy'

  // Test database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1 as test`
    checks.database = {
      status: 'connected',
      responseTime: `${Date.now() - dbStart}ms`
    }
  } catch (error) {
    checks.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    overall = 'unhealthy'
  }

  // Basic system checks
  try {
    const apiStart = Date.now()
    // Simple API health check
    checks.api = {
      status: 'operational',
      responseTime: `${Date.now() - apiStart}ms`
    }
  } catch (error) {
    checks.api = {
      status: 'error',
      error: error instanceof Error ? error.message : 'API check failed'
    }
    overall = 'degraded'
  }

  // Test Redis connection (if configured)
  try {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      // Basic Redis connection check would go here
      checks.redis = { status: 'configured' }
    } else {
      checks.redis = { status: 'not_configured' }
    }
  } catch (error) {
    checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Redis check failed'
    }
    overall = 'degraded'
  }

  // Generate request ID for tracing
  const requestId = request.headers.get('x-request-id') || 
    Math.random().toString(36).substring(2, 15)

  const totalResponseTime = Date.now() - startTime

  const health = {
    status: overall,
    timestamp: new Date().toISOString(),
    responseTime: `${totalResponseTime}ms`,
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    buildId: process.env.BUILD_ID || 'development',
    requestId,
    system: {
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    },
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