import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { moveDealInputSchema } from '@united-cars/crm-core';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validated = moveDealInputSchema.parse(body);
    const { id } = await params;
    
    const deal = await dealRepository.moveStage(id, validated);
    
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
    
    if (error.message === 'Loss reason required for lost stage') {
      return NextResponse.json(
        { error: 'Loss reason required for lost stage' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to move deal' },
      { status: 500 }
    );
  }
}