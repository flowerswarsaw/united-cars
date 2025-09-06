import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createDealSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipeline = searchParams.get('pipeline');
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    
    let deals;
    if (pipeline) {
      deals = await dealRepository.getByPipelineAndStage(pipeline, stage || undefined);
    } else {
      deals = await dealRepository.list();
    }
    
    if (status) {
      deals = deals.filter(deal => deal.status === status);
    }
    
    if (contactId) {
      deals = deals.filter(deal => deal.contactId === contactId);
    }
    
    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createDealSchema.parse(body);
    
    const deal = await dealRepository.create(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(deal, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}