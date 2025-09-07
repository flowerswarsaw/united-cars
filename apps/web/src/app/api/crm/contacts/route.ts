import { NextRequest, NextResponse } from 'next/server';
import { contactRepository, jsonPersistence, initializeData } from '@united-cars/crm-mocks';
import { createContactSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    // Ensure data is initialized before accessing repositories
    initializeData();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const organisationId = searchParams.get('organisationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    
    // Check if paginated request is requested
    const paginated = searchParams.get('paginated') === 'true';
    
    if (paginated) {
      // Use new paginated method
      const filter: any = {};
      if (organisationId) {
        filter.organisationId = organisationId;
      }
      
      const result = await contactRepository.listPaginated({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        filter: Object.keys(filter).length > 0 ? filter : undefined
      });
      
      return NextResponse.json(result);
    } else {
      // Legacy non-paginated method for backward compatibility
      let contacts = await contactRepository.list();
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        contacts = contacts.filter(contact => 
          contact.firstName.toLowerCase().includes(searchLower) ||
          contact.lastName.toLowerCase().includes(searchLower) ||
          (contact.title && contact.title.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply organisation filter
      if (organisationId) {
        contacts = contacts.filter(contact => contact.organisationId === organisationId);
      }
      
      return NextResponse.json(contacts);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure data is initialized before accessing repositories
    initializeData();
    const body = await request.json();
    const validated = createContactSchema.parse(body);
    
    const contact = await contactRepository.create(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}