import { NextRequest, NextResponse } from 'next/server';
import { contactRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createContactSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const organisationId = searchParams.get('organisationId');
    const hasEmail = searchParams.get('hasEmail') === 'true';
    const hasPhone = searchParams.get('hasPhone') === 'true';
    const location = searchParams.get('location');
    
    // Start with all contacts
    let contacts = await contactRepository.list();
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(contact => 
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
        (contact.phone && contact.phone.toLowerCase().includes(searchLower)) ||
        (contact.title && contact.title.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply organisation filter
    if (organisationId) {
      contacts = contacts.filter(contact => contact.organisationId === organisationId);
    }
    
    // Apply email filter
    if (hasEmail) {
      contacts = contacts.filter(contact => contact.email && contact.email.trim().length > 0);
    }
    
    // Apply phone filter
    if (hasPhone) {
      contacts = contacts.filter(contact => contact.phone && contact.phone.trim().length > 0);
    }
    
    // Apply location filter
    if (location) {
      const locationLower = location.toLowerCase();
      contacts = contacts.filter(contact => 
        (contact.city && contact.city.toLowerCase().includes(locationLower)) ||
        (contact.state && contact.state.toLowerCase().includes(locationLower)) ||
        (contact.country && contact.country.toLowerCase().includes(locationLower))
      );
    }
    
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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