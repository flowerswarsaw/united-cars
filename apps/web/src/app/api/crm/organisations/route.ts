import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createOrganisationSchema } from '@united-cars/crm-core';
import { OrganizationScopedRepositoryFactory, createOrganizationContext } from '@united-cars/crm-mocks/organization-scoped-repositories';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user session for organization-scoped access
    const session = await getServerSessionFromRequest(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create organization context and scoped repository
    const context = createOrganizationContext(session.user)
    const factory = new OrganizationScopedRepositoryFactory(
      {} as any, organisationRepository, {} as any, {} as any, 
      {} as any, {} as any, {} as any, {} as any
    )
    const scopedOrgRepo = factory.createOrganisationRepository(context)

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const industry = searchParams.get('industry');
    const size = searchParams.get('size');
    const location = searchParams.get('location');
    const hasEmail = searchParams.get('hasEmail') === 'true';
    const hasPhone = searchParams.get('hasPhone') === 'true';
    const hasWebsite = searchParams.get('hasWebsite') === 'true';
    
    // Start with organization-scoped organisations
    let organisations = await scopedOrgRepo.findAll();
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      organisations = organisations.filter(org => 
        org.name.toLowerCase().includes(searchLower) ||
        (org.companyId && org.companyId.toLowerCase().includes(searchLower)) ||
        (org.industry && org.industry.toLowerCase().includes(searchLower)) ||
        (org.email && org.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply type filter
    if (type) {
      organisations = organisations.filter(org => org.type === type);
    }
    
    // Apply industry filter
    if (industry) {
      const industryLower = industry.toLowerCase();
      organisations = organisations.filter(org => 
        org.industry && org.industry.toLowerCase().includes(industryLower)
      );
    }
    
    // Apply size filter
    if (size) {
      const sizeLower = size.toLowerCase();
      organisations = organisations.filter(org => 
        org.size && org.size.toLowerCase().includes(sizeLower)
      );
    }
    
    // Apply location filter
    if (location) {
      const locationLower = location.toLowerCase();
      organisations = organisations.filter(org => 
        (org.city && org.city.toLowerCase().includes(locationLower)) ||
        (org.state && org.state.toLowerCase().includes(locationLower)) ||
        (org.country && org.country.toLowerCase().includes(locationLower))
      );
    }
    
    // Apply email filter
    if (hasEmail) {
      organisations = organisations.filter(org => org.email && org.email.trim().length > 0);
    }
    
    // Apply phone filter
    if (hasPhone) {
      organisations = organisations.filter(org => org.phone && org.phone.trim().length > 0);
    }
    
    // Apply website filter
    if (hasWebsite) {
      organisations = organisations.filter(org => org.website && org.website.trim().length > 0);
    }
    
    return NextResponse.json(organisations);
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
    const validated = createOrganisationSchema.parse(body);
    
    const organisation = await organisationRepository.create(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(organisation, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create organisation' },
      { status: 500 }
    );
  }
}