import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporary fix: return basic test data while fixing import issues
    const testActivities = [
      {
        id: 'activity_1',
        entityType: 'ORGANISATION',
        entityId: 'org_1',
        userId: 'user_1',
        type: 'UPDATE',
        title: 'Organisation updated',
        description: 'Updated organisation details',
        metadata: {},
        createdAt: new Date(Date.now() - 60000).toISOString(),
        updatedAt: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'activity_2',
        entityType: 'CONTACT',
        entityId: 'contact_1',
        userId: 'user_1',
        type: 'CREATE',
        title: 'Contact created',
        description: 'New contact added to system',
        metadata: {},
        createdAt: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'activity_3',
        entityType: 'DEAL',
        entityId: 'deal_1',
        userId: 'user_2',
        type: 'STATUS_CHANGE',
        title: 'Deal status changed',
        description: 'Deal moved to negotiation stage',
        metadata: {},
        createdAt: new Date(Date.now() - 180000).toISOString(),
        updatedAt: new Date(Date.now() - 180000).toISOString()
      }
    ];
    
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    
    let activities = testActivities;
    
    // Filter by entity type and id if provided
    if (entityType && entityId) {
      activities = activities.filter(a => a.entityType === entityType && a.entityId === entityId);
    }
    
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}