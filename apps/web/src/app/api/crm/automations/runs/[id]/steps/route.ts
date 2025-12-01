/**
 * Automation Run Steps API
 *
 * GET /api/crm/automations/runs/[id]/steps - Get steps for a run
 */

import { NextRequest, NextResponse } from 'next/server';
import { automationRunRepository } from '@united-cars/crm-mocks';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const steps = await automationRunRepository.getStepsByRunId(id);
    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error fetching steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch steps' },
      { status: 500 }
    );
  }
}
