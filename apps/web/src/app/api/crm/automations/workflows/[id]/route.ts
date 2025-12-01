/**
 * Automation Workflow API - Individual Workflow
 *
 * GET /api/crm/automations/workflows/[id] - Get workflow by ID
 * PUT /api/crm/automations/workflows/[id] - Update workflow (including isActive toggle)
 * DELETE /api/crm/automations/workflows/[id] - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { automationWorkflowRepository, jsonPersistence } from '@united-cars/crm-mocks';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const workflow = await automationWorkflowRepository.getById(id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if workflow exists
    const existing = await automationWorkflowRepository.getById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Prevent modification of system workflows (except isActive)
    if (existing.isSystem && Object.keys(body).some(key => key !== 'isActive')) {
      return NextResponse.json(
        { error: 'Cannot modify system workflow' },
        { status: 403 }
      );
    }

    // Update the workflow
    const updated = await automationWorkflowRepository.update(id, {
      ...body,
      updatedBy: body.updatedBy || 'system',
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if workflow exists
    const existing = await automationWorkflowRepository.getById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system workflows
    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system workflow' },
        { status: 403 }
      );
    }

    // Delete the workflow
    const deleted = await automationWorkflowRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
