import { NextRequest, NextResponse } from 'next/server';
import { updateDealSchema, UserRole } from '@united-cars/crm-core';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

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

    console.log(`Updating deal ${id} with:`, body);

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

    console.log(`✅ Deal ${id} updated successfully`);
    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    console.error('❌ Failed to update deal:', error);
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

    console.log(`✅ Deal ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to delete deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}