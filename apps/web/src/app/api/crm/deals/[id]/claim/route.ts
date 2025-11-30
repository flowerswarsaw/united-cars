import { NextRequest, NextResponse } from 'next/server';
import { dealRepository, activityRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';
import { Deal, ActivityType, EntityType, DealStatus } from '@united-cars/crm-core';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ClaimDealBody {
  pipelineId: string;
  stageId: string;
  note?: string;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check update permission (claiming updates existing deal)
    const accessCheck = checkEntityAccess(user, 'Deal', 'canUpdate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    // 3. Get deal ID from route params
    const params = await context.params;
    const dealId = params.id;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // 4. Parse request body for pipeline/stage selection
    const body: ClaimDealBody = await request.json();
    const { pipelineId, stageId, note } = body;

    if (!pipelineId || !stageId) {
      return NextResponse.json(
        { error: 'Pipeline ID and Stage ID are required' },
        { status: 400 }
      );
    }

    // 5. Get the deal to claim
    const deal = await dealRepository.get(dealId);
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // 6. Verify tenant access
    if (deal.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Access denied: Deal belongs to a different tenant' },
        { status: 403 }
      );
    }

    // 7. Verify deal is claimable (either unassigned or lost)
    const isUnassigned = !deal.responsibleUserId;
    const isLost = deal.status === DealStatus.LOST;

    if (!isUnassigned && !isLost) {
      return NextResponse.json(
        {
          error: 'Deal cannot be claimed',
          details: 'Only unassigned or lost deals can be claimed'
        },
        { status: 400 }
      );
    }

    // 8. Store original state for activity logging
    const previousStatus = deal.status;
    const previousOwner = deal.responsibleUserId;
    const claimedAt = new Date();
    const daysInStatus = deal.closeDate
      ? Math.floor((claimedAt.getTime() - new Date(deal.closeDate).getTime()) / (1000 * 60 * 60 * 24))
      : deal.unassignedAt
        ? Math.floor((claimedAt.getTime() - new Date(deal.unassignedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // 9. Get previous stage from deal's current stages or history
    const currentStageForPipeline = deal.currentStages?.find(cs => cs.pipelineId === pipelineId);
    const fromStageId = currentStageForPipeline?.stageId;

    // 10. Update deal fields (UPDATE, not CREATE)
    const updatedDeal = await dealRepository.update(
      dealId,
      {
        // Update ownership and status
        responsibleUserId: user.id,
        status: DealStatus.OPEN,

        // Clear lost/unassigned fields
        closeDate: undefined,
        lossReason: undefined,
        unassignedAt: undefined,
        unassignedReason: undefined,

        // Reset probability if was lost
        probability: isLost ? 50 : (deal.probability || 50),

        // Update stage tracking via moveStage method (this handles currentStages + stageHistory)
        // Note: We'll call moveStage separately to maintain proper history
      },
      user.id
    );

    // 11. Move deal to specified pipeline/stage (this creates proper stage history)
    const finalDeal = await dealRepository.moveStage(dealId, {
      pipelineId,
      toStageId: stageId,
      note: note || `Deal claimed from ${isLost ? 'lost' : 'unassigned'} status`,
      movedBy: user.id
    });

    if (!finalDeal) {
      throw new Error('Failed to move deal to pipeline/stage');
    }

    // 12. Log the claim activity
    await activityRepository.create({
      entityType: EntityType.DEAL,
      entityId: dealId,
      type: ActivityType.DEAL_CLAIMED,
      description: `Deal claimed by ${user.displayName} from ${isLost ? 'lost' : 'unassigned'} status and assigned to pipeline/stage`,
      userId: user.id,
      meta: {
        previousStatus,
        previousOwner,
        claimedBy: user.id,
        claimedByName: user.displayName,
        claimType: isLost ? 'lost' : 'unassigned',
        assignedToPipeline: pipelineId,
        assignedToStage: stageId,
        fromStageId,
        daysInStatus,
        note
      },
      tenantId: user.tenantId
    });

    // 13. Track changes for audit trail using ChangeTracker
    try {
      const { ChangeTracker } = await import('@united-cars/crm-mocks/src/change-tracker');
      await ChangeTracker.trackEntityChange(
        EntityType.DEAL,
        dealId,
        deal,           // Old entity
        finalDeal,      // New entity
        user.id,
        ActivityType.DEAL_CLAIMED,
        note,
        {
          userName: user.displayName,
          userEmail: user.email
        }
      );
    } catch (error) {
      console.warn('Failed to track deal claim changes:', error);
    }

    // 14. Save to persistent storage
    await jsonPersistence.save();

    console.log(`✅ Deal claimed: ${deal.title}`);
    console.log(`   - Deal ID: ${dealId}`);
    console.log(`   - Claimed by: ${user.displayName} (${user.id})`);
    console.log(`   - Claim type: ${isLost ? 'lost' : 'unassigned'}`);
    console.log(`   - Assigned to: Pipeline ${pipelineId}, Stage ${stageId}`);
    console.log(`   - Days in ${isLost ? 'lost' : 'unassigned'}: ${daysInStatus}`);

    return NextResponse.json({
      success: true,
      deal: finalDeal,
      previousStatus,
      claimType: isLost ? 'lost' : 'unassigned'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to claim deal:', error);
    return NextResponse.json(
      {
        error: 'Failed to claim deal',
        details: error.message
      },
      { status: 500 }
    );
  }
}
