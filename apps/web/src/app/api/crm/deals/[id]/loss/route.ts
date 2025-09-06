import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { z } from 'zod';
import { LossReason } from '@united-cars/crm-core';

const lossReasonSchema = z.object({
  reason: z.nativeEnum(LossReason)
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = lossReasonSchema.parse(body);
    
    const deal = await dealRepository.markLost(params.id, validated.reason);
    
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
      { error: 'Failed to mark deal as lost' },
      { status: 500 }
    );
  }
}