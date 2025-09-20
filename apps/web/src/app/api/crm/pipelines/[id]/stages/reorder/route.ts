import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pipelineId } = await params;
    const body = await request.json();

    // Ensure we have the latest data
    await jsonPersistence.load();

    // Check if pipeline exists
    const pipeline = await pipelineRepository.get(pipelineId);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Extract stage IDs from the request body
    let stageIds: string[] = [];
    if (body.items) {
      // Format: [{ stageId: 'id1', order: 1 }, { stageId: 'id2', order: 2 }]
      stageIds = body.items
        .sort((a: any, b: any) => a.order - b.order)
        .map((item: any) => item.stageId);
    } else if (body.stageIds) {
      // Format: ['id1', 'id2', 'id3']
      stageIds = body.stageIds;
    } else {
      return NextResponse.json(
        { error: 'Missing stageIds or items in request body' },
        { status: 400 }
      );
    }

    // Reorder stages using the CRM repository
    const success = await pipelineRepository.reorderStages(pipelineId, stageIds);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reorder stages' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    // Get updated stages
    const updatedStages = await pipelineRepository.getStages(pipelineId);

    return NextResponse.json({
      stages: updatedStages.sort((a, b) => a.order - b.order),
      success: true
    });
  } catch (error: any) {
    console.error('Error reordering stages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder stages' },
      { status: 500 }
    );
  }
}