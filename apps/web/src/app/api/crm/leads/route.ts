import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@united-cars/crm-mocks';
import { formatPhoneForStorage } from '@/lib/phone-formatter';

export async function GET(request: NextRequest) {
  try {
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
    const allLeads = await leadRepository.list();
    let filteredLeads = allLeads;

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
    const body = await request.json();

    const newLead = await leadRepository.create({
      title: body.title,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone ? formatPhoneForStorage(body.phone) : body.phone,
      source: body.source,
      organisationId: body.organisationId,
      contactId: body.contactId,
      isTarget: body.isTarget || false,
      score: body.score,
      notes: body.notes,
      customFields: body.customFields || {},
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}