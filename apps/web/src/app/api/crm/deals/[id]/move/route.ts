import { NextRequest, NextResponse } from 'next/server';
import { moveDealInputSchema } from '@united-cars/crm-core';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    console.log(`Moving deal ${id} to stage:`, body);

    // Update deal with new stage/pipeline using CRM repository
    const updateData = {
      pipelineId: body.pipelineId,
      stageId: body.toStageId
    };

    const updatedDeal = await dealRepository.update(id, updateData);

    if (!updatedDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`✅ Deal ${id} moved to stage ${body.toStageId} in pipeline ${body.pipelineId}`);
    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    console.error('❌ Failed to move deal:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Loss reason required for lost stage') {
      return NextResponse.json(
        { error: 'Loss reason required for lost stage' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to move deal' },
      { status: 500 }
    );
  }
}