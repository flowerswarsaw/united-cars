import { NextRequest, NextResponse } from 'next/server';
import { ruleRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { reorderRulesSchema } from '@united-cars/crm-core';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pipelineId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = reorderRulesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { ruleIds } = validationResult.data;

    // Reorder rules
    const success = await ruleRepository.reorderRules(ruleIds);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reorder rules' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    // Return updated rules
    const updatedRules = await ruleRepository.getByPipeline(pipelineId);

    return NextResponse.json(updatedRules);
  } catch (error: any) {
    console.error('Error reordering rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder rules' },
      { status: 500 }
    );
  }
}
