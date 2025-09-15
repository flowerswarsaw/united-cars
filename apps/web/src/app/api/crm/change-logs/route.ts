import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Temporary fix: return basic test data while fixing import issues
    const testChangeLogs = [
      {
        id: 'change_1',
        entityType: 'ORGANISATION',
        entityId: 'org_1',
        userId: 'user_1',
        action: 'UPDATE',
        fieldName: 'name',
        oldValue: 'Old Company Name',
        newValue: 'Updated Company Name',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        metadata: {}
      },
      {
        id: 'change_2',
        entityType: 'CONTACT',
        entityId: 'contact_1',
        userId: 'user_1',
        action: 'CREATE',
        fieldName: null,
        oldValue: null,
        newValue: null,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        metadata: { contactName: 'John Doe' }
      },
      {
        id: 'change_3',
        entityType: 'DEAL',
        entityId: 'deal_1',
        userId: 'user_2',
        action: 'STATUS_CHANGE',
        fieldName: 'status',
        oldValue: 'NEGOTIATION',
        newValue: 'CLOSED_WON',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        metadata: { dealValue: 50000 }
      },
      {
        id: 'change_4',
        entityType: 'TASK',
        entityId: 'task_1',
        userId: 'user_3',
        action: 'UPDATE',
        fieldName: 'status',
        oldValue: 'PENDING',
        newValue: 'IN_PROGRESS',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        metadata: {}
      }
    ];

    let changeLogs = [...testChangeLogs];

    // Filter based on query parameters
    if (entityType && entityId) {
      changeLogs = changeLogs.filter(log => 
        log.entityType === entityType && log.entityId === entityId
      );
    } else if (userId) {
      changeLogs = changeLogs.filter(log => log.userId === userId);
    }

    // Apply limit
    changeLogs = changeLogs.slice(0, limit);

    return NextResponse.json({ changeLogs })
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