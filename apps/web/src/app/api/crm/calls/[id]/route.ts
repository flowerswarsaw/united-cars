import { NextRequest, NextResponse } from 'next/server';
import { callRepository } from '@united-cars/crm-mocks';
import { CallStatus } from '@united-cars/crm-core';

const DEFAULT_TENANT_ID = 'united-cars';

// Mock user for development (in production, this would come from auth)
function getMockUser(request: NextRequest) {
  return {
    id: 'admin-user-001',
    tenantId: DEFAULT_TENANT_ID,
    role: 'ADMIN',
    email: 'admin@united-cars.com',
    displayName: 'Admin User'
  };
}

/**
 * GET /api/crm/calls/[id]
 * Get a single call by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getMockUser(request);
    const params = await context.params;
    const callId = params.id;

    const call = await callRepository.getById(callId);

    if (!call || call.tenantId !== user.tenantId) {
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
    const user = getMockUser(request);
    const params = await context.params;
    const callId = params.id;

    // Check if call exists
    const existingCall = await callRepository.getById(callId);

    if (!existingCall || existingCall.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Build update data
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.startedAt !== undefined) updateData.startedAt = new Date(body.startedAt);
    if (body.endedAt !== undefined) updateData.endedAt = new Date(body.endedAt);
    if (body.durationSec !== undefined) updateData.durationSec = body.durationSec;
    if (body.providerCallId !== undefined) updateData.providerCallId = body.providerCallId;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updatedCall = await callRepository.update(callId, updateData);

    if (!updatedCall) {
      return NextResponse.json(
        { error: 'Failed to update call' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedCall);
  } catch (error: any) {
    console.error('Failed to update call:', error);
    return NextResponse.json(
      { error: 'Failed to update call', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/calls/[id]
 * Delete a call record
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getMockUser(request);
    const params = await context.params;
    const callId = params.id;

    // Check if call exists
    const existingCall = await callRepository.getById(callId);

    if (!existingCall || existingCall.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    const deleted = await callRepository.delete(callId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete call' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete call:', error);
    return NextResponse.json(
      { error: 'Failed to delete call', details: error.message },
      { status: 500 }
    );
  }
}
