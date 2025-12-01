import {
  Deal,
  DealStatus,
  LossReason,
  TaskPriority,
  EntityType,
  Pipeline,
  Stage
} from '@united-cars/crm-core';
import { dealRepository } from '../repositories/deal-repository';
import { taskRepository } from '../repositories/task-repository';
import { pipelineRepository } from '../repositories/pipeline-repository';

export interface ActionExecutorContext {
  deal: Deal;
  pipeline: Pipeline;
  stage?: Stage;
  metadata?: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================================================
// DEAL STATUS ACTIONS
// ============================================================================

/**
 * Mark deal as won
 */
export async function executeMarkWon(
  context: ActionExecutorContext
): Promise<ActionResult> {
  try {
    const updatedDeal = await dealRepository.closeWon(context.deal.id);

    if (!updatedDeal) {
      throw new Error('Failed to mark deal as won');
    }

    return {
      success: true,
      data: { dealId: updatedDeal.id, status: updatedDeal.status }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mark deal as lost
 */
export async function executeMarkLost(
  context: ActionExecutorContext,
  parameters: {
    lossReason?: LossReason;
  }
): Promise<ActionResult> {
  try {
    const reason = parameters.lossReason || LossReason.OTHER;
    const updatedDeal = await dealRepository.markLost(context.deal.id, reason);

    if (!updatedDeal) {
      throw new Error('Failed to mark deal as lost');
    }

    return {
      success: true,
      data: { dealId: updatedDeal.id, status: updatedDeal.status, lossReason: reason }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// DEAL MOVEMENT ACTIONS
// ============================================================================

/**
 * Move deal to a specific stage in current pipeline
 */
export async function executeMoveToStage(
  context: ActionExecutorContext,
  parameters: {
    stageId: string;
    note?: string;
  }
): Promise<ActionResult> {
  try {
    if (!parameters.stageId) {
      throw new Error('stageId is required for MOVE_TO_STAGE action');
    }

    const updatedDeal = await dealRepository.moveStage(context.deal.id, {
      pipelineId: context.pipeline.id,
      toStageId: parameters.stageId,
      note: parameters.note
    });

    if (!updatedDeal) {
      throw new Error('Failed to move deal to stage');
    }

    return {
      success: true,
      data: { dealId: updatedDeal.id, stageId: parameters.stageId }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Spawn a new deal in a different pipeline
 */
export async function executeSpawnInPipeline(
  context: ActionExecutorContext,
  parameters: {
    pipelineId: string;
    targetStageId?: string;
    copyFields?: string[];
  }
): Promise<ActionResult> {
  try {
    if (!parameters.pipelineId) {
      throw new Error('pipelineId is required for SPAWN_IN_PIPELINE action');
    }

    // Get target pipeline
    const targetPipeline = await pipelineRepository.getWithStages(parameters.pipelineId);
    if (!targetPipeline || !targetPipeline.stages) {
      throw new Error('Target pipeline not found or has no stages');
    }

    // Determine target stage (use provided or first stage)
    const targetStageId =
      parameters.targetStageId ||
      targetPipeline.stages.sort((a, b) => a.order - b.order)[0]?.id;

    if (!targetStageId) {
      throw new Error('Could not determine target stage');
    }

    // Create new deal in target pipeline
    const newDeal = await dealRepository.create({
      title: `${context.deal.title} (Auto-spawned)`,
      amount: context.deal.amount,
      currency: context.deal.currency,
      organisationId: context.deal.organisationId,
      contactId: context.deal.contactId,
      status: DealStatus.OPEN,
      probability: context.deal.probability,
      notes: `Auto-spawned from deal #${context.deal.id}`,
      tags: context.deal.tags,
      responsibleUserId: context.deal.responsibleUserId,
      originalDealId: context.deal.id // Link to original deal
    });

    // Move to target stage
    await dealRepository.moveStage(newDeal.id, {
      pipelineId: parameters.pipelineId,
      toStageId: targetStageId,
      note: 'Auto-spawned by pipeline rule'
    });

    // Update original deal to reference the spawned deal
    await dealRepository.update(context.deal.id, {
      notes: `${context.deal.notes || ''}\n\nSpawned deal #${newDeal.id} in ${targetPipeline.name} pipeline`
    });

    return {
      success: true,
      data: {
        originalDealId: context.deal.id,
        newDealId: newDeal.id,
        targetPipelineId: parameters.pipelineId,
        targetStageId
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// FIELD OPERATIONS
// ============================================================================

/**
 * Require a specific field to be filled
 * (Validation action - doesn't modify data, returns validation error)
 */
export async function executeRequireField(
  context: ActionExecutorContext,
  parameters: {
    fieldName: string;
  }
): Promise<ActionResult> {
  try {
    if (!parameters.fieldName) {
      throw new Error('fieldName is required for REQUIRE_FIELD action');
    }

    const fieldValue = (context.deal as any)[parameters.fieldName];

    if (
      fieldValue === null ||
      fieldValue === undefined ||
      fieldValue === ''
    ) {
      return {
        success: false,
        error: `Field '${parameters.fieldName}' is required but not set`
      };
    }

    return {
      success: true,
      data: { fieldName: parameters.fieldName, value: fieldValue }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Set a field to a specific value
 */
export async function executeSetFieldValue(
  context: ActionExecutorContext,
  parameters: {
    fieldName: string;
    fieldValue: any;
  }
): Promise<ActionResult> {
  try {
    if (!parameters.fieldName) {
      throw new Error('fieldName is required for SET_FIELD_VALUE action');
    }

    const updates: any = {};
    updates[parameters.fieldName] = parameters.fieldValue;

    const updatedDeal = await dealRepository.update(context.deal.id, updates);

    if (!updatedDeal) {
      throw new Error('Failed to update deal field');
    }

    return {
      success: true,
      data: {
        dealId: updatedDeal.id,
        fieldName: parameters.fieldName,
        value: parameters.fieldValue
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// NOTIFICATIONS & TASKS
// ============================================================================

/**
 * Send notification to user
 * (In mock implementation, we'll just log it)
 */
export async function executeSendNotification(
  context: ActionExecutorContext,
  parameters: {
    recipientUserId?: string;
    recipientTeamId?: string;
    message?: string;
  }
): Promise<ActionResult> {
  try {
    // In a real implementation, this would integrate with notification system
    // For now, we'll just return success

    console.log('[NOTIFICATION]', {
      dealId: context.deal.id,
      dealTitle: context.deal.title,
      recipientUserId: parameters.recipientUserId,
      recipientTeamId: parameters.recipientTeamId,
      message: parameters.message || 'Deal status changed'
    });

    return {
      success: true,
      data: {
        dealId: context.deal.id,
        recipient: parameters.recipientUserId || parameters.recipientTeamId,
        message: parameters.message
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a task for assignee
 */
export async function executeCreateTask(
  context: ActionExecutorContext,
  parameters: {
    taskTitle: string;
    message?: string;
    taskPriority?: TaskPriority;
    taskDueInDays?: number;
    recipientUserId?: string;
  }
): Promise<ActionResult> {
  try {
    if (!parameters.taskTitle) {
      throw new Error('taskTitle is required for CREATE_TASK action');
    }

    const dueDate = parameters.taskDueInDays
      ? new Date(Date.now() + parameters.taskDueInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const assigneeId =
      parameters.recipientUserId || context.deal.responsibleUserId;

    const task = await taskRepository.create({
      title: parameters.taskTitle,
      description: parameters.message,
      status: 'TODO' as any,
      priority: parameters.taskPriority || TaskPriority.MEDIUM,
      dueDate,
      targetType: EntityType.DEAL,
      targetId: context.deal.id,
      assigneeId
    });

    return {
      success: true,
      data: {
        taskId: task.id,
        dealId: context.deal.id,
        assigneeId
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// ASSIGNMENT ACTIONS
// ============================================================================

/**
 * Assign deal to a specific user
 */
export async function executeAssignToUser(
  context: ActionExecutorContext,
  parameters: {
    recipientUserId: string;
  }
): Promise<ActionResult> {
  try {
    if (!parameters.recipientUserId) {
      throw new Error('recipientUserId is required for ASSIGN_TO_USER action');
    }

    const updatedDeal = await dealRepository.update(context.deal.id, {
      responsibleUserId: parameters.recipientUserId
    });

    if (!updatedDeal) {
      throw new Error('Failed to assign deal to user');
    }

    return {
      success: true,
      data: {
        dealId: updatedDeal.id,
        assignedTo: parameters.recipientUserId
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Assign deal to a team for claiming
 */
export async function executeAssignToTeam(
  context: ActionExecutorContext,
  parameters: {
    recipientTeamId: string;
  }
): Promise<ActionResult> {
  try {
    if (!parameters.recipientTeamId) {
      throw new Error('recipientTeamId is required for ASSIGN_TO_TEAM action');
    }

    // In mock implementation, we'll store team assignment in tags
    // In real implementation, this would be a proper relationship
    const tags = context.deal.tags || [];
    const teamTag = `team:${parameters.recipientTeamId}`;

    if (!tags.includes(teamTag)) {
      tags.push(teamTag);
    }

    const updatedDeal = await dealRepository.update(context.deal.id, {
      tags,
      responsibleUserId: undefined // Unassign from individual user
    });

    if (!updatedDeal) {
      throw new Error('Failed to assign deal to team');
    }

    return {
      success: true,
      data: {
        dealId: updatedDeal.id,
        teamId: parameters.recipientTeamId
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Unassign deal (for recovery workflow)
 */
export async function executeUnassignDeal(
  context: ActionExecutorContext
): Promise<ActionResult> {
  try {
    const updatedDeal = await dealRepository.update(context.deal.id, {
      responsibleUserId: undefined,
      unassignedAt: new Date(),
      unassignedReason: 'Auto-unassigned by pipeline rule'
    });

    if (!updatedDeal) {
      throw new Error('Failed to unassign deal');
    }

    return {
      success: true,
      data: {
        dealId: updatedDeal.id,
        unassignedAt: updatedDeal.unassignedAt
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
