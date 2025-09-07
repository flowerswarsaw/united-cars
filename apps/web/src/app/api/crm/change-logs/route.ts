import { NextRequest, NextResponse } from 'next/server'
import { ChangeTracker } from '@united-cars/crm-mocks'
import { EntityType } from '@united-cars/crm-core'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as EntityType
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Validate required parameters based on the query type
    if (entityType && entityId) {
      // Get changes for a specific entity
      if (!Object.values(EntityType).includes(entityType)) {
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        )
      }

      const changeLogs = await ChangeTracker.getEntityChangeHistory(entityType, entityId, limit)
      return NextResponse.json({ changeLogs })
    } else if (userId) {
      // Get changes by user
      const changeLogs = await ChangeTracker.getUserChangeHistory(userId, limit)
      return NextResponse.json({ changeLogs })
    } else {
      // Get recent changes across all entities
      const changeLogs = await ChangeTracker.getRecentChanges(limit)
      return NextResponse.json({ changeLogs })
    }
  } catch (error) {
    console.error('Error fetching change logs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch change logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}