import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createLeadSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isTarget = searchParams.get('isTarget');
    const source = searchParams.get('source');
    const pipelineId = searchParams.get('pipelineId');
    const organisationId = searchParams.get('organisationId');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    
    // Start with all leads
    let leads = await leadRepository.list();
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead => 
        lead.title.toLowerCase().includes(searchLower) ||
        (lead.firstName && lead.firstName.toLowerCase().includes(searchLower)) ||
        (lead.lastName && lead.lastName.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
        (lead.notes && lead.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply target filter
    if (isTarget !== null) {
      leads = leads.filter(lead => lead.isTarget === (isTarget === 'true'));
    }
    
    // Apply source filter
    if (source) {
      const sourceLower = source.toLowerCase();
      leads = leads.filter(lead => 
        lead.source && lead.source.toLowerCase().includes(sourceLower)
      );
    }
    
    // Apply pipeline filter
    if (pipelineId) {
      leads = leads.filter(lead => lead.pipelineId === pipelineId);
    }
    
    // Apply organisation filter
    if (organisationId) {
      leads = leads.filter(lead => lead.organisationId === organisationId);
    }
    
    // Apply score range filters
    if (minScore) {
      const min = parseInt(minScore);
      if (!isNaN(min)) {
        leads = leads.filter(lead => lead.score && lead.score >= min);
      }
    }
    
    if (maxScore) {
      const max = parseInt(maxScore);
      if (!isNaN(max)) {
        leads = leads.filter(lead => lead.score && lead.score <= max);
      }
    }
    
    return NextResponse.json(leads);
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
    const validated = createLeadSchema.parse(body);
    
    const lead = await leadRepository.create(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}