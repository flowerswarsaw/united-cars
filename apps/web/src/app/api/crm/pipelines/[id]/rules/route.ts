import { NextRequest, NextResponse } from 'next/server';
import { ruleRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createPipelineRuleSchema } from '@united-cars/crm-core';
import { nanoid } from 'nanoid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pipelineId } = await params;

    // Get all rules for this pipeline (including global rules)
    const pipelineRules = await ruleRepository.getByPipeline(pipelineId);
    const globalRules = await ruleRepository.getGlobalRules();

    // Combine and sort by priority
    const allRules = [...pipelineRules, ...globalRules].sort(
      (a, b) => a.priority - b.priority
    );

    return NextResponse.json(allRules);
  } catch (error: any) {
    console.error('Error fetching pipeline rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline rules' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pipelineId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = createPipelineRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get existing rules to determine priority
    const existingRules = await ruleRepository.getByPipeline(pipelineId);
    const maxPriority = existingRules.reduce(
      (max, rule) => Math.max(max, rule.priority || 0),
      0
    );

    // Add conditions and actions IDs if not provided
    const conditions = (body.conditions || []).map((cond: any) => ({
      ...cond,
      id: cond.id || nanoid()
    }));

    const actions = (body.actions || []).map((action: any) => ({
      ...action,
      id: action.id || nanoid()
    }));

    // Create the rule
    const rule = await ruleRepository.create({
      name: body.name,
      description: body.description,
      pipelineId: pipelineId,
      isGlobal: body.isGlobal || false,
      trigger: body.trigger,
      triggerConfig: body.triggerConfig,
      conditions,
      actions,
      isActive: body.isActive !== undefined ? body.isActive : true,
      priority: body.priority || maxPriority + 1,
      executeOnce: body.executeOnce,
      cooldownMinutes: body.cooldownMinutes,
      isSystem: false, // User-created rules are never system rules
      isMigrated: false
    });

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pipeline rule:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create pipeline rule' },
      { status: 500 }
    );
  }
}
