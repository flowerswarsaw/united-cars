import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence, dealEvents } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess, filterByUserAccess } from '@/lib/crm-auth';
import { broadcastDealCreated } from '@/lib/crm-events';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Deal', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { searchParams } = new URL(request.url);
    const pipeline = searchParams.get('pipeline');
    const pipelineId = searchParams.get('pipelineId') || pipeline;
    const stage = searchParams.get('stage');
    const stageId = searchParams.get('stageId') || stage;
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');

    // Use the repository method if filtering by pipeline/stage
    let deals;
    if (pipelineId) {
      deals = await dealRepository.getByPipelineAndStage(pipelineId, stageId || undefined);
    } else {
      deals = await dealRepository.list();
    }

    // 3. Filter by tenantId
    deals = deals.filter(deal => deal.tenantId === user.tenantId);

    // 4. Filter by user access (assignment-based for junior managers)
    deals = filterByUserAccess(deals, user, 'Deal');

    // 5. Apply additional filters
    if (status) {
      deals = deals.filter(deal => deal.status === status);
    }

    if (contactId) {
      deals = deals.filter(deal => deal.contactId === contactId);
    }

    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check create permission
    const accessCheck = checkEntityAccess(user, 'Deal', 'canCreate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    // 3. Create deal data with tenant and user tracking
    const dealData = {
      title: body.title || '',
      description: body.description || '',
      value: body.value || 0,
      currency: body.currency || 'USD',
      status: body.status || 'OPEN',
      pipelineId: body.pipelineId || '',
      stageId: body.stageId || '',
      contactId: body.contactId || null,
      organisationId: body.organisationId || null,
      assignedTo: body.assignedTo || null,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      probability: body.probability || 0,
      notes: body.notes || '',
      customFields: body.customFields || {},
      // Add tenant and user tracking
      tenantId: user.tenantId,
      createdBy: user.id,
      updatedBy: user.id,
      // If no assignee specified, assign to creator
      responsibleUserId: body.responsibleUserId || user.id
    };

    const newDeal = await dealRepository.create(dealData);
    await jsonPersistence.save();

    // Emit automation event for deal creation
    await dealEvents.created(newDeal, user.tenantId);

    // Broadcast real-time update to connected clients
    broadcastDealCreated(newDeal, user.tenantId);

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal', details: error.message },
      { status: 500 }
    );
  }
}