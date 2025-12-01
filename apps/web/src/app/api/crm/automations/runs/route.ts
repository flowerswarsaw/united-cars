/**
 * Automation Runs API
 *
 * GET /api/crm/automations/runs - List automation runs
 *   Query params:
 *   - workflowId: Filter by workflow ID
 *   - primaryEntityType: Filter by entity type (e.g., DEAL, TICKET)
 *   - primaryEntityId: Filter by entity ID (requires primaryEntityType)
 *   - limit: Max number of results (default: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { automationRunRepository } from '@united-cars/crm-mocks';
import { EntityType } from '@united-cars/crm-automation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');
    const primaryEntityType = searchParams.get('primaryEntityType');
    const primaryEntityId = searchParams.get('primaryEntityId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let runs;

    if (workflowId) {
      // Filter by workflow
      runs = await automationRunRepository.getByWorkflowId(workflowId, limit);
    } else if (primaryEntityType && primaryEntityId) {
      // Filter by entity (for showing runs on Deal/Ticket detail pages)
      runs = await automationRunRepository.getByEntityId(
        primaryEntityType as EntityType,
        primaryEntityId,
        limit
      );
    } else {
      // Get all runs (not efficient but ok for mock)
      // In production, this would be paginated and optimized
      const allRuns = automationRunRepository.toJSON();
      runs = allRuns.runs
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
        .slice(0, limit);
    }

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}
