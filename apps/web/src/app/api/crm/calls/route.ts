import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@united-cars/db';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';
import { formatPhoneForStorage } from '@/lib/phone-formatter';

/**
 * GET /api/crm/calls
 * List calls with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Call', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    // 3. Query parameters for filtering
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const organisationId = searchParams.get('organisationId');
    const dealId = searchParams.get('dealId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // 4. Query with filters and tenant isolation
    const calls = await prisma.call.findMany({
      where: {
        tenantId: user.tenantId,
        ...(contactId && { contactId }),
        ...(organisationId && { organisationId }),
        ...(dealId && { dealId }),
        ...(status && { status: status as any }),
        // Filter by user access (Junior managers see only their calls)
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
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

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
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check create permission
    const accessCheck = checkEntityAccess(user, 'Call', 'canCreate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    // 3. Validate required fields
    if (!body.phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // 4. Format phone to E.164
    let phoneNumber: string;
    try {
      phoneNumber = formatPhoneForStorage(body.phoneNumber);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid phone number format', details: error.message },
        { status: 400 }
      );
    }

    // 5. Create call log
    const call = await prisma.call.create({
      data: {
        tenantId: user.tenantId,
        crmUserId: user.id,
        phoneNumber,
        direction: 'OUTBOUND',
        status: 'QUEUED',
        contactId: body.contactId || null,
        organisationId: body.organisationId || null,
        dealId: body.dealId || null,
        notes: body.notes || null,
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

    return NextResponse.json(call, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create call:', error);
    return NextResponse.json(
      { error: 'Failed to create call', details: error.message },
      { status: 500 }
    );
  }
}
