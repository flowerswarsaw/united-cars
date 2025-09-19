import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(request: NextRequest) {
  try {
    const pipelines = await pipelineRepository.list();

    // Get pipeline stages for each pipeline
    const pipelinesWithStages = await Promise.all(
      pipelines.map(async (pipeline) => {
        const stages = await pipelineRepository.getStages(pipeline.id);
        return {
          ...pipeline,
          stages: stages.sort((a, b) => a.order - b.order)
        };
      })
    );

    return NextResponse.json(pipelinesWithStages);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing pipelines to determine order
    const existingPipelines = await pipelineRepository.list();
    const maxOrder = existingPipelines.reduce((max, p) => Math.max(max, p.order || 0), 0);

    // Create the pipeline using the repository with all required fields
    const pipeline = await pipelineRepository.create({
      name: body.name,
      description: body.description || '',
      isDefault: body.isDefault || false,
      order: maxOrder + 1,
      color: body.color || '#3B82F6',
      applicableTypes: body.applicableTypes || [],
      isTypeSpecific: body.isTypeSpecific || false
    });

    // Create stages if provided
    if (body.stages && body.stages.length > 0) {
      for (let i = 0; i < body.stages.length; i++) {
        const stageData = body.stages[i];
        await pipelineRepository.createStage(pipeline.id, {
          name: stageData.name,
          description: stageData.description,
          order: stageData.order || i,
          isClosing: stageData.isClosing || false,
          isLost: stageData.isLost || false
        });
      }
    }

    // Save to persistent storage
    await jsonPersistence.save();

    // Get the pipeline with stages
    const pipelineWithStages = await pipelineRepository.getWithStages(pipeline.id);

    return NextResponse.json(pipelineWithStages, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pipeline:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}