import { NextRequest, NextResponse } from 'next/server';
import { contractRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

// GET /api/crm/contracts/:id - Get single contract
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const accessCheck = checkEntityAccess(user, 'Contract', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const contract = await contractRepository.get(params.id, user);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to fetch contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// PATCH /api/crm/contracts/:id - Update contract
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const contract = await contractRepository.get(params.id, user);
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const accessCheck = checkEntityAccess(user, 'Contract', 'canUpdate', contract.responsibleUserId);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    const updateData: any = {
      updatedBy: user.id
    };

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.effectiveDate !== undefined) updateData.effectiveDate = new Date(body.effectiveDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.dealId !== undefined) updateData.dealId = body.dealId;
    if (body.organisationId !== undefined) updateData.organisationId = body.organisationId;
    if (body.contactIds !== undefined) updateData.contactIds = body.contactIds;
    if (body.responsibleUserId !== undefined) updateData.responsibleUserId = body.responsibleUserId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.version !== undefined) updateData.version = body.version;
    if (body.fileId !== undefined) updateData.fileId = body.fileId;

    const result = await contractRepository.update(params.id, updateData, {
      user,
      reason: 'User updated contract'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors?.join(', ') || 'Failed to update contract' },
        { status: 400 }
      );
    }

    await jsonPersistence.save();

    console.log(`Updated contract: ${params.id}`);

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Failed to update contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/contracts/:id - Delete contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const contract = await contractRepository.get(params.id, user);
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const accessCheck = checkEntityAccess(user, 'Contract', 'canDelete', contract.responsibleUserId);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const success = await contractRepository.remove(params.id, {
      user,
      reason: 'User deleted contract'
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete contract' },
        { status: 400 }
      );
    }

    await jsonPersistence.save();

    console.log(`Deleted contract: ${params.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
