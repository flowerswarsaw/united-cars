import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updatePipelineSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pipeline = await pipelineRepository.getWithStages(params.id);
    
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(pipeline);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updatePipelineSchema.parse(body);
    
    const pipeline = await pipelineRepository.update(params.id, validated);
    
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(pipeline);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await pipelineRepository.remove(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}