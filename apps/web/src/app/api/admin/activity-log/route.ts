import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionFromRequest } from '@/lib/auth'
import { activityService, ActivityFilter } from '@united-cars/crm-mocks'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSessionFromRequest(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    const hasAdminAccess = session.user.roles.some(role => ['admin', 'super_admin'].includes(role))
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Handle different actions
    switch (action) {
      case 'stats':
        const organizationId = searchParams.get('organizationId') || undefined
        const stats = await activityService.getActivityStats(organizationId)
        return NextResponse.json(stats)

      default:
        // Default: Get activities with filtering
        const filter: ActivityFilter = {}
        
        if (searchParams.get('entityType')) {
          filter.entityType = searchParams.get('entityType')!
        }
        
        if (searchParams.get('activityType')) {
          filter.activityType = searchParams.get('activityType')!
        }
        
        if (searchParams.get('userId')) {
          filter.userId = searchParams.get('userId')!
        }
        
        if (searchParams.get('search')) {
          filter.search = searchParams.get('search')!
        }

        // Date filtering
        if (searchParams.get('dateFrom')) {
          filter.dateFrom = new Date(searchParams.get('dateFrom')!)
        }
        
        if (searchParams.get('dateTo')) {
          filter.dateTo = new Date(searchParams.get('dateTo')!)
        }

        // Handle date range shortcuts
        const dateRange = searchParams.get('dateRange')
        if (dateRange) {
          const now = new Date()
          switch (dateRange) {
            case '1day':
              filter.dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000)
              break
            case '7days':
              filter.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case '30days':
              filter.dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              break
            case '90days':
              filter.dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
              break
          }
        }

        // Non-admin users can only see activities from their organization
        if (!session.user.roles.includes('super_admin')) {
          filter.organizationId = session.user.orgId
        }

        // Pagination
        const offset = parseInt(searchParams.get('offset') || '0')
        const limit = parseInt(searchParams.get('limit') || '50')

        const result = await activityService.getActivities(filter, offset, limit)
        return NextResponse.json(result)
    }

  } catch (error) {
    console.error('Activity log API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSessionFromRequest(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'export':
        const filter: ActivityFilter = body.filter || {}
        
        // Non-admin users can only export activities from their organization
        if (!session.user.roles.includes('super_admin')) {
          filter.organizationId = session.user.orgId
        }

        const exportData = await activityService.exportActivities(filter)
        
        return NextResponse.json({
          data: exportData,
          filename: `activity-log-${new Date().toISOString().split('T')[0]}.json`
        })

      case 'cleanup':
        // Only super admins can perform cleanup
        if (!session.user.roles.includes('super_admin')) {
          return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
        }

        const { olderThan } = body
        if (!olderThan) {
          return NextResponse.json({ error: 'olderThan date is required' }, { status: 400 })
        }

        const deletedCount = await activityService.deleteOldActivities(new Date(olderThan))
        
        // Log the cleanup activity
        await activityService.logActivity({
          type: 'DELETE',
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          userRole: session.user.roles[0] || 'user',
          organizationId: session.user.orgId,
          description: `Cleaned up ${deletedCount} old activity log entries`,
          details: { deletedCount, olderThan },
          metadata: { source: 'web' }
        })

        return NextResponse.json({ deletedCount })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Activity log API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}