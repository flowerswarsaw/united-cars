import { NextRequest, NextResponse } from 'next/server';
import { activityRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { EntityType } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    // Ensure we have the latest data
    await jsonPersistence.load();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as EntityType;
    const entityId = searchParams.get('entityId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // Filter by activity type

    let activities;

    // If entity type and ID provided, get activities for specific entity
    if (entityType && entityId) {
      activities = await activityRepository.getByEntity(entityType, entityId);
    } else {
      // Get all activities
      activities = await activityRepository.list();
    }

    // Filter by activity type if provided
    if (type && activities) {
      activities = activities.filter(activity => activity.type === type);
    }

    // Sort by created date (newest first)
    if (activities) {
      activities = activities.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedActivities = activities ? activities.slice(offset, offset + limit) : [];
    const total = activities ? activities.length : 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}