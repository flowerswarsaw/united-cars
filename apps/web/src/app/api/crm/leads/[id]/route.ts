import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateLeadSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await leadRepository.get(params.id);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateLeadSchema.parse(body);
    
    const lead = await leadRepository.update(params.id, validated);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
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
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await leadRepository.remove(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
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