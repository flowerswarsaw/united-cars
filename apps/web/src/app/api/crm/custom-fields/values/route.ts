import { NextRequest, NextResponse } from 'next/server';
import { customFieldRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    
    if (!entityId) {
      return NextResponse.json(
        { error: 'entityId parameter is required' },
        { status: 400 }
      );
    }
    
    const values = await customFieldRepository.getValues(entityId);
    return NextResponse.json(values);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch custom field values' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldDefId, entityId, value } = body;
    
    if (!fieldDefId || !entityId) {
      return NextResponse.json(
        { error: 'fieldDefId and entityId are required' },
        { status: 400 }
      );
    }
    
    const fieldValue = await customFieldRepository.setValue(fieldDefId, entityId, value);
    await jsonPersistence.save();
    
    return NextResponse.json(fieldValue, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set custom field value' },
      { status: 500 }
    );
  }
}