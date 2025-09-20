import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function POST(
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

    // Get existing stages to determine order
    const existingStages = await pipelineRepository.getStages(pipelineId);
    const maxOrder = existingStages.reduce((max, s) => Math.max(max, s.order || 0), 0);

    // Create the stage
    const stage = await pipelineRepository.createStage(pipelineId, {
      name: body.name,
      description: body.description || '',
      color: body.color,
      order: body.order ?? (maxOrder + 1),
      isClosing: body.isClosing || false,
      isLost: body.isLost || false,
      wipLimit: body.wipLimit,
      slaTarget: body.slaTarget,
      slaUnit: body.slaUnit
    });

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(stage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create stage' },
      { status: 500 }
    );
  }
}