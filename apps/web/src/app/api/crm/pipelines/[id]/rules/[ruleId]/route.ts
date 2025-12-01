import { NextRequest, NextResponse } from 'next/server';
import { ruleRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updatePipelineRuleSchema } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const rule = await ruleRepository.get(ruleId);

    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error: any) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updatePipelineRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if rule exists
    const existingRule = await ruleRepository.get(ruleId);
    if (!existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Update the rule
    const updatedRule = await ruleRepository.update(ruleId, body);

    if (!updatedRule) {
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(updatedRule);
  } catch (error: any) {
    console.error('Error updating rule:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    // Check if rule can be deleted (not a system rule)
    const canDelete = await ruleRepository.canDelete(ruleId);
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Cannot delete system rule' },
        { status: 403 }
      );
    }

    const deleted = await ruleRepository.remove(ruleId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
