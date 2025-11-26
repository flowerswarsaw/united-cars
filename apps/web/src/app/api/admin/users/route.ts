import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth';
import { mockUserRepository } from '@/lib/mock-user-repository';
import { generateTemporaryPassword, hashPassword } from '@/lib/password-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract user session
    const session = await getServerSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if user is admin
    if (!session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    // 3. Get all users in the same organization (excluding DELETED)
    const users = await mockUserRepository.findMany({
      orgId: session.user.orgId,
      status: { not: 'DELETED' }
    });

    // 4. Format response (exclude sensitive data)
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Extract user session
    const session = await getServerSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if user is admin
    if (!session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { email, name, roleKeys } = body;

    if (!email || !roleKeys || roleKeys.length === 0) {
      return NextResponse.json({ error: 'Email and at least one role required' }, { status: 400 });
    }

    // 4. Check if user already exists
    const existingUser = await mockUserRepository.findUnique({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // 5. Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    // 6. Create user
    const newUser = await mockUserRepository.create({
      email,
      name: name || null,
      passwordHash,
      orgId: session.user.orgId,
      status: 'ACTIVE',
      roles: roleKeys
    });

    // 7. Return user with temporary password (ONLY shown once!)
    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
        roles: newUser.roles,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString()
      },
      temporaryPassword  // Only returned on creation, never again
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
