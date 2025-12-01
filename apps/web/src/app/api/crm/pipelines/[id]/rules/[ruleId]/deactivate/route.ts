import { NextRequest, NextResponse } from 'next/server';
import { ruleRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const rule = await ruleRepository.deactivate(ruleId);

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
    console.error('Error deactivating rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate rule' },
      { status: 500 }
    );
  }
}
