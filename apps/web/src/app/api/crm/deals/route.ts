import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const stageId = searchParams.get('stageId');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');

    let deals = await dealRepository.list();

    // Apply filtering
    if (pipelineId) {
      deals = deals.filter(deal => deal.pipelineId === pipelineId);
    }

    if (stageId) {
      deals = deals.filter(deal => deal.stageId === stageId);
    }

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