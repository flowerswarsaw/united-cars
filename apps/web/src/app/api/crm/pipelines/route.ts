import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createPipelineSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const pipelines = await pipelineRepository.list();
    
    // Include stages for each pipeline
    const pipelinesWithStages = await Promise.all(
      pipelines.map(p => pipelineRepository.getWithStages(p.id))
    );
    
    return NextResponse.json(pipelinesWithStages);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPipelineSchema.parse(body);
    
    const pipeline = await pipelineRepository.create(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}