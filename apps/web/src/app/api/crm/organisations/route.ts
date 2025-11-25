import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { ContactMethodType } from '@united-cars/crm-core';
import { formatContactMethods, formatPhoneForStorage } from '@/lib/phone-formatter';
import { formatContactMethodsEmails } from '@/lib/email-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';

// Helper function to normalize phone numbers for comparison
// Strips all non-numeric characters to enable format-agnostic matching
const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove all non-digits
};

export async function GET(request: NextRequest) {
  try {
    // Apply filtering if needed
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const country = searchParams.get('country');

    let filteredOrgs = await organisationRepository.list();

    if (search) {
      const searchLower = search.toLowerCase();
      const normalizedSearch = normalizePhone(search);

      filteredOrgs = filteredOrgs.filter(org => {
        // Search in name
        if (org.name.toLowerCase().includes(searchLower)) return true;

        // Search in company ID
        if (org.companyId && org.companyId.toLowerCase().includes(searchLower)) return true;

        // Search in description
        if (org.description && org.description.toLowerCase().includes(searchLower)) return true;

        // Search in contact methods (emails and phones with normalization)
        if (org.contactMethods && org.contactMethods.length > 0) {
          const hasMatchingContact = org.contactMethods.some(cm => {
            if (!cm.value) return false;

            // For phone numbers, try both formatted and normalized matching
            if (cm.type === ContactMethodType.PHONE) {
              return cm.value.toLowerCase().includes(searchLower) ||
                     normalizePhone(cm.value).includes(normalizedSearch);
            }

            // For emails and other types, use standard case-insensitive matching
            return cm.value.toLowerCase().includes(searchLower);
          });
          if (hasMatchingContact) return true;
        }

        // Legacy fields for backward compatibility
        if (org.email && org.email.toLowerCase().includes(searchLower)) return true;
        if (org.phone) {
          // Apply same normalization logic to legacy phone field
          if (org.phone.toLowerCase().includes(searchLower) ||
              normalizePhone(org.phone).includes(normalizedSearch)) {
            return true;
          }
        }

        return false;
      });
    }
    
    if (type) {
      filteredOrgs = filteredOrgs.filter(org => org.type === type);
    }
    
    if (country) {
      filteredOrgs = filteredOrgs.filter(org => 
        org.country && org.country.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    return NextResponse.json(filteredOrgs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organisations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Format contact methods (normalize phone numbers and emails)
    let formattedContactMethods = body.contactMethods
      ? formatContactMethods(body.contactMethods)
      : [
          ...(body.email ? [{ id: `cm_${Date.now()}_1`, type: ContactMethodType.EMAIL, value: body.email, isPrimary: true }] : []),
          ...(body.phone ? [{ id: `cm_${Date.now()}_2`, type: ContactMethodType.PHONE, value: formatPhoneForStorage(body.phone), isPrimary: true }] : [])
        ];

    // Normalize emails in contact methods
    formattedContactMethods = formatContactMethodsEmails(formattedContactMethods);

    // Normalize country and region codes
    const normalizedCountry = body.country ? normalizeCountryCode(body.country) : '';
    const normalizedState = body.state ? normalizeRegionCode(body.state) : '';
    const normalizedPostalCode = body.zipCode || body.postalCode ? normalizePostalCode(body.zipCode || body.postalCode) : '';

    // Create the new organization object
    const orgData = {
      name: body.name || '',
      companyId: body.companyId || '',
      type: body.type || 'RETAIL_CLIENT',
      description: body.description || `${body.name} - ${body.type || 'Business'}`,
      website: body.website || '',
      address: body.address || '',
      city: body.city || '',
      state: normalizedState,
      zipCode: normalizedPostalCode,
      country: normalizedCountry,
      phone: body.phone ? formatPhoneForStorage(body.phone) : '',
      email: body.email || '',
      industry: body.industry || '',
      size: body.size || '',
      contactMethods: formattedContactMethods,
      socialMediaLinks: body.socialMediaLinks || [],
      customFields: body.customFields || {
        ...(body.industry ? { industry: body.industry } : {}),
        ...(body.size ? { size: body.size } : {})
      },
      verified: false
    };

    // Add to the repository
    const newOrg = await organisationRepository.create(orgData);

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`Created new organization: ${newOrg.name} (ID: ${newOrg.id})`);
    const allOrgs = await organisationRepository.list();
    console.log(`Total organizations in repository: ${allOrgs.length}`);

    return NextResponse.json(newOrg, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create organisation:', error);
    return NextResponse.json(
      { error: 'Failed to create organisation' },
      { status: 500 }
    );
  }
}