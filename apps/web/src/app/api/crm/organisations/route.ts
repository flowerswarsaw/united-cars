import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';

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
      filteredOrgs = filteredOrgs.filter(org => {
        // Search in name
        if (org.name.toLowerCase().includes(searchLower)) return true;

        // Search in company ID
        if (org.companyId && org.companyId.toLowerCase().includes(searchLower)) return true;

        // Search in description
        if (org.description && org.description.toLowerCase().includes(searchLower)) return true;

        // Search in contact methods (emails and phones)
        if (org.contactMethods && org.contactMethods.length > 0) {
          const hasMatchingContact = org.contactMethods.some(cm =>
            cm.value && cm.value.toLowerCase().includes(searchLower)
          );
          if (hasMatchingContact) return true;
        }

        // Legacy fields for backward compatibility
        if (org.email && org.email.toLowerCase().includes(searchLower)) return true;
        if (org.phone && org.phone.toLowerCase().includes(searchLower)) return true;

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

    // Create the new organization object
    const orgData = {
      name: body.name || '',
      companyId: body.companyId || '',
      type: body.type || 'RETAIL_CLIENT',
      description: body.description || `${body.name} - ${body.type || 'Business'}`,
      website: body.website || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      zipCode: body.zipCode || '',
      country: body.country || '',
      phone: body.phone || '',
      email: body.email || '',
      industry: body.industry || '',
      size: body.size || '',
      contactMethods: body.contactMethods || [
        ...(body.email ? [{ id: `cm_${Date.now()}_1`, type: 'EMAIL_WORK', value: body.email, primary: true }] : []),
        ...(body.phone ? [{ id: `cm_${Date.now()}_2`, type: 'PHONE_WORK', value: body.phone, primary: true }] : [])
      ],
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