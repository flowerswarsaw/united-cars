import { NextRequest, NextResponse } from 'next/server';
import { crmUserRepository, customRoleRepository } from '@united-cars/crm-mocks';
import { getCRMUser } from '@/lib/crm-auth';
import { updateCRMUserProfileSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;

    const user = await crmUserRepository.get(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const role = await customRoleRepository.get(user.customRoleId);
    const manager = user.managerId ? await crmUserRepository.get(user.managerId) : null;

    return NextResponse.json({ ...user, role, manager });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const currentUser = userOrError;

    const body = await request.json();
    const validation = updateCRMUserProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updated = await crmUserRepository.update(params.id, validation.data, currentUser.id);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const role = await customRoleRepository.get(updated.customRoleId);
    return NextResponse.json({ ...updated, role });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;

    const deleted = await crmUserRepository.remove(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
