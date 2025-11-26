import { NextRequest, NextResponse } from 'next/server';
import { customRoleRepository } from '@united-cars/crm-mocks';
import { getCRMUser } from '@/lib/crm-auth';
import { updateCustomRoleSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;

    const role = await customRoleRepository.getWithStats(params.id);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const body = await request.json();
    const validation = updateCustomRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updated = await customRoleRepository.update(params.id, validation.data, user.id);
    if (!updated) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;

    const canDelete = await customRoleRepository.canDelete(params.id);
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Cannot delete system roles or roles with active users' },
        { status: 400 }
      );
    }

    const deleted = await customRoleRepository.remove(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete role' }, { status: 500 });
  }
}
