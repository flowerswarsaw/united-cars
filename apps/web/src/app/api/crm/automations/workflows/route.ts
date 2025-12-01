/**
 * Automation Workflows API
 *
 * GET /api/crm/automations/workflows - List all workflows
 * POST /api/crm/automations/workflows - Create a new workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { automationWorkflowRepository, jsonPersistence } from '@united-cars/crm-mocks';

// Default tenant for single-tenant deployment
const DEFAULT_TENANT = 'united-cars';

export async function GET(request: NextRequest) {
  try {
    const workflows = await automationWorkflowRepository.getAll(DEFAULT_TENANT);

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.trigger) {
      return NextResponse.json(
        { error: 'Trigger is required' },
        { status: 400 }
      );
    }

    if (!body.actions || body.actions.length === 0) {
      return NextResponse.json(
        { error: 'At least one action is required' },
        { status: 400 }
      );
    }

    // Create the workflow
    const workflow = await automationWorkflowRepository.create({
      tenantId: DEFAULT_TENANT,
      name: body.name,
      description: body.description,
      isActive: body.isActive ?? true,
      trigger: body.trigger,
      conditionGroups: body.conditionGroups || [],
      actions: body.actions,
      executeOnce: body.executeOnce,
      cooldownMinutes: body.cooldownMinutes,
      maxActionsPerRun: body.maxActionsPerRun,
      isSystem: body.isSystem,
      createdBy: body.createdBy || 'system',
      updatedBy: body.createdBy || 'system',
    });

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(workflow, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
