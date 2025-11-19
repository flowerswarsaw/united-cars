import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipeline = searchParams.get('pipeline');
    const pipelineId = searchParams.get('pipelineId') || pipeline;
    const stage = searchParams.get('stage');
    const stageId = searchParams.get('stageId') || stage;
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');

    // Use the repository method if filtering by pipeline/stage
    if (pipelineId) {
      const deals = await dealRepository.getByPipelineAndStage(pipelineId, stageId || undefined);

      // Apply additional filters
      let filteredDeals = deals;

      if (status) {
        filteredDeals = filteredDeals.filter(deal => deal.status === status);
      }

      if (contactId) {
        filteredDeals = filteredDeals.filter(deal => deal.contactId === contactId);
      }

      return NextResponse.json(filteredDeals);
    }

    // No pipeline filter - get all deals and apply other filters
    let deals = await dealRepository.list();

    if (status) {
      deals = deals.filter(deal => deal.status === status);
    }

    if (contactId) {
      deals = deals.filter(deal => deal.contactId === contactId);
    }

    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Deal creation request received:', JSON.stringify(body, null, 2));

    // Create deal data using the CRM repository
    const dealData = {
      title: body.title || '',
      description: body.description || '',
      value: body.value || 0,
      currency: body.currency || 'USD',
      status: body.status || 'OPEN',
      pipelineId: body.pipelineId || '',
      stageId: body.stageId || '',
      contactId: body.contactId || null,
      organisationId: body.organisationId || null,
      assignedTo: body.assignedTo || null,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      probability: body.probability || 0,
      notes: body.notes || '',
      customFields: body.customFields || {}
    };

    const newDeal = await dealRepository.create(dealData);
    await jsonPersistence.save();

    console.log(`Created new deal: ${newDeal.title} (ID: ${newDeal.id})`);

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal', details: error.message },
      { status: 500 }
    );
  }
}