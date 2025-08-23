/**
 * Performance Monitoring API Endpoint
 * Provides database performance metrics for system optimization
 * Admin-only access for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { 
  getSession, 
  createStandardErrorResponse, 
  createApiResponse,
  handleApiError 
} from '@/lib/auth-utils'
import { handlePerformanceMonitoring } from '@/lib/performance-monitor'

// GET /api/admin/performance - Get database performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return createStandardErrorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Restrict to admin users only
    const roles = session.user.roles || []
    if (!roles.includes('ADMIN')) {
      return createStandardErrorResponse('FORBIDDEN', 'Admin access required', 403)
    }

    // Handle performance monitoring request
    const performanceData = await handlePerformanceMonitoring(request)
    
    return createApiResponse({
      performance: performanceData,
      timestamp: new Date().toISOString(),
      requestedBy: session.user.id
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/performance/reset - Reset performance statistics
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return createStandardErrorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }

    const roles = session.user.roles || []
    if (!roles.includes('ADMIN')) {
      return createStandardErrorResponse('FORBIDDEN', 'Admin access required', 403)
    }

    const body = await request.json()
    const { action } = body

    if (action === 'reset_pg_stat_statements') {
      // Reset pg_stat_statements to start fresh monitoring
      await prisma.$executeRaw`SELECT pg_stat_statements_reset()`
      
      return createApiResponse({
        message: 'Performance statistics reset successfully',
        resetAt: new Date().toISOString(),
        resetBy: session.user.id
      })
    }

    return createStandardErrorResponse('VALIDATION_ERROR', 'Invalid action provided', 400)

  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/admin/performance/analyze - Trigger performance analysis
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return createStandardErrorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }

    const roles = session.user.roles || []
    if (!roles.includes('ADMIN')) {
      return createStandardErrorResponse('FORBIDDEN', 'Admin access required', 403)
    }

    const body = await request.json()
    const { entity, action } = body

    let analysisResult

    switch (action) {
      case 'analyze_queries':
        const { analyzeEntityQueryPatterns } = await import('@/lib/performance-monitor')
        analysisResult = await analyzeEntityQueryPatterns(entity || 'vehicles')
        break

      case 'vacuum_analyze':
        // Trigger VACUUM ANALYZE on specific tables to update statistics
        if (entity === 'all') {
          await prisma.$executeRaw`VACUUM ANALYZE`
        } else {
          await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${entity}`)
        }
        analysisResult = { message: `VACUUM ANALYZE completed for ${entity}` }
        break

      case 'reindex':
        // Rebuild indexes for better performance
        if (entity && entity !== 'all') {
          await prisma.$executeRawUnsafe(`REINDEX TABLE ${entity}`)
          analysisResult = { message: `Reindex completed for table ${entity}` }
        } else {
          return createStandardErrorResponse(
            'VALIDATION_ERROR', 
            'Specific table required for reindex operation', 
            400
          )
        }
        break

      default:
        return createStandardErrorResponse('VALIDATION_ERROR', 'Invalid action provided', 400)
    }

    return createApiResponse({
      analysis: analysisResult,
      analyzedAt: new Date().toISOString(),
      analyzedBy: session.user.id
    })

  } catch (error) {
    return handleApiError(error)
  }
}