import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createDealSchema } from '@united-cars/crm-core';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipeline = searchParams.get('pipeline');
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    
    let deals;
    if (pipeline) {
      deals = await dealRepository.getByPipelineAndStage(pipeline, stage || undefined);
    } else {
      deals = await dealRepository.list();
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
    const session = await getServerSessionFromRequest(request);
    const userId = session?.user?.id;
    
    const body = await request.json();
    const { pipelineId, stageId, ...dealData } = body;
    const validated = createDealSchema.parse(dealData);
    
    const deal = await dealRepository.create(validated, userId);
    
    // If pipelineId and optionally stageId provided, assign to stage
    if (pipelineId) {
      // Import pipeline repository to get first stage if no stageId provided
      const { pipelineRepository } = await import('@united-cars/crm-mocks');
      const pipeline = await pipelineRepository.getWithStages(pipelineId);
      
      if (pipeline) {
        const targetStageId = stageId || pipeline.stages?.[0]?.id;
        
        if (targetStageId) {
          // Create currentStages array with the target stage
          const { makeDealCurrentStage } = await import('@united-cars/crm-core');
          const currentStage = makeDealCurrentStage(deal.id, pipelineId, targetStageId);
          
          // Update the deal with currentStages
          const updatedDeal = await dealRepository.update(deal.id, {
            currentStages: [currentStage]
          }, userId);
          
          await jsonPersistence.save();
          return NextResponse.json(updatedDeal, { status: 201 });
        }
      }
    }
    
    await jsonPersistence.save();
    return NextResponse.json(deal, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}