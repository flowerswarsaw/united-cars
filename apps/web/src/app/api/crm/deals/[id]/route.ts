import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateDealSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deal = await dealRepository.get(params.id);
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
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
    const validated = updateDealSchema.parse(body);
    
    const deal = await dealRepository.update(params.id, validated);
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(deal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await dealRepository.remove(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}