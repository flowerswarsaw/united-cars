import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ensure we have the latest data
    await jsonPersistence.load();

    const pipeline = await pipelineRepository.get(id);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Get pipeline stages
    const stages = await pipelineRepository.getStages(id);
    const pipelineWithStages = {
      ...pipeline,
      stages: stages.sort((a, b) => a.order - b.order)
    };

    return NextResponse.json(pipelineWithStages);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Ensure we have the latest data
    await jsonPersistence.load();

    const pipeline = await pipelineRepository.get(id);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Update the pipeline
    const updatedPipeline = await pipelineRepository.update(id, {
      name: body.name ?? pipeline.name,
      description: body.description ?? pipeline.description,
      color: body.color ?? pipeline.color,
      isDefault: body.isDefault ?? pipeline.isDefault,
      isActive: body.isActive ?? (pipeline as any).isActive ?? true,
      order: body.order ?? pipeline.order,
      applicableTypes: body.applicableTypes ?? pipeline.applicableTypes,
      isTypeSpecific: body.isTypeSpecific ?? pipeline.isTypeSpecific
    });

    // Save to persistent storage
    await jsonPersistence.save();

    // Get stages and return complete pipeline
    const stages = await pipelineRepository.getStages(id);
    const pipelineWithStages = {
      ...updatedPipeline,
      stages: stages.sort((a, b) => a.order - b.order)
    };

    return NextResponse.json(pipelineWithStages);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
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

    // Ensure we have the latest data
    await jsonPersistence.load();

    const pipeline = await pipelineRepository.get(id);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Delete the pipeline
    const success = await pipelineRepository.remove(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete pipeline' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}