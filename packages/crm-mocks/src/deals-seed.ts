import { Deal, DealStatus, LossReason } from '@united-cars/crm-core';
import { makeDeal, makeDealCurrentStage, makeDealStageHistory } from '@united-cars/crm-core';
import { TEST_USERS } from './enhanced-seeds';

const DEFAULT_TENANT = 'united-cars';

// Clean, consistent deals with proper pipeline assignments
export const cleanDeals = [
  // Dealer Acquisition Pipeline Deals
  makeDeal({
    id: 'deal_1',
    title: 'AutoMax Fleet Expansion - Q1 2025',
    value: 250000,
    amount: 250000,
    currency: 'USD',
    organisationId: 'org_1', // AutoMax (Dealer)
    contactId: 'contact_1',
    status: DealStatus.OPEN,
    probability: 65,
    notes: 'Large fleet expansion for Q1, interested in 50+ vehicles from Japan auctions',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.SENIOR_MANAGER.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeDeal({
    id: 'deal_2',
    title: 'Premier Motors Luxury Import Deal',
    value: 450000,
    amount: 450000,
    currency: 'USD',
    organisationId: 'org_2', // Premier Motors (Dealer)
    contactId: 'contact_2',
    status: DealStatus.OPEN,
    probability: 80,
    notes: 'High-end luxury vehicles from German auctions, focus on BMW and Mercedes',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER_2.id,
    createdBy: TEST_USERS.SENIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER_2.id
  }),
  makeDeal({
    id: 'deal_3',
    title: 'City Cars Economy Fleet',
    value: 150000,
    amount: 150000,
    currency: 'USD',
    organisationId: 'org_3', // City Cars (Dealer)
    contactId: 'contact_3',
    status: DealStatus.OPEN,
    probability: 40,
    notes: 'Budget-friendly compact cars for city dealership',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER.id
  }),

  // Won Deal - Now in Integration Pipeline
  makeDeal({
    id: 'deal_4',
    title: 'Global Auto Partnership - ACTIVE',
    value: 750000,
    amount: 750000,
    currency: 'USD',
    organisationId: 'org_4', // Global Auto (Dealer)
    contactId: 'contact_4',
    status: DealStatus.WON,
    probability: 100,
    closeDate: new Date('2024-12-15'),
    notes: 'Major partnership signed, now in integration phase',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),

  // Retail Sales Pipeline Deals
  makeDeal({
    id: 'deal_5',
    title: 'John Smith - BMW X5 Import',
    value: 85000,
    amount: 85000,
    currency: 'USD',
    organisationId: 'org_6', // Personal Account (Retail)
    contactId: 'contact_7',
    status: DealStatus.OPEN,
    probability: 70,
    notes: 'Individual buyer looking for 2024 BMW X5',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.ADMIN.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id
  }),

  // Vendor Onboarding Pipeline Deal
  makeDeal({
    id: 'deal_6',
    title: 'Express Logistics Partnership',
    value: 125000,
    amount: 125000,
    currency: 'USD',
    organisationId: 'org_5', // Express Logistics (Shipper)
    contactId: 'contact_5',
    status: DealStatus.OPEN,
    probability: 60,
    notes: 'New shipping partner for East Coast routes',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),

  // More Dealer Deals
  makeDeal({
    id: 'deal_7',
    title: 'Sunshine Auto Group Expansion',
    value: 320000,
    amount: 320000,
    currency: 'USD',
    status: DealStatus.OPEN,
    probability: 90,
    notes: 'Existing client expanding to new location',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER_2.id,
    createdBy: TEST_USERS.SENIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER_2.id
  }),

  // Lost Deal Example
  makeDeal({
    id: 'deal_8',
    title: 'Budget Cars Network',
    value: 95000,
    amount: 95000,
    currency: 'USD',
    status: DealStatus.LOST,
    probability: 0,
    lossReason: LossReason.REJECTION,
    notes: 'Lost to competitor due to pricing',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER_2.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  })
];

// Assign currentStages and stageHistory
export function assignDealStages(deals: Deal[]) {
  // Deal 1 - Dealer Acquisition - Qualification
  deals[0].currentStages = [makeDealCurrentStage('deal_1', 'dealer-acquisition', 'stage_da_3')];
  deals[0].stageHistory = [
    makeDealStageHistory('deal_1', 'dealer-acquisition', 'stage_da_1'),
    makeDealStageHistory('deal_1', 'dealer-acquisition', 'stage_da_2', { fromStageId: 'stage_da_1' }),
    makeDealStageHistory('deal_1', 'dealer-acquisition', 'stage_da_3', { fromStageId: 'stage_da_2' })
  ];

  // Deal 2 - Dealer Acquisition - Negotiation
  deals[1].currentStages = [makeDealCurrentStage('deal_2', 'dealer-acquisition', 'stage_da_6')];
  deals[1].stageHistory = [
    makeDealStageHistory('deal_2', 'dealer-acquisition', 'stage_da_1'),
    makeDealStageHistory('deal_2', 'dealer-acquisition', 'stage_da_2', { fromStageId: 'stage_da_1' }),
    makeDealStageHistory('deal_2', 'dealer-acquisition', 'stage_da_3', { fromStageId: 'stage_da_2' }),
    makeDealStageHistory('deal_2', 'dealer-acquisition', 'stage_da_4', { fromStageId: 'stage_da_3' }),
    makeDealStageHistory('deal_2', 'dealer-acquisition', 'stage_da_5', { fromStageId: 'stage_da_4' }),
    makeDealStageHistory('deal_2', 'dealer-acquisition', 'stage_da_6', { fromStageId: 'stage_da_5' })
  ];

  // Deal 3 - Dealer Acquisition - Contact Established
  deals[2].currentStages = [makeDealCurrentStage('deal_3', 'dealer-acquisition', 'stage_da_2')];
  deals[2].stageHistory = [
    makeDealStageHistory('deal_3', 'dealer-acquisition', 'stage_da_1'),
    makeDealStageHistory('deal_3', 'dealer-acquisition', 'stage_da_2', { fromStageId: 'stage_da_1' })
  ];

  // Deal 4 - Won, now in Integration
  deals[3].currentStages = [
    makeDealCurrentStage('deal_4', 'dealer-acquisition', 'stage_da_10'), // Won
    makeDealCurrentStage('deal_4', 'dealer-integration', 'stage_di_3')  // Instructions Provided
  ];
  deals[3].stageHistory = [
    // Full acquisition journey
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_1'),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_2', { fromStageId: 'stage_da_1' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_3', { fromStageId: 'stage_da_2' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_4', { fromStageId: 'stage_da_3' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_5', { fromStageId: 'stage_da_4' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_6', { fromStageId: 'stage_da_5' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_7', { fromStageId: 'stage_da_6' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_8', { fromStageId: 'stage_da_7' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_9', { fromStageId: 'stage_da_8' }),
    makeDealStageHistory('deal_4', 'dealer-acquisition', 'stage_da_10', { fromStageId: 'stage_da_9' }),
    // Integration journey
    makeDealStageHistory('deal_4', 'dealer-integration', 'stage_di_1'),
    makeDealStageHistory('deal_4', 'dealer-integration', 'stage_di_2', { fromStageId: 'stage_di_1' }),
    makeDealStageHistory('deal_4', 'dealer-integration', 'stage_di_3', { fromStageId: 'stage_di_2' })
  ];

  // Deal 5 - Retail Sales - Vehicle Selection
  deals[4].currentStages = [makeDealCurrentStage('deal_5', 'retail-sales', 'stage_rs_3')];
  deals[4].stageHistory = [
    makeDealStageHistory('deal_5', 'retail-sales', 'stage_rs_1'),
    makeDealStageHistory('deal_5', 'retail-sales', 'stage_rs_2', { fromStageId: 'stage_rs_1' }),
    makeDealStageHistory('deal_5', 'retail-sales', 'stage_rs_3', { fromStageId: 'stage_rs_2' })
  ];

  // Deal 6 - Vendor Onboarding - Rate Negotiation
  deals[5].currentStages = [makeDealCurrentStage('deal_6', 'vendor-onboarding', 'stage_vo_4')];
  deals[5].stageHistory = [
    makeDealStageHistory('deal_6', 'vendor-onboarding', 'stage_vo_1'),
    makeDealStageHistory('deal_6', 'vendor-onboarding', 'stage_vo_2', { fromStageId: 'stage_vo_1' }),
    makeDealStageHistory('deal_6', 'vendor-onboarding', 'stage_vo_3', { fromStageId: 'stage_vo_2' }),
    makeDealStageHistory('deal_6', 'vendor-onboarding', 'stage_vo_4', { fromStageId: 'stage_vo_3' })
  ];

  // Deal 7 - Dealer Acquisition - Contract Sent
  deals[6].currentStages = [makeDealCurrentStage('deal_7', 'dealer-acquisition', 'stage_da_7')];
  deals[6].stageHistory = [
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_1'),
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_2', { fromStageId: 'stage_da_1' }),
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_3', { fromStageId: 'stage_da_2' }),
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_4', { fromStageId: 'stage_da_3' }),
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_5', { fromStageId: 'stage_da_4' }),
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_6', { fromStageId: 'stage_da_5' }),
    makeDealStageHistory('deal_7', 'dealer-acquisition', 'stage_da_7', { fromStageId: 'stage_da_6' })
  ];

  // Deal 8 - Lost Deal
  deals[7].currentStages = [makeDealCurrentStage('deal_8', 'dealer-acquisition', 'stage_da_lost')];
  deals[7].stageHistory = [
    makeDealStageHistory('deal_8', 'dealer-acquisition', 'stage_da_1'),
    makeDealStageHistory('deal_8', 'dealer-acquisition', 'stage_da_2', { fromStageId: 'stage_da_1' }),
    makeDealStageHistory('deal_8', 'dealer-acquisition', 'stage_da_lost', { fromStageId: 'stage_da_2' })
  ];

  return deals;
}

// Export the deals with stages assigned
const deals = assignDealStages(cleanDeals);
export default deals;