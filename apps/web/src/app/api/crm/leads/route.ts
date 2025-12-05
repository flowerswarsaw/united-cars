import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence, leadEvents } from '@united-cars/crm-mocks';
import { formatPhoneForStorage } from '@/lib/phone-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';
import { getCRMUser, checkEntityAccess, filterByUserAccess } from '@/lib/crm-auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Lead', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isTarget = searchParams.get('isTarget');
    const isArchived = searchParams.get('isArchived');
    const source = searchParams.get('source');
    const pipelineId = searchParams.get('pipelineId');
    const organisationId = searchParams.get('organisationId');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    // Get leads from repository
    let filteredLeads = await leadRepository.list();

    // 3. Filter by tenantId
    filteredLeads = filteredLeads.filter(lead => lead.tenantId === user.tenantId);

    // 4. Filter by user access (assignment-based for junior managers)
    filteredLeads = filterByUserAccess(filteredLeads, user, 'Lead');

    // Filter by archive status
    if (isArchived !== null) {
      const archived = isArchived === 'true';
      filteredLeads = filteredLeads.filter(lead => Boolean(lead.isArchived) === archived);
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead =>
        lead.firstName?.toLowerCase().includes(searchLower) ||
        lead.lastName?.toLowerCase().includes(searchLower) ||
        lead.title?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by target status
    if (isTarget !== null) {
      const target = isTarget === 'true';
      filteredLeads = filteredLeads.filter(lead => lead.isTarget === target);
    }

    // Filter by source
    if (source && source !== 'all') {
      filteredLeads = filteredLeads.filter(lead => lead.source === source);
    }

    // Filter by organisation
    if (organisationId && organisationId !== 'all') {
      filteredLeads = filteredLeads.filter(lead => lead.organisationId === organisationId);
    }

    // Filter by score range
    if (minScore) {
      const min = parseInt(minScore);
      if (!isNaN(min)) {
        filteredLeads = filteredLeads.filter(lead => lead.score && lead.score >= min);
      }
    }

    if (maxScore) {
      const max = parseInt(maxScore);
      if (!isNaN(max)) {
        filteredLeads = filteredLeads.filter(lead => lead.score && lead.score <= max);
      }
    }

    return NextResponse.json(filteredLeads);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
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
    const accessCheck = checkEntityAccess(user, 'Lead', 'canCreate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    // Normalize location fields
    const normalizedCountry = body.country ? normalizeCountryCode(body.country) : undefined;
    const normalizedState = body.state ? normalizeRegionCode(body.state) : undefined;
    const normalizedZipCode = body.zipCode ? normalizePostalCode(body.zipCode) : undefined;

    const newLead = await leadRepository.create({
      title: body.title,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone ? formatPhoneForStorage(body.phone) : body.phone,
      company: body.company,
      jobTitle: body.jobTitle,
      source: body.source,
      organisationId: body.organisationId,
      contactId: body.contactId,
      isTarget: body.isTarget || false,
      score: body.score,
      notes: body.notes,
      // Location fields (normalized)
      country: normalizedCountry,
      state: normalizedState,
      city: body.city,
      zipCode: normalizedZipCode,
      customFields: body.customFields || {},
      // Add tenant and user tracking
      tenantId: user.tenantId,
      createdBy: user.id,
      updatedBy: user.id,
      // If no assignee specified, assign to creator
      responsibleUserId: body.responsibleUserId || user.id
    });

    // Save to persistent storage
    await jsonPersistence.save();

    // Emit automation event for lead creation
    await leadEvents.created(newLead, user.tenantId);

    return NextResponse.json(newLead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}