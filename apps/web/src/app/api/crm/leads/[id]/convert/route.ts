import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { convertLeadInputSchema, UserRole } from '@united-cars/crm-core';
import { getCRMUser } from '@/lib/crm-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;

  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const paramsData = await params;
    id = paramsData.id;
    console.log(`Attempting to convert lead with ID: ${id}`);

    // Get the lead
    const lead = await leadRepository.get(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 2. Check tenant access
    if (lead.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 3. Check if user can update this lead (must be assigned to them or be admin/senior)
    const assignedTo = lead.responsibleUserId || lead.assigneeId;
    if (user.role === UserRole.JUNIOR_SALES_MANAGER && assignedTo !== user.id && lead.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Access denied - This lead is not assigned to you' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = convertLeadInputSchema.parse(body);

    // 4. Convert lead with user tracking
    // The repository will handle preserving the assignment from lead to deal
    const deal = await leadRepository.convertToDeal(id, {
      ...validated,
      // Preserve assignment or use converting user
      responsibleUserId: lead.responsibleUserId || user.id
    });

    await jsonPersistence.save();

    console.log(`Successfully converted lead: ${id} to deal: ${deal.id}`);
    return NextResponse.json(deal, { status: 201 });
  } catch (error: any) {
    console.error(`Error converting lead ${id || 'unknown'}:`, error.message);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Lead not found') {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Only target leads can be converted to deals') {
      return NextResponse.json(
        { error: 'Only target leads can be converted to deals' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to convert lead' },
      { status: 500 }
    );
  }
}
