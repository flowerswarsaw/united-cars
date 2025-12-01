/**
 * Automation Seed API
 *
 * POST /api/crm/automations/seed - Seed default automation workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { seedAutomationWorkflows, automationWorkflowRepository, jsonPersistence } from '@united-cars/crm-mocks';

const DEFAULT_TENANT = 'united-cars';

export async function POST(request: NextRequest) {
  try {
    // Seed the workflows
    await seedAutomationWorkflows();

    // Save to persistent storage
    await jsonPersistence.save();

    // Get all workflows
    const workflows = await automationWorkflowRepository.getAll(DEFAULT_TENANT);

    return NextResponse.json({
      success: true,
      message: `Seeded ${workflows.length} automation workflows`,
      workflows: workflows.map(w => ({ id: w.id, name: w.name, isActive: w.isActive })),
    });
  } catch (error: any) {
    console.error('Error seeding workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed workflows' },
      { status: 500 }
    );
  }
}
