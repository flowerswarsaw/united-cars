import { NextRequest, NextResponse } from 'next/server';
import { crmUserRepository } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const currentUser = userOrError;

    // 2. Check if user has permission to update users (using ORGANISATION as closest match)
    const accessCheck = checkEntityAccess(currentUser, 'Organisation', 'canUpdate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    // 3. Get user ID from route params
    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 4. Prevent users from deactivating themselves
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot deactivate yourself' },
        { status: 400 }
      );
    }

    // 5. Verify the user exists and belongs to the same tenant
    const targetUser = await crmUserRepository.get(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.tenantId !== currentUser.tenantId) {
      return NextResponse.json(
        { error: 'Access denied: User belongs to a different tenant' },
        { status: 403 }
      );
    }

    // 6. Deactivate user and reassign entities
    const result = await crmUserRepository.deactivate(userId, currentUser.id);

    // 7. Save to persistent storage
    const { jsonPersistence } = await import('@united-cars/crm-mocks');
    await jsonPersistence.save();

    console.log(`✅ User deactivated: ${targetUser.displayName} (${userId})`);
    console.log(`   - Deals unassigned: ${result.dealsUnassigned}`);
    console.log(`   - Leads unassigned: ${result.leadsUnassigned}`);

    return NextResponse.json({
      success: true,
      user: result.user,
      stats: {
        dealsUnassigned: result.dealsUnassigned,
        leadsUnassigned: result.leadsUnassigned
      }
    });
  } catch (error: any) {
    console.error('Failed to deactivate user:', error);
    return NextResponse.json(
      {
        error: 'Failed to deactivate user',
        details: error.message
      },
      { status: 500 }
    );
  }
}
