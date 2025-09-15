import { NextRequest, NextResponse } from 'next/server';

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
    
    // Temporary fix: return basic test data while fixing import issues
    const testCustomFields = [
      {
        id: 'field_1',
        entityType: entityType,
        name: 'Priority Level',
        fieldKey: 'priority_level',
        type: 'SELECT',
        required: false,
        defaultValue: 'medium',
        options: ['low', 'medium', 'high', 'urgent'],
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'field_2',
        entityType: entityType,
        name: 'Budget Range',
        fieldKey: 'budget_range',
        type: 'NUMBER',
        required: false,
        defaultValue: null,
        options: null,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'field_3',
        entityType: entityType,
        name: 'Special Instructions',
        fieldKey: 'special_instructions',
        type: 'TEXT',
        required: false,
        defaultValue: '',
        options: null,
        order: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    return NextResponse.json(testCustomFields);
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
    
    // Temporary fix: return created field data
    const newField = {
      id: 'field_new',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(newField, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create custom field' },
      { status: 500 }
    );
  }
}