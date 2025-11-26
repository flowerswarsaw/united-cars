import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth';
import { mockUserRepository } from '@/lib/mock-user-repository';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const user = await mockUserRepository.findFirst({
      id: params.id,
      orgId: session.user.orgId,
      status: { not: 'DELETED' }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, status, roleKeys } = body;

    // Verify user exists and belongs to same org
    const existingUser = await mockUserRepository.findFirst({
      id: params.id,
      orgId: session.user.orgId,
      status: { not: 'DELETED' }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const updatedUser = await mockUserRepository.update(
      { id: params.id },
      {
        name: name !== undefined ? name : existingUser.name,
        status: status || existingUser.status,
        roles: roleKeys || existingUser.roles
      }
    );

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      status: updatedUser.status,
      roles: updatedUser.roles,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Verify user exists and belongs to same org
    const user = await mockUserRepository.findFirst({
      id: params.id,
      orgId: session.user.orgId,
      status: { not: 'DELETED' }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete: Set status to DELETED
    await mockUserRepository.delete({ id: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
