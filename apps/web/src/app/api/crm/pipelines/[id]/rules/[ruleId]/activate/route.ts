import { NextRequest, NextResponse } from 'next/server';
import { ruleRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const rule = await ruleRepository.activate(ruleId);

    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(rule);
  } catch (error: any) {
    console.error('Error activating rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate rule' },
      { status: 500 }
    );
  }
}
