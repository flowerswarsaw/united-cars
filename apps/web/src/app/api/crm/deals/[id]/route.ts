import { NextRequest, NextResponse } from 'next/server';
import { updateDealSchema, UserRole } from '@united-cars/crm-core';
import { dealRepository, jsonPersistence, dealEvents } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';
import { broadcastDealUpdated, broadcastDealWon, broadcastDealLost } from '@/lib/crm-events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Deal', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { id } = await params;

    const deal = await dealRepository.get(id);

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 3. Check tenant access
    if (deal.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 4. Check assignment access for junior managers
    if (user.role === UserRole.JUNIOR_SALES_MANAGER) {
      const assignedTo = deal.responsibleUserId || deal.assigneeId;
      if (assignedTo !== user.id && deal.createdBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied - This deal is not assigned to you' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Get existing deal
    const existingDeal = await dealRepository.get(id);

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingDeal.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 3. Check update permission (includes assignment check)
    const assignedTo = existingDeal.responsibleUserId || existingDeal.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Deal', 'canUpdate', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    // 4. Update the deal with user tracking
    const updatedDeal = await dealRepository.update(id, {
      ...body,
      updatedBy: user.id
    });

    if (!updatedDeal) {
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    // Build changes array for automation event
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    for (const key of Object.keys(body)) {
      if (existingDeal[key as keyof typeof existingDeal] !== body[key]) {
        changes.push({
          field: key,
          oldValue: existingDeal[key as keyof typeof existingDeal],
          newValue: body[key]
        });
      }
    }

    // Emit automation event for deal update
    if (changes.length > 0) {
      await dealEvents.updated(updatedDeal, changes, user.tenantId);
    }

    // Check for won/lost status changes
    if (body.status === 'WON' && existingDeal.status !== 'WON') {
      await dealEvents.won(updatedDeal, user.tenantId);
      broadcastDealWon(updatedDeal, user.tenantId);
    } else if (body.status === 'LOST' && existingDeal.status !== 'LOST') {
      await dealEvents.lost(updatedDeal, user.tenantId);
      broadcastDealLost(updatedDeal, body.lossReason, user.tenantId);
    } else if (changes.length > 0) {
      // Broadcast update for non-status changes
      const changesMap: Record<string, any> = {};
      changes.forEach(c => { changesMap[c.field] = { from: c.oldValue, to: c.newValue }; });
      broadcastDealUpdated(updatedDeal, changesMap, user.tenantId);
    }

    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Check if deal exists
    const currentDeal = await dealRepository.get(id);
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (currentDeal.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 3. Check delete permission (includes assignment check)
    const assignedTo = currentDeal.responsibleUserId || currentDeal.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Deal', 'canDelete', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    // Delete the deal using repository
    const success = await dealRepository.remove(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete deal' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}