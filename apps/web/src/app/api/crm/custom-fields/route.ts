import { NextRequest, NextResponse } from 'next/server';
import { customFieldRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { z } from 'zod';
import { EntityType, CustomFieldType } from '@united-cars/crm-core';

const createFieldDefSchema = z.object({
  entityType: z.nativeEnum(EntityType),
  name: z.string().min(1),
  fieldKey: z.string().min(1),
  type: z.nativeEnum(CustomFieldType),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(),
  order: z.number()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    
    if (!entityType) {
      return NextResponse.json(
        { error: 'entityType parameter is required' },
        { status: 400 }
      );
    }
    
    const fields = await customFieldRepository.getFieldDefs(entityType as EntityType);
    return NextResponse.json(fields);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch custom fields' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createFieldDefSchema.parse(body);
    
    const field = await customFieldRepository.defineField(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(field, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create custom field' },
      { status: 500 }
    );
  }
}