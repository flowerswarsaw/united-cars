import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateStageSchema } from '@united-cars/crm-core';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validated = updateStageSchema.parse(body);
    const { id } = await params;
    
    const stage = await pipelineRepository.updateStage(id, validated);
    
    if (!stage) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(stage);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update stage' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await pipelineRepository.deleteStage(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Stage not found or cannot be deleted' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
