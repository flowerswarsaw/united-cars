import { NextRequest, NextResponse } from 'next/server';
import { contactRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateContactSchema } from '@united-cars/crm-core';
import { formatContactMethods } from '@/lib/phone-formatter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contact = await contactRepository.get(id);
    
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validated = updateContactSchema.parse(body);
    const { id } = await params;

    // Don't allow empty contactMethods array - preserve existing if not provided or empty
    const updateData = { ...validated };
    if (!updateData.contactMethods || updateData.contactMethods.length === 0) {
      delete updateData.contactMethods;
    } else {
      // Format phone numbers in contact methods if present
      updateData.contactMethods = formatContactMethods(updateData.contactMethods);
    }

    const contact = await contactRepository.update(id, updateData);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    await jsonPersistence.save();
    return NextResponse.json(contact);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update contact', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await contactRepository.remove(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}