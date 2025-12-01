/**
 * Automation Run API - Individual Run
 *
 * GET /api/crm/automations/runs/[id] - Get run by ID with steps
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

    // Get run
    const run = await automationRunRepository.getById(id);

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    // Get steps for this run
    const steps = await automationRunRepository.getStepsByRunId(id);

    return NextResponse.json({
      ...run,
      steps,
    });
  } catch (error) {
    console.error('Error fetching run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch run' },
      { status: 500 }
    );
  }
}
