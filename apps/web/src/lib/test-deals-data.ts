// Temporary test data while fixing repository import issues
export const TEST_DEALS = [
  // Dealer Acquisition Pipeline Deals
  {
    id: 'deal_1',
    title: 'AutoMax Luxury Partnership',
    description: 'Partnership agreement for premium vehicle auction services',
    value: 2500000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_1',
    organisationId: 'org_1',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-negotiation',
        enteredAt: '2024-09-10T14:30:00Z'
      }
    ],
    expectedCloseDate: '2024-10-15T00:00:00Z',
    lastActivityDate: '2024-09-12T16:45:00Z',
    customFields: {
      contract_type: 'Exclusive Partnership',
      service_level: 'Premium',
      estimated_monthly_volume: 150,
      decision_makers: ['Marcus Rodriguez', 'Jennifer Chen']
    },
    createdAt: '2024-08-15T10:00:00Z',
    updatedAt: '2024-09-12T16:45:00Z'
  },
  {
    id: 'deal_2',
    title: 'Premier Motors Integration',
    description: 'Full service integration for East Coast operations',
    value: 1800000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_3',
    organisationId: 'org_2',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-won',
        enteredAt: '2024-09-05T12:00:00Z'
      }
    ],
    expectedCloseDate: '2024-09-20T00:00:00Z',
    lastActivityDate: '2024-09-14T09:30:00Z',
    customFields: {
      contract_type: 'Standard Agreement',
      service_level: 'Standard',
      estimated_monthly_volume: 200,
      signed_date: '2024-09-05T12:00:00Z'
    },
    createdAt: '2024-07-20T14:30:00Z',
    updatedAt: '2024-09-14T09:30:00Z'
  },
  {
    id: 'deal_3',
    title: 'City Cars Direct Onboarding',
    description: 'New dealer onboarding for Chicago market',
    value: 850000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_5',
    organisationId: 'org_3',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-qualification',
        enteredAt: '2024-09-12T10:15:00Z'
      }
    ],
    expectedCloseDate: '2024-11-01T00:00:00Z',
    lastActivityDate: '2024-09-13T14:20:00Z',
    customFields: {
      contract_type: 'Trial Agreement',
      service_level: 'Basic',
      estimated_monthly_volume: 50,
      trial_period_months: 6
    },
    createdAt: '2024-09-01T09:00:00Z',
    updatedAt: '2024-09-13T14:20:00Z'
  },
  {
    id: 'deal_4',
    title: 'Copart Sacramento Expansion',
    description: 'Expanded services for salvage vehicle processing',
    value: 3200000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_6',
    organisationId: 'org_4',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-proposal',
        enteredAt: '2024-08-25T11:00:00Z'
      }
    ],
    expectedCloseDate: '2024-10-30T00:00:00Z',
    lastActivityDate: '2024-09-11T15:45:00Z',
    customFields: {
      contract_type: 'Volume Agreement',
      service_level: 'Enterprise',
      estimated_monthly_volume: 500,
      specializes_in: 'Salvage Vehicles'
    },
    createdAt: '2024-08-10T08:00:00Z',
    updatedAt: '2024-09-11T15:45:00Z'
  },
  // Integration Pipeline Deals
  {
    id: 'deal_5',
    title: 'Express Transport API Integration',
    description: 'Real-time shipping integration and tracking system',
    value: 450000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_8',
    organisationId: 'org_6',
    currentStages: [
      {
        pipelineId: 'pipeline-integration',
        stageId: 'stage-int-development',
        enteredAt: '2024-08-30T13:00:00Z'
      }
    ],
    expectedCloseDate: '2024-10-15T00:00:00Z',
    lastActivityDate: '2024-09-13T11:30:00Z',
    customFields: {
      integration_type: 'API',
      development_phase: 'Testing',
      go_live_date: '2024-10-01',
      features: ['Real-time Tracking', 'Automated Dispatch', 'Route Optimization']
    },
    createdAt: '2024-08-15T16:00:00Z',
    updatedAt: '2024-09-13T11:30:00Z'
  },
  {
    id: 'deal_6',
    title: 'Pacific Shipping Portal',
    description: 'International shipping management portal',
    value: 680000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_10',
    organisationId: 'org_7',
    currentStages: [
      {
        pipelineId: 'pipeline-integration',
        stageId: 'stage-int-planning',
        enteredAt: '2024-09-05T09:15:00Z'
      }
    ],
    expectedCloseDate: '2024-12-01T00:00:00Z',
    lastActivityDate: '2024-09-14T10:00:00Z',
    customFields: {
      integration_type: 'Web Portal',
      development_phase: 'Requirements Gathering',
      features: ['Multi-language Support', 'Container Tracking', 'Customs Integration'],
      target_ports: ['Long Beach', 'Los Angeles', 'Oakland']
    },
    createdAt: '2024-09-01T11:30:00Z',
    updatedAt: '2024-09-14T10:00:00Z'
  },
  // Closed Deals
  {
    id: 'deal_7',
    title: 'Elite Collectors Premium Service',
    description: 'High-end classic car auction and transport services',
    value: 1250000,
    currency: 'USD',
    status: 'WON',
    contactId: 'contact_14',
    organisationId: 'org_10',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-won',
        enteredAt: '2024-08-20T16:30:00Z'
      }
    ],
    expectedCloseDate: '2024-08-25T00:00:00Z',
    actualCloseDate: '2024-08-22T14:45:00Z',
    lastActivityDate: '2024-08-22T14:45:00Z',
    customFields: {
      contract_type: 'Premium Service Agreement',
      service_level: 'Concierge',
      estimated_monthly_volume: 25,
      specializes_in: 'Classic Collector Vehicles',
      signed_date: '2024-08-22T14:45:00Z',
      contract_duration_months: 24
    },
    createdAt: '2024-07-10T10:15:00Z',
    updatedAt: '2024-08-22T14:45:00Z'
  },
  {
    id: 'deal_8',
    title: 'Johnson Family Auto Basic Package',
    description: 'Small dealer basic service package',
    value: 180000,
    currency: 'USD',
    status: 'WON',
    contactId: 'contact_13',
    organisationId: 'org_9',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-won',
        enteredAt: '2024-09-01T11:00:00Z'
      }
    ],
    expectedCloseDate: '2024-09-10T00:00:00Z',
    actualCloseDate: '2024-09-03T15:20:00Z',
    lastActivityDate: '2024-09-03T15:20:00Z',
    customFields: {
      contract_type: 'Basic Service Agreement',
      service_level: 'Basic',
      estimated_monthly_volume: 15,
      family_business: true,
      payment_terms: 'Net 30'
    },
    createdAt: '2024-08-15T13:00:00Z',
    updatedAt: '2024-09-03T15:20:00Z'
  },
  // Lost Deals
  {
    id: 'deal_9',
    title: 'Midwest Auto Group Partnership',
    description: 'Regional partnership opportunity - lost to competitor',
    value: 950000,
    currency: 'USD',
    status: 'LOST',
    contactId: 'contact_3', // Reusing contact for demo
    organisationId: 'org_2',
    currentStages: [
      {
        pipelineId: 'pipeline-dealer-acquisition',
        stageId: 'stage-da-negotiation',
        enteredAt: '2024-07-15T14:00:00Z'
      }
    ],
    expectedCloseDate: '2024-08-30T00:00:00Z',
    actualCloseDate: '2024-08-28T10:30:00Z',
    lastActivityDate: '2024-08-28T10:30:00Z',
    lossReason: 'Lost to competitor - pricing',
    customFields: {
      contract_type: 'Regional Partnership',
      competitor: 'AutoTrader Solutions',
      lost_reason_details: 'Competitor offered 15% lower pricing',
      decision_factors: ['Price', 'Local Support', 'Integration Timeline']
    },
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-08-28T10:30:00Z'
  },
  // High-Value Enterprise Deal
  {
    id: 'deal_10',
    title: 'Manheim Enterprise Integration',
    description: 'National wholesale auction platform integration',
    value: 4500000,
    currency: 'USD',
    status: 'ACTIVE',
    contactId: 'contact_7',
    organisationId: 'org_5',
    currentStages: [
      {
        pipelineId: 'pipeline-integration',
        stageId: 'stage-int-development',
        enteredAt: '2024-07-01T08:00:00Z'
      }
    ],
    expectedCloseDate: '2024-12-15T00:00:00Z',
    lastActivityDate: '2024-09-14T16:00:00Z',
    customFields: {
      contract_type: 'Enterprise License Agreement',
      service_level: 'Enterprise',
      estimated_monthly_volume: 2000,
      integration_complexity: 'High',
      stakeholders: ['Michael O\'Brien', 'Regional Directors', 'IT Team'],
      phases: ['Phase 1: Core Integration', 'Phase 2: Advanced Features', 'Phase 3: Analytics'],
      current_phase: 'Phase 1'
    },
    createdAt: '2024-06-15T12:00:00Z',
    updatedAt: '2024-09-14T16:00:00Z'
  }
];

import fs from 'fs';
import path from 'path';

// Persistent file store path
const DEALS_DATA_FILE = path.join(process.cwd(), '.deals-data', 'deals.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DEALS_DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load deals from file or use default test data
function loadDeals(): Map<string, any> {
  try {
    ensureDataDirectory();
    if (fs.existsSync(DEALS_DATA_FILE)) {
      const data = fs.readFileSync(DEALS_DATA_FILE, 'utf-8');
      const dealsArray = JSON.parse(data);
      return new Map(dealsArray.map((deal: any) => [deal.id, deal]));
    }
  } catch (error) {
    console.warn('Failed to load deals data, using defaults:', error);
  }
  
  // Return default test data
  return new Map(TEST_DEALS.map(deal => [deal.id, { ...deal }]));
}

// Save deals to file
function saveDeals(dealStore: Map<string, any>) {
  try {
    ensureDataDirectory();
    const dealsArray = Array.from(dealStore.values());
    fs.writeFileSync(DEALS_DATA_FILE, JSON.stringify(dealsArray, null, 2));
  } catch (error) {
    console.warn('Failed to save deals data:', error);
  }
}

// Global singleton for deal store to survive module reloads
declare global {
  var __dealStore: Map<string, any> | undefined;
}

// In-memory store with persistent backing - use global to survive hot reloads
let dealStore = globalThis.__dealStore ?? loadDeals();
if (!globalThis.__dealStore) {
  globalThis.__dealStore = dealStore;
}

export function getAllDeals() {
  const store = globalThis.__dealStore ?? dealStore;
  return Array.from(store.values());
}

export function getDealById(id: string) {
  const store = globalThis.__dealStore ?? dealStore;
  return store.get(id);
}

export function updateDeal(id: string, updates: Partial<typeof TEST_DEALS[0]>) {
  const store = globalThis.__dealStore ?? dealStore;
  const deal = store.get(id);
  if (!deal) return null;
  
  const updatedDeal = { ...deal, ...updates, updatedAt: new Date().toISOString() };
  store.set(id, updatedDeal);
  globalThis.__dealStore = store;
  saveDeals(store);
  return updatedDeal;
}

export function moveDealStage(id: string, toStageId: string, pipelineId: string, note?: string) {
  const store = globalThis.__dealStore ?? dealStore;
  const deal = store.get(id);
  if (!deal) return null;
  
  const updatedDeal = {
    ...deal,
    currentStages: [
      {
        pipelineId,
        stageId: toStageId,
        enteredAt: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  };
  
  store.set(id, updatedDeal);
  globalThis.__dealStore = store;
  saveDeals(store);
  return updatedDeal;
}