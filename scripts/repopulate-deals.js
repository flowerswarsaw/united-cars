#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Path to the CRM data file
const crmDataPath = path.join(__dirname, '../apps/web/.crm-data/data.json');

async function populateDealsAndPipelines() {
  console.log('Starting CRM deals and pipelines population...');

  try {
    // Read existing CRM data
    const crmData = JSON.parse(fs.readFileSync(crmDataPath, 'utf8'));

    // Create pipelines
    const pipelines = [
      {
        id: 'pipeline-dealer',
        name: 'Dealer Pipeline',
        description: 'Main sales pipeline for dealer prospects',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'pipeline-integration',
        name: 'Integration Pipeline',
        description: 'Technical integration pipeline for existing dealers',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      }
    ];

    // Create stages for pipelines
    const stages = [
      // Dealer Pipeline stages
      {
        id: 'stage-da-prospect',
        name: 'Prospect',
        description: 'Initial prospect identification',
        pipelineId: 'pipeline-dealer',
        order: 1,
        probability: 10,
        color: '#94a3b8',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-da-qualified',
        name: 'Qualified',
        description: 'Qualified prospect with confirmed interest',
        pipelineId: 'pipeline-dealer',
        order: 2,
        probability: 25,
        color: '#3b82f6',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-da-proposal',
        name: 'Proposal',
        description: 'Proposal sent to prospect',
        pipelineId: 'pipeline-dealer',
        order: 3,
        probability: 50,
        color: '#f59e0b',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-da-negotiation',
        name: 'Negotiation',
        description: 'Active negotiation phase',
        pipelineId: 'pipeline-dealer',
        order: 4,
        probability: 75,
        color: '#f97316',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-da-won',
        name: 'Won',
        description: 'Deal successfully closed',
        pipelineId: 'pipeline-dealer',
        order: 5,
        probability: 100,
        color: '#10b981',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      // Integration Pipeline stages
      {
        id: 'stage-int-discovery',
        name: 'Discovery',
        description: 'Technical discovery and requirements gathering',
        pipelineId: 'pipeline-integration',
        order: 1,
        probability: 20,
        color: '#6366f1',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-int-integration',
        name: 'Integration',
        description: 'Active technical integration work',
        pipelineId: 'pipeline-integration',
        order: 2,
        probability: 60,
        color: '#8b5cf6',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-int-testing',
        name: 'Testing',
        description: 'Integration testing and validation',
        pipelineId: 'pipeline-integration',
        order: 3,
        probability: 80,
        color: '#06b6d4',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'stage-int-live',
        name: 'Live',
        description: 'Successfully integrated and live',
        pipelineId: 'pipeline-integration',
        order: 4,
        probability: 100,
        color: '#10b981',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      }
    ];

    // Create sample deals using existing contacts and organizations
    const deals = [
      {
        id: 'deal-1',
        title: 'AutoMax Luxury Partnership',
        description: 'Partnership opportunity with premier luxury dealership',
        value: 250000,
        currency: 'USD',
        status: 'OPEN',
        pipelineId: 'pipeline-dealer',
        stageId: 'stage-da-proposal',
        contactId: 'contact-1', // Using existing contact from contacts data
        organisationId: 'org_1', // Using existing org from orgs data
        assignedTo: null,
        expectedCloseDate: new Date('2024-03-15').toISOString(),
        probability: 50,
        notes: 'Strong interest in luxury vehicle logistics solutions',
        tenantId: 'tenant-1',
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'deal-2',
        title: 'CarHub Direct Integration',
        description: 'Technical integration for existing CarHub Direct dealer',
        value: 150000,
        currency: 'USD',
        status: 'OPEN',
        pipelineId: 'pipeline-integration',
        stageId: 'stage-int-integration',
        contactId: 'contact-2',
        organisationId: 'org_2',
        assignedTo: null,
        expectedCloseDate: new Date('2024-02-28').toISOString(),
        probability: 60,
        notes: 'Integration work in progress, good communication with tech team',
        tenantId: 'tenant-1',
        createdAt: new Date('2024-01-10').toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'deal-3',
        title: 'Copart Auction House Partnership',
        description: 'Expanding services with major auction house',
        value: 500000,
        currency: 'USD',
        status: 'OPEN',
        pipelineId: 'pipeline-dealer',
        stageId: 'stage-da-qualified',
        contactId: 'contact-3',
        organisationId: 'org_3',
        assignedTo: null,
        expectedCloseDate: new Date('2024-04-30').toISOString(),
        probability: 25,
        notes: 'Initial conversations very positive, awaiting formal proposal request',
        tenantId: 'tenant-1',
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'deal-4',
        title: 'Pacific Shipping Lines Contract',
        description: 'Major shipping contract for west coast operations',
        value: 750000,
        currency: 'USD',
        status: 'OPEN',
        pipelineId: 'pipeline-dealer',
        stageId: 'stage-da-negotiation',
        contactId: 'contact-4',
        organisationId: 'org_4',
        assignedTo: null,
        expectedCloseDate: new Date('2024-03-01').toISOString(),
        probability: 75,
        notes: 'In final negotiations, pricing almost agreed',
        tenantId: 'tenant-1',
        createdAt: new Date('2024-01-05').toISOString(),
        updatedAt: new Date().toISOString(),
        customFields: {}
      },
      {
        id: 'deal-5',
        title: 'Elite Motors Integration Complete',
        description: 'Successfully completed technical integration',
        value: 200000,
        currency: 'USD',
        status: 'WON',
        pipelineId: 'pipeline-integration',
        stageId: 'stage-int-live',
        contactId: 'contact-5',
        organisationId: 'org_5',
        assignedTo: null,
        expectedCloseDate: new Date('2024-01-31').toISOString(),
        probability: 100,
        notes: 'Integration completed successfully, client very satisfied',
        tenantId: 'tenant-1',
        createdAt: new Date('2023-12-01').toISOString(),
        updatedAt: new Date('2024-01-31').toISOString(),
        customFields: {}
      }
    ];

    // Update the CRM data
    crmData.pipelines = pipelines;
    crmData.stages = stages;
    crmData.deals = deals;

    // Write back to file
    fs.writeFileSync(crmDataPath, JSON.stringify(crmData, null, 2));

    console.log(`✅ Successfully populated CRM data:`);
    console.log(`   - ${pipelines.length} pipelines`);
    console.log(`   - ${stages.length} stages`);
    console.log(`   - ${deals.length} deals`);
    console.log(`   - Data saved to: ${crmDataPath}`);

  } catch (error) {
    console.error('❌ Error populating CRM deals:', error);
    process.exit(1);
  }
}

// Run the population
populateDealsAndPipelines();