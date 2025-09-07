import { NextRequest, NextResponse } from 'next/server';
import { customFieldRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const field = await customFieldRepository.updateFieldDef(id, body);
    
    if (!field) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update custom field' },
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
    const deactivated = await customFieldRepository.deactivateField(id);
    
    if (!deactivated) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to deactivate custom field' },
      { status: 500 }
    );
  }
}