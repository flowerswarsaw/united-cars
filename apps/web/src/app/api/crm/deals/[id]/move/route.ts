import { NextRequest, NextResponse } from 'next/server';
import { moveDealInputSchema, ActivityType, EntityType } from '@united-cars/crm-core';
import { dealRepository, activityRepository, pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';

// B8 Fix: Simple in-memory lock to prevent concurrent deal moves
const dealMoveLocks = new Map<string, boolean>();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // B8 Fix: Check if deal is currently being moved
  if (dealMoveLocks.get(id)) {
    return NextResponse.json(
      { error: 'Deal is currently being moved by another operation. Please try again.' },
      { status: 409 }  // Conflict
    );
  }

  // B8 Fix: Acquire lock
  dealMoveLocks.set(id, true);

  try {
    const body = await request.json();

    console.log(`Moving deal ${id} to stage:`, body);

    // Ensure we have the latest data
    await jsonPersistence.load();

    // Get the current deal
    const currentDeal = await dealRepository.get(id);
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // B8 Fix: Optimistic locking - verify the deal hasn't been modified since client read it
    if (body.expectedStageId && currentDeal.stageId !== body.expectedStageId) {
      return NextResponse.json(
        {
          error: 'Deal has been modified by another user. Please refresh and try again.',
          currentStageId: currentDeal.stageId
        },
        { status: 409 }  // Conflict
      );
    }

    // Update deal with new stage/pipeline using simple update
    const updateData = {
      pipelineId: body.pipelineId,
      stageId: body.toStageId
    };

    const updatedDeal = await dealRepository.update(id, updateData, body.movedBy || 'system');

    if (!updatedDeal) {
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      );
    }

    // Manually log the stage move activity with better descriptions
    try {
      // Get pipeline and stage information for better descriptions
      let fromStageName = 'Unknown Stage';
      let toStageName = 'Unknown Stage';
      let pipelineName = 'Unknown Pipeline';

      try {
        const pipeline = await pipelineRepository.get(body.pipelineId);
        if (pipeline) {
          pipelineName = pipeline.name;
          const stages = await pipelineRepository.getStages(body.pipelineId);

          const fromStage = stages?.find(s => s.id === currentDeal.stageId);
          const toStage = stages?.find(s => s.id === body.toStageId);

          if (fromStage) fromStageName = fromStage.name;
          if (toStage) toStageName = toStage.name;
        }
      } catch (pipelineError) {
        console.warn('Failed to get pipeline/stage names:', pipelineError);
        // Continue with default names
      }

      const description = fromStageName !== 'Unknown Stage'
        ? `Deal moved from "${fromStageName}" to "${toStageName}" in ${pipelineName} pipeline`
        : `Deal moved to "${toStageName}" in ${pipelineName} pipeline`;

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: id,
        type: ActivityType.STAGE_MOVED,
        description,
        userId: body.movedBy || 'system',
        meta: {
          fromStageId: currentDeal.stageId,
          fromStageName,
          toStageId: body.toStageId,
          toStageName,
          pipelineId: body.pipelineId,
          pipelineName,
          note: body.note,
          lossReason: body.lossReason
        }
      });
    } catch (activityError) {
      console.warn('Failed to log activity:', activityError);
      // Don't fail the request if activity logging fails
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

    return NextResponse.json(
      { error: 'Failed to move deal' },
      { status: 500 }
    );
  } finally {
    // B8 Fix: Always release the lock
    dealMoveLocks.delete(id);
  }
}