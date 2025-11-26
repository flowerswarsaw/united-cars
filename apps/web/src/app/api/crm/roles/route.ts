import { NextRequest, NextResponse } from 'next/server';
import { customRoleRepository } from '@united-cars/crm-mocks';
import { getCRMUser } from '@/lib/crm-auth';
import { createCustomRoleSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const systemOnly = searchParams.get('system') === 'true';
    const customOnly = searchParams.get('custom') === 'true';

    let roles = await customRoleRepository.list();
    roles = roles.filter(r => r.tenantId === user.tenantId);

    if (activeOnly) roles = roles.filter(r => r.isActive);
    if (systemOnly) roles = roles.filter(r => r.isSystem);
    if (customOnly) roles = roles.filter(r => !r.isSystem);

    const rolesWithStats = await Promise.all(
      roles.map(async (role) => ({
        ...role,
        userCount: await customRoleRepository.getUserCount(role.id)
      }))
    );

    return NextResponse.json(rolesWithStats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const body = await request.json();
    const validation = createCustomRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const existing = await customRoleRepository.getByName(validation.data.name);
    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    }

    const newRole = await customRoleRepository.create(validation.data, user.id);
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
