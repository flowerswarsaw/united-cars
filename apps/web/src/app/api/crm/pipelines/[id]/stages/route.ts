import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createStageSchema } from '@united-cars/crm-core';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = createStageSchema.parse(body);
    
    const stage = await pipelineRepository.createStage(params.id, validated);
    await jsonPersistence.save();
    
    return NextResponse.json(stage, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message === 'Pipeline not found') {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}