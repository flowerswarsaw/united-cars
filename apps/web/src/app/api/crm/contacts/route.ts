import { NextRequest, NextResponse } from 'next/server';
import { contactRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { formatContactMethods, formatPhoneForStorage } from '@/lib/phone-formatter';
import { formatContactMethodsEmails } from '@/lib/email-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';

// Helper function to normalize phone numbers for comparison
const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove all non-digits
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const organisationId = searchParams.get('organisationId');
    const type = searchParams.get('type');
    const country = searchParams.get('country');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const paginated = searchParams.get('paginated') === 'true';

    // Get contacts from repository
    let filteredContacts = await contactRepository.list();

    // Apply search filter (name, email, phone)
    if (search) {
      const searchLower = search.toLowerCase();
      const normalizedSearch = normalizePhone(search);

      filteredContacts = filteredContacts.filter(contact => {
        // Search in name and title
        if (contact.firstName.toLowerCase().includes(searchLower)) return true;
        if (contact.lastName.toLowerCase().includes(searchLower)) return true;
        if (contact.title && contact.title.toLowerCase().includes(searchLower)) return true;

        // Search in contact methods (emails and phones)
        if (contact.contactMethods && contact.contactMethods.length > 0) {
          const hasMatchingContact = contact.contactMethods.some(cm => {
            if (!cm.value) return false;

            // For phone numbers, try both formatted and normalized matching
            if (cm.type.includes('PHONE')) {
              return cm.value.toLowerCase().includes(searchLower) ||
                     normalizePhone(cm.value).includes(normalizedSearch);
            }

            // For emails, use standard case-insensitive matching
            return cm.value.toLowerCase().includes(searchLower);
          });
          if (hasMatchingContact) return true;
        }

        return false;
      });
    }

    // Filter by organization
    if (organisationId) {
      filteredContacts = filteredContacts.filter(contact => contact.organisationId === organisationId);
    }

    // Filter by contact type
    if (type) {
      filteredContacts = filteredContacts.filter(contact => contact.type === type);
    }

    // Filter by location
    if (country) {
      filteredContacts = filteredContacts.filter(contact =>
        contact.country && contact.country.toLowerCase() === country.toLowerCase()
      );
    }

    if (state) {
      filteredContacts = filteredContacts.filter(contact =>
        contact.state && contact.state.toLowerCase() === state.toLowerCase()
      );
    }

    if (city) {
      filteredContacts = filteredContacts.filter(contact =>
        contact.city && contact.city.toLowerCase() === city.toLowerCase()
      );
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

    // If no contact methods provided, build from individual email/phone fields
    if (contactMethods.length === 0) {
      // Add email if provided
      if (body.email) {
        contactMethods.push({
          id: `cm_${Date.now()}_email`,
          type: 'EMAIL',
          value: body.email,
          primary: true
        });
      }

      // Add phone if provided (independent of email)
      if (body.phone) {
        contactMethods.push({
          id: `cm_${Date.now()}_phone`,
          type: 'PHONE',
          value: body.phone,
          primary: !body.email // Primary only if no email exists
        });
      }
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