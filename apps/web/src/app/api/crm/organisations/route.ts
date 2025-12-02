import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { ContactMethodType, CustomFieldType, ORGANIZATION_TYPE_CONFIGS } from '@united-cars/crm-core';
import { formatContactMethods, formatPhoneForStorage } from '@/lib/phone-formatter';
import { formatContactMethodsEmails } from '@/lib/email-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';
import { getCRMUser, checkEntityAccess, filterByUserAccess } from '@/lib/crm-auth';

// Helper function to normalize phone numbers for comparison
// Strips all non-numeric characters to enable format-agnostic matching
const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove all non-digits
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/crm/organisations called');

    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) {
      console.log('❌ No user session found');
      return userOrError;
    }
    const user = userOrError;
    console.log('✅ User authenticated:', user.email, 'tenantId:', user.tenantId);

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Organisation', 'canRead');
    if (accessCheck instanceof NextResponse) {
      console.log('❌ User does not have read permission');
      return accessCheck;
    }

    // Apply filtering if needed
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const country = searchParams.get('country');
    const state = searchParams.get('state');
    const city = searchParams.get('city');

    let filteredOrgs = await organisationRepository.list();
    console.log('📊 Total organizations in repository:', filteredOrgs.length);

    // 3. Filter by tenantId
    filteredOrgs = filteredOrgs.filter(org => org.tenantId === user.tenantId);
    console.log('🔒 After tenantId filter:', filteredOrgs.length);

    // 4. Filter by user access (assignment-based for junior managers)
    filteredOrgs = filterByUserAccess(filteredOrgs, user, 'Organisation');
    console.log('👤 After user access filter:', filteredOrgs.length);

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
        org.country && org.country.toLowerCase() === country.toLowerCase()
      );
    }

    if (state) {
      filteredOrgs = filteredOrgs.filter(org =>
        org.state && org.state.toLowerCase() === state.toLowerCase()
      );
    }

    if (city) {
      filteredOrgs = filteredOrgs.filter(org =>
        org.city && org.city.toLowerCase() === city.toLowerCase()
      );
    }

    // Type-specific field filtering
    const typeFiltersParam = searchParams.get('typeFilters');
    if (typeFiltersParam && type) {
      try {
        const typeFilters = JSON.parse(typeFiltersParam);
        const typeConfig = ORGANIZATION_TYPE_CONFIGS[type];

        if (typeConfig && typeConfig.customFields) {
          filteredOrgs = filteredOrgs.filter(org => {
            // Check if all type-specific filters match
            return Object.entries(typeFilters).every(([fieldKey, filterValue]: [string, any]) => {
              // Find the field definition
              const fieldDef = typeConfig.customFields?.find(f => f.key === fieldKey);
              if (!fieldDef) return true; // Skip if field not found

              // Get the actual value from typeSpecificData (or customFields for backward compatibility)
              const actualValue = org.typeSpecificData?.[fieldKey] ?? org.customFields?.[fieldKey];

              // Handle different field types
              switch (fieldDef.type) {
                case CustomFieldType.SELECT:
                case CustomFieldType.TEXT: {
                  const filterVal = filterValue.value;
                  if (!filterVal) return true; // No filter set
                  if (actualValue === undefined || actualValue === null) return false;

                  // For TEXT, do case-insensitive partial match
                  if (fieldDef.type === CustomFieldType.TEXT) {
                    return String(actualValue).toLowerCase().includes(String(filterVal).toLowerCase());
                  }

                  // For SELECT, exact match
                  return String(actualValue) === String(filterVal);
                }

                case CustomFieldType.MULTISELECT: {
                  const filterVals = filterValue.values;
                  const matchMode = filterValue.matchMode || 'ANY';
                  if (!filterVals || filterVals.length === 0) return true; // No filter set
                  if (!Array.isArray(actualValue)) return false;

                  // ANY mode: at least one filter value must be in actualValue
                  if (matchMode === 'ANY') {
                    return filterVals.some((fv: string) => actualValue.includes(fv));
                  }

                  // ALL mode: all filter values must be in actualValue
                  return filterVals.every((fv: string) => actualValue.includes(fv));
                }

                case CustomFieldType.NUMBER: {
                  const min = filterValue.min;
                  const max = filterValue.max;
                  if (min === undefined && max === undefined) return true; // No filter set
                  if (actualValue === undefined || actualValue === null) return false;

                  const numValue = Number(actualValue);
                  if (isNaN(numValue)) return false;

                  if (min !== undefined && numValue < min) return false;
                  if (max !== undefined && numValue > max) return false;
                  return true;
                }

                case CustomFieldType.DATE: {
                  const from = filterValue.from;
                  const to = filterValue.to;
                  if (!from && !to) return true; // No filter set
                  if (!actualValue) return false;

                  const dateValue = new Date(actualValue);
                  if (isNaN(dateValue.getTime())) return false;

                  if (from) {
                    const fromDate = new Date(from);
                    if (dateValue < fromDate) return false;
                  }

                  if (to) {
                    const toDate = new Date(to);
                    // Set to end of day for inclusive comparison
                    toDate.setHours(23, 59, 59, 999);
                    if (dateValue > toDate) return false;
                  }

                  return true;
                }

                case CustomFieldType.BOOLEAN: {
                  const boolVal = filterValue.boolValue;
                  if (boolVal === null || boolVal === undefined) return true; // No filter set (Any)
                  if (actualValue === undefined || actualValue === null) return false;
                  return Boolean(actualValue) === Boolean(boolVal);
                }

                default:
                  return true; // Unknown type, don't filter
              }
            });
          });
        }
      } catch (error) {
        console.error('Failed to parse type filters:', error);
        // Continue without type filtering if parsing fails
      }
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
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check create permission
    const accessCheck = checkEntityAccess(user, 'Organisation', 'canCreate');
    if (accessCheck instanceof NextResponse) return accessCheck;

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

    // Separate typeSpecificData from customFields
    const typeSpecificFields = ['baseConsolidation', 'monthlyVolume', 'auctionsUsed', 'shippingPorts', 'destinationPorts', 'serviceTypes', 'transitTime'];
    const typeSpecificData: Record<string, any> = {};
    const customFields: Record<string, any> = {
      ...(body.industry ? { industry: body.industry } : {}),
      ...(body.size ? { size: body.size } : {})
    };

    // Split body.customFields into typeSpecificData and customFields
    if (body.customFields) {
      Object.entries(body.customFields).forEach(([key, value]) => {
        if (typeSpecificFields.includes(key)) {
          typeSpecificData[key] = value;
        } else {
          customFields[key] = value;
        }
      });
    }

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
      typeSpecificData: typeSpecificData,
      customFields: customFields,
      verified: false,
      // Add tenant and user tracking
      tenantId: user.tenantId,
      createdBy: user.id,
      updatedBy: user.id,
      // If no assignee specified, assign to creator
      responsibleUserId: body.responsibleUserId || user.id
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