import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@united-cars/db';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

/**
 * GET /api/crm/calls/[id]
 * Get a single call by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Call', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    // 3. Get call ID from params
    const params = await context.params;
    const callId = params.id;

    // 4. Fetch call with tenant isolation
    const call = await prisma.call.findFirst({
      where: {
        id: callId,
        tenantId: user.tenantId,
        // Junior managers can only see their own calls
        ...(user.role === 'JUNIOR_SALES_MANAGER' && { crmUserId: user.id }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
    });

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(call);
  } catch (error: any) {
    console.error('Failed to fetch call:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/crm/calls/[id]
 * Update call status, duration, notes, etc.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check update permission
    const accessCheck = checkEntityAccess(user, 'Call', 'canUpdate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    // 3. Get call ID from params
    const params = await context.params;
    const callId = params.id;

    // 4. Check if call exists and user has access
    const existingCall = await prisma.call.findFirst({
      where: {
        id: callId,
        tenantId: user.tenantId,
        // Users can only update their own calls
        crmUserId: user.id,
      },
    });

    if (!existingCall) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Parse update data
    const body = await request.json();

    // Allowed update fields
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.startedAt !== undefined) updateData.startedAt = new Date(body.startedAt);
    if (body.endedAt !== undefined) updateData.endedAt = new Date(body.endedAt);
    if (body.durationSec !== undefined) updateData.durationSec = body.durationSec;
    if (body.providerCallId !== undefined) updateData.providerCallId = body.providerCallId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    // 6. Update call
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
    });

    return NextResponse.json(updatedCall);
  } catch (error: any) {
    console.error('Failed to update call:', error);
    return NextResponse.json(
      { error: 'Failed to update call', details: error.message },
      { status: 500 }
    );
  }
}
