import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { reorderStagesSchema } from '@united-cars/crm-core';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = reorderStagesSchema.parse(body);
    
    const success = await pipelineRepository.reorderStages(params.id, validated.stageIds);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reorder stages' },
        { status: 400 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message === 'Invalid stage IDs for pipeline') {
      return NextResponse.json(
        { error: 'Invalid stage IDs for pipeline' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to reorder stages' },
      { status: 500 }
    );
  }
}