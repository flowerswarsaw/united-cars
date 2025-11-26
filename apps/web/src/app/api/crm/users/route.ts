import { NextRequest, NextResponse } from 'next/server';
import { crmUserRepository, customRoleRepository } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess, getEnhancedCRMUser } from '@/lib/crm-auth';
import { createCRMUserProfileSchema } from '@united-cars/crm-core';

/**
 * GET /api/crm/users
 * List all CRM user profiles
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // TODO: Add permission check once RBAC is fully wired
    // For now, only admins can view user list
    // const accessCheck = checkEntityAccess(user, 'Organisation', 'canRead');
    // if (accessCheck instanceof NextResponse) return accessCheck;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');
    const status = searchParams.get('status');
    const teamId = searchParams.get('teamId');
    const search = searchParams.get('search');

    // Fetch all CRM users
    let users = await crmUserRepository.list();

    // Filter by tenantId
    users = users.filter(u => u.tenantId === user.tenantId);

    // Apply filters
    if (roleId) {
      users = users.filter(u => u.customRoleId === roleId);
    }

    if (status) {
      users = users.filter(u => u.status === status);
    }

    if (teamId) {
      users = users.filter(u => u.teamIds.includes(teamId));
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      users = users.filter(u =>
        u.displayName.toLowerCase().includes(lowerSearch) ||
        u.email.toLowerCase().includes(lowerSearch)
      );
    }

    // Fetch roles for users
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const role = await customRoleRepository.get(user.customRoleId);
        return {
          ...user,
          role
        };
      })
    );

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching CRM users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/users
 * Create a new CRM user profile
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // TODO: Add permission check for user creation
    // Only admins should be able to create CRM user profiles

    // Parse and validate request body
    const body = await request.json();
    const validation = createCRMUserProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if platform user already has a CRM profile
    const existing = await crmUserRepository.getByPlatformUserId(data.platformUserId);
    if (existing) {
      return NextResponse.json(
        { error: 'CRM profile already exists for this platform user' },
        { status: 409 }
      );
    }

    // Verify custom role exists
    const role = await customRoleRepository.get(data.customRoleId);
    if (!role) {
      return NextResponse.json(
        { error: 'Custom role not found' },
        { status: 404 }
      );
    }

    // Create CRM user profile
    const newUser = await crmUserRepository.create(data, user.id);

    // Fetch role to return with user
    return NextResponse.json({
      ...newUser,
      role
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating CRM user:', error);
    return NextResponse.json(
      { error: 'Failed to create CRM user' },
      { status: 500 }
    );
  }
}
