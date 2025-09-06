import { NextRequest, NextResponse } from 'next/server';
import { activityRepository } from '@united-cars/crm-mocks';
import { EntityType } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    
    let activities;
    if (entityType && entityId) {
      activities = await activityRepository.getByEntity(entityType as EntityType, entityId);
    } else {
      activities = await activityRepository.list();
    }
    
    // Sort by createdAt desc
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}