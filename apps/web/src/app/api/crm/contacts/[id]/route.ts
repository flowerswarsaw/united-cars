import { NextRequest, NextResponse } from 'next/server';
import { contactRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateContactSchema, UserRole } from '@united-cars/crm-core';
import { formatContactMethods } from '@/lib/phone-formatter';
import { formatContactMethodsEmails } from '@/lib/email-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Contact', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { id } = await params;
    const contact = await contactRepository.get(id);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // 3. Check tenant access
    if (contact.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // 4. Check assignment access for junior managers
    if (user.role === UserRole.JUNIOR_SALES_MANAGER) {
      const assignedTo = contact.responsibleUserId || contact.assigneeId;
      if (assignedTo !== user.id && contact.createdBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied - This contact is not assigned to you' },
          { status: 403 }
        );
      }
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
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Get existing contact
    const existingContact = await contactRepository.get(id);

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingContact.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // 3. Check update permission (includes assignment check)
    const assignedTo = existingContact.responsibleUserId || existingContact.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Contact', 'canUpdate', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();
    const validated = updateContactSchema.parse(body);

    // Don't allow empty contactMethods array - preserve existing if not provided or empty
    const updateData = { ...validated };
    if (!updateData.contactMethods || updateData.contactMethods.length === 0) {
      delete updateData.contactMethods;
    } else {
      // Format phone numbers in contact methods if present
      updateData.contactMethods = formatContactMethods(updateData.contactMethods);
      // Normalize emails in contact methods
      updateData.contactMethods = formatContactMethodsEmails(updateData.contactMethods);
    }

    // Normalize location fields if present
    if (updateData.country) {
      updateData.country = normalizeCountryCode(updateData.country);
    }
    if (updateData.state) {
      updateData.state = normalizeRegionCode(updateData.state);
    }
    if (updateData.zipCode || updateData.postalCode) {
      const postalCode = updateData.zipCode || updateData.postalCode;
      updateData.zipCode = normalizePostalCode(postalCode);
      delete updateData.postalCode; // Remove alternative field name
    }

    const contact = await contactRepository.update(id, {
      ...updateData,
      updatedBy: user.id
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
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
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Get existing contact
    const existingContact = await contactRepository.get(id);

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingContact.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // 3. Check delete permission (includes assignment check)
    const assignedTo = existingContact.responsibleUserId || existingContact.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Contact', 'canDelete', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const deleted = await contactRepository.remove(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
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