import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateLeadSchema, UserRole } from '@united-cars/crm-core';
import { formatPhoneForStorage } from '@/lib/phone-formatter';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Lead', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { id } = await params;
    const lead = await leadRepository.get(id);

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // 3. Check tenant access
    if (lead.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // 4. Check assignment access for junior managers
    if (user.role === UserRole.JUNIOR_SALES_MANAGER) {
      const assignedTo = lead.responsibleUserId || lead.assigneeId;
      if (assignedTo !== user.id && lead.createdBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied - This lead is not assigned to you' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Get existing lead
    const existingLead = await leadRepository.get(id);

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingLead.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // 3. Check update permission (includes assignment check)
    const assignedTo = existingLead.responsibleUserId || existingLead.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Lead', 'canUpdate', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();
    const validated = updateLeadSchema.parse(body);

    // Format phone number if present
    const updateData = { ...validated };
    if (updateData.phone) {
      updateData.phone = formatPhoneForStorage(updateData.phone);
    }

    const lead = await leadRepository.update(id, {
      ...updateData,
      updatedBy: user.id
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    await jsonPersistence.save();
    return NextResponse.json(lead);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Get existing lead
    const existingLead = await leadRepository.get(id);

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingLead.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // 3. Check delete permission (includes assignment check)
    const assignedTo = existingLead.responsibleUserId || existingLead.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Lead', 'canDelete', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const deleted = await leadRepository.remove(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
