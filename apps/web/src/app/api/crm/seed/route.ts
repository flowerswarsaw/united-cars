import { NextRequest, NextResponse } from 'next/server';
import {
  organisationRepository,
  organisationConnectionRepository,
  contactRepository,
  leadRepository,
  dealRepository,
  pipelineRepository,
  taskRepository,
  customFieldRepository,
  activityRepository
} from '@united-cars/crm-mocks';

export async function POST(request: NextRequest) {
  try {
    // Load the seed data
    const seedsModule = await import('@united-cars/crm-mocks/src/seeds');
    const {
      organisations,
      organisationConnections,
      contacts,
      leads,
      deals,
      tasks,
      customFieldDefs,
      customFieldValues,
      pipelines,
      dealerAcquisitionStages,
      dealerIntegrationStages,
      retailSalesStages,
      vendorOnboardingStages,
      auctionIntegrationStages
    } = seedsModule;

    // Clear existing data
    organisationRepository.fromJSON([]);
    organisationConnectionRepository.fromJSON([]);
    contactRepository.fromJSON([]);
    leadRepository.fromJSON([]);
    dealRepository.fromJSON([]);
    taskRepository.fromJSON([]);
    customFieldRepository.fromJSON({ fieldDefs: [], fieldValues: [] });
    activityRepository.fromJSON([]);
    pipelineRepository.fromJSON([]);

    // Load seed data into repositories
    organisationRepository.fromJSON(organisations || []);
    organisationConnectionRepository.fromJSON(organisationConnections || []);
    contactRepository.fromJSON(contacts || []);
    leadRepository.fromJSON(leads || []);
    dealRepository.fromJSON(deals || []);
    taskRepository.fromJSON(tasks || []);
    customFieldRepository.fromJSON({
      fieldDefs: customFieldDefs || [],
      fieldValues: customFieldValues || []
    });
    pipelineRepository.fromJSON(pipelines || []);

    // Load pipeline stages
    const allStages = [
      ...(dealerAcquisitionStages || []),
      ...(dealerIntegrationStages || []),
      ...(retailSalesStages || []),
      ...(vendorOnboardingStages || []),
      ...(auctionIntegrationStages || [])
    ];
    pipelineRepository.stagesFromJSON(allStages);

    // Get actual counts
    const seedResult = {
      organisations: organisations?.length || 0,
      organisationConnections: organisationConnections?.length || 0,
      contacts: contacts?.length || 0,
      deals: deals?.length || 0,
      leads: leads?.length || 0,
      tasks: tasks?.length || 0,
      pipelines: pipelines?.length || 0,
      stages: allStages?.length || 0,
      customFieldDefs: customFieldDefs?.length || 0,
      customFieldValues: customFieldValues?.length || 0
    };

    console.log('CRM data seeded successfully:', seedResult);

    // Import and save persistence
    const { jsonPersistence } = await import('@united-cars/crm-mocks');
    await jsonPersistence.save();
    console.log('✅ Data persisted to disk');

    return NextResponse.json({
      success: true,
      message: 'Data seeded successfully and persisted',
      seededCounts: seedResult
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}