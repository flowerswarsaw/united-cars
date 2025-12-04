import { NextRequest, NextResponse } from 'next/server';
import { callRepository, seedCalls } from '@united-cars/crm-mocks';
import { CallStatus, CallDirection } from '@united-cars/crm-core';

const DEFAULT_TENANT_ID = 'united-cars';

// Track if calls have been seeded
let callsSeeded = false;

async function ensureCallsSeeded(tenantId: string) {
  if (callsSeeded) return;

  const existingCalls = await callRepository.getAll(tenantId);
  if (existingCalls.length === 0) {
    await seedCalls();
  }
  callsSeeded = true;
}

// Mock user for development (in production, this would come from auth)
function getMockUser(request: NextRequest) {
  // For now, return a mock admin user
  return {
    id: 'admin-user-001',
    tenantId: DEFAULT_TENANT_ID,
    role: 'ADMIN',
    email: 'admin@united-cars.com',
    displayName: 'Admin User'
  };
}

/**
 * GET /api/crm/calls
 * List calls with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = getMockUser(request);

    // Ensure calls are seeded on first access
    await ensureCallsSeeded(user.tenantId);

    const { searchParams } = new URL(request.url);

    const contactId = searchParams.get('contactId');
    const organisationId = searchParams.get('organisationId');
    const dealId = searchParams.get('dealId');
    const status = searchParams.get('status') as CallStatus | null;
    const crmUserId = searchParams.get('crmUserId');
    const limit = searchParams.get('limit');

    let calls;

    if (contactId) {
      calls = await callRepository.getByContact(user.tenantId, contactId);
    } else if (organisationId) {
      calls = await callRepository.getByOrganisation(user.tenantId, organisationId);
    } else if (dealId) {
      calls = await callRepository.getByDeal(user.tenantId, dealId);
    } else if (crmUserId) {
      calls = await callRepository.getByUser(user.tenantId, crmUserId);
    } else if (status) {
      calls = await callRepository.getByStatus(user.tenantId, status);
    } else {
      calls = await callRepository.getRecent(user.tenantId, limit ? parseInt(limit) : 50);
    }

    return NextResponse.json(calls);
  } catch (error: any) {
    console.error('Failed to fetch calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/calls
 * Create a new call log
 */
export async function POST(request: NextRequest) {
  try {
    const user = getMockUser(request);
    const body = await request.json();

    // Validate required fields
    if (!body.phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const call = await callRepository.create({
      tenantId: user.tenantId,
      crmUserId: body.crmUserId || user.id,
      phoneNumber: body.phoneNumber,
      direction: body.direction || CallDirection.OUTBOUND,
      status: body.status || CallStatus.QUEUED,
      provider: body.provider || 'mock',
      contactId: body.contactId || undefined,
      organisationId: body.organisationId || undefined,
      dealId: body.dealId || undefined,
      notes: body.notes || undefined,
      providerCallId: body.providerCallId || undefined,
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create call:', error);
    return NextResponse.json(
      { error: 'Failed to create call', details: error.message },
      { status: 500 }
    );
  }
}
