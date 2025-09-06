import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateOrganisationSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organisation = await organisationRepository.get(id);
    
    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(organisation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organisation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validated = updateOrganisationSchema.parse(body);
    const { id } = await params;
    
    const organisation = await organisationRepository.update(id, validated);
    
    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(organisation);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update organisation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await organisationRepository.remove(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete organisation' },
      { status: 500 }
    );
  }
}