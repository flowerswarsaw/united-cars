import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { convertLeadInputSchema } from '@united-cars/crm-core';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = convertLeadInputSchema.parse(body);
    
    const deal = await leadRepository.convertToDeal(params.id, validated);
    await jsonPersistence.save();
    
    return NextResponse.json(deal, { status: 201 });
  } catch (error: any) {
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