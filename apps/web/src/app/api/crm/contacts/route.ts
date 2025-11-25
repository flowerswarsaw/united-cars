import { NextRequest, NextResponse } from 'next/server';
import { contactRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { formatContactMethods, formatPhoneForStorage } from '@/lib/phone-formatter';
import { formatContactMethodsEmails } from '@/lib/email-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const organisationId = searchParams.get('organisationId');
    const paginated = searchParams.get('paginated') === 'true';

    // Get contacts from repository
    let filteredContacts = await contactRepository.list();

    // Apply filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact =>
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        (contact.title && contact.title.toLowerCase().includes(searchLower))
      );
    }

    if (organisationId) {
      filteredContacts = filteredContacts.filter(contact => contact.organisationId === organisationId);
    }

    if (paginated) {
      return NextResponse.json({
        data: filteredContacts,
        total: filteredContacts.length,
        page: 1,
        totalPages: 1
      });
    } else {
      return NextResponse.json(filteredContacts);
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
    const body = await request.json();

    // Log the incoming request data for debugging
    console.log('Contact creation request received:', JSON.stringify(body, null, 2));

    // Build contact methods array, ensuring at least one exists
    let contactMethods = body.contactMethods || [];

    // If no contact methods provided but email exists, create one
    if (contactMethods.length === 0 && body.email) {
      contactMethods.push({
        id: `cm_${Date.now()}_1`,
        type: 'EMAIL_WORK',
        value: body.email,
        primary: true
      });
    }

    // If still no contact methods but phone exists, create one
    if (contactMethods.length === 0 && body.phone) {
      contactMethods.push({
        id: `cm_${Date.now()}_1`,
        type: 'PHONE_WORK',
        value: body.phone,
        primary: true
      });
    }

    // If no contact methods at all, return a user-friendly error
    if (contactMethods.length === 0) {
      return NextResponse.json(
        { error: 'At least one contact method (email or phone) is required' },
        { status: 400 }
      );
    }

    // Format phone numbers in contact methods
    contactMethods = formatContactMethods(contactMethods);

    // Normalize emails in contact methods
    contactMethods = formatContactMethodsEmails(contactMethods);

    // Normalize country and region codes
    const normalizedCountry = body.country ? normalizeCountryCode(body.country) : '';
    const normalizedState = body.state ? normalizeRegionCode(body.state) : '';
    const normalizedPostalCode = body.zipCode || body.postalCode ? normalizePostalCode(body.zipCode || body.postalCode) : '';

    // Create contact data
    const contactData = {
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      type: body.type || 'SALES', // Default to SALES if not provided
      title: body.title || '',
      organisationId: body.organisationId || null,
      department: body.department || '',
      contactMethods: contactMethods,
      socialMediaLinks: body.socialMediaLinks || [],
      customFields: body.customFields || {},
      // Address fields (normalized)
      city: body.city || '',
      state: normalizedState,
      country: normalizedCountry,
      zipCode: normalizedPostalCode
    };

    // Add to the repository
    const newContact = await contactRepository.create(contactData);

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`Created new contact: ${newContact.firstName} ${newContact.lastName} (ID: ${newContact.id})`);

    return NextResponse.json(newContact, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact', details: error.message },
      { status: 500 }
    );
  }
}