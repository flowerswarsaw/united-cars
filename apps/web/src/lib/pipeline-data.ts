import fs from 'fs';
import path from 'path';

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
}

export interface Stage {
  id: string;
  pipelineId: string;
  label: string;
  slug: string;
  order: number;
  probability: number; // 0-100
  slaDays?: number;
  color?: string;
  isTerminal: boolean;
  isActive: boolean;
}

export interface LostReason {
  id: string;
  label: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface EnhancedDeal {
  id: string;
  title: string;
  description: string;
  value: number;
  currency: string;
  status: 'ACTIVE' | 'WON' | 'LOST';
  contactId: string;
  organisationId: string;
  
  // Enhanced pipeline fields
  pipelineId: string;
  stageId: string | null;
  enteredStageAt: string;
  
  // Terminal outcome tracking
  outcome: 'won' | 'lost' | null;
  lostReasonId?: string;
  lostNote?: string;
  wonAt?: string;
  lostAt?: string;
  isFrozen: boolean;
  
  // Legacy compatibility
  currentStages: Array<{
    pipelineId: string;
    stageId: string;
    enteredAt: string;
  }>;
  
  expectedCloseDate: string;
  lastActivityDate: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStats {
  pipelineId: string;
  stageStats: Array<{
    stageId: string;
    stageName: string;
    dealCount: number;
    averageDaysInStage: number;
    slaBreachCount: number;
  }>;
  winRate: number;
  lossReasonBreakdown: Array<{
    reasonId: string;
    reasonLabel: string;
    count: number;
    percentage: number;
  }>;
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
}

// Default Sales Pipeline with canonical stages
export const DEFAULT_PIPELINE: Pipeline = {
  id: 'pipeline-default',
  name: 'Default Sales Pipeline',
  description: 'Primary sales process with canonical stages',
  isActive: true,
  isDefault: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  stages: [
    {
      id: 'stage-investigation',
      pipelineId: 'pipeline-default',
      label: 'Investigation',
      slug: 'investigation',
      order: 1,
      probability: 5,
      slaDays: 14,
      color: '#6B7280',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-contact-established',
      pipelineId: 'pipeline-default',
      label: 'Contact Established',
      slug: 'contact-established',
      order: 2,
      probability: 15,
      slaDays: 7,
      color: '#F59E0B',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-qualification',
      pipelineId: 'pipeline-default',
      label: 'Qualification',
      slug: 'qualification',
      order: 3,
      probability: 25,
      slaDays: 10,
      color: '#EF4444',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-meeting-set',
      pipelineId: 'pipeline-default',
      label: 'Meeting Set',
      slug: 'meeting-set',
      order: 4,
      probability: 35,
      slaDays: 5,
      color: '#3B82F6',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-meeting-confirmed',
      pipelineId: 'pipeline-default',
      label: 'Meeting Confirmed',
      slug: 'meeting-confirmed',
      order: 5,
      probability: 45,
      slaDays: 3,
      color: '#06B6D4',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-negotiation',
      pipelineId: 'pipeline-default',
      label: 'Negotiation',
      slug: 'negotiation',
      order: 6,
      probability: 65,
      slaDays: 14,
      color: '#8B5CF6',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-contract-sent',
      pipelineId: 'pipeline-default',
      label: 'Contract Sent',
      slug: 'contract-sent',
      order: 7,
      probability: 85,
      slaDays: 7,
      color: '#EC4899',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-contract-signed',
      pipelineId: 'pipeline-default',
      label: 'Contract Signed',
      slug: 'contract-signed',
      order: 8,
      probability: 95,
      slaDays: 5,
      color: '#10B981',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-deposit-paid',
      pipelineId: 'pipeline-default',
      label: 'Deposit Paid',
      slug: 'deposit-paid',
      order: 9,
      probability: 95,
      slaDays: 5,
      color: '#7C3AED',
      isTerminal: false,
      isActive: true
    },
    {
      id: 'stage-closed-won',
      pipelineId: 'pipeline-default',
      label: 'Closed/Won',
      slug: 'closed-won',
      order: 10,
      probability: 100,
      slaDays: undefined,
      color: '#059669',
      isTerminal: true,
      isActive: true
    },
    {
      id: 'stage-closed-lost',
      pipelineId: 'pipeline-default',
      label: 'Closed/Lost',
      slug: 'closed-lost',
      order: 11,
      probability: 0,
      slaDays: undefined,
      color: '#DC2626',
      isTerminal: true,
      isActive: true
    }
  ]
};

// Default lost reasons
export const DEFAULT_LOST_REASONS: LostReason[] = [
  {
    id: 'reason-no-budget',
    label: 'No Budget',
    isActive: true,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'reason-no-decision-maker',
    label: 'No Decision Maker',
    isActive: true,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'reason-timing',
    label: 'Timing Issues',
    isActive: true,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'reason-competitor',
    label: 'Competitor Chosen',
    isActive: true,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'reason-not-target',
    label: 'Not a Target',
    isActive: true,
    usageCount: 0,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// File-based persistence paths
const PIPELINES_DATA_FILE = path.join(process.cwd(), '.pipeline-data', 'pipelines.json');
const LOST_REASONS_DATA_FILE = path.join(process.cwd(), '.pipeline-data', 'lost-reasons.json');
const ENHANCED_DEALS_DATA_FILE = path.join(process.cwd(), '.pipeline-data', 'enhanced-deals.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(PIPELINES_DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Pipeline management functions
function loadPipelines(): Map<string, Pipeline> {
  try {
    ensureDataDirectory();
    if (fs.existsSync(PIPELINES_DATA_FILE)) {
      const data = fs.readFileSync(PIPELINES_DATA_FILE, 'utf-8');
      const pipelinesArray = JSON.parse(data);
      return new Map(pipelinesArray.map((pipeline: Pipeline) => [pipeline.id, pipeline]));
    }
  } catch (error) {
    console.warn('Failed to load pipelines data, using defaults:', error);
  }
  
  // Return default pipeline
  return new Map([[DEFAULT_PIPELINE.id, { ...DEFAULT_PIPELINE }]]);
}

export function savePipelines(pipelineStore: Map<string, Pipeline>) {
  try {
    ensureDataDirectory();
    const pipelinesArray = Array.from(pipelineStore.values());
    fs.writeFileSync(PIPELINES_DATA_FILE, JSON.stringify(pipelinesArray, null, 2));
  } catch (error) {
    console.warn('Failed to save pipelines data:', error);
  }
}

// Lost reasons management functions
function loadLostReasons(): Map<string, LostReason> {
  try {
    ensureDataDirectory();
    if (fs.existsSync(LOST_REASONS_DATA_FILE)) {
      const data = fs.readFileSync(LOST_REASONS_DATA_FILE, 'utf-8');
      const reasonsArray = JSON.parse(data);
      return new Map(reasonsArray.map((reason: LostReason) => [reason.id, reason]));
    }
  } catch (error) {
    console.warn('Failed to load lost reasons data, using defaults:', error);
  }
  
  // Return default lost reasons
  return new Map(DEFAULT_LOST_REASONS.map(reason => [reason.id, { ...reason }]));
}

export function saveLostReasons(reasonStore: Map<string, LostReason>) {
  try {
    ensureDataDirectory();
    const reasonsArray = Array.from(reasonStore.values());
    fs.writeFileSync(LOST_REASONS_DATA_FILE, JSON.stringify(reasonsArray, null, 2));
  } catch (error) {
    console.warn('Failed to save lost reasons data:', error);
  }
}

// Enhanced deals management functions
function loadEnhancedDeals(): Map<string, EnhancedDeal> {
  try {
    console.log(`loadEnhancedDeals: checking file at ${ENHANCED_DEALS_DATA_FILE}`);
    ensureDataDirectory();
    if (fs.existsSync(ENHANCED_DEALS_DATA_FILE)) {
      console.log(`loadEnhancedDeals: file exists, loading...`);
      const data = fs.readFileSync(ENHANCED_DEALS_DATA_FILE, 'utf-8');
      const dealsArray = JSON.parse(data);
      console.log(`loadEnhancedDeals: loaded ${dealsArray.length} deals from file`);
      return new Map(dealsArray.map((deal: EnhancedDeal) => [deal.id, deal]));
    } else {
      console.log(`loadEnhancedDeals: file does not exist at ${ENHANCED_DEALS_DATA_FILE}`);
    }
  } catch (error) {
    console.warn('Failed to load enhanced deals data, will migrate from existing:', error);
  }
  
  // Migration from existing deals will happen in migration function
  console.log(`loadEnhancedDeals: returning empty map`);
  return new Map();
}

export function saveEnhancedDeals(dealStore: Map<string, EnhancedDeal>) {
  try {
    console.log(`saveEnhancedDeals called with ${dealStore.size} deals`);
    ensureDataDirectory();
    const dealsArray = Array.from(dealStore.values());
    console.log(`Writing to file: ${ENHANCED_DEALS_DATA_FILE}`);
    fs.writeFileSync(ENHANCED_DEALS_DATA_FILE, JSON.stringify(dealsArray, null, 2));

    // IMPORTANT: Update the global store to ensure changes persist in memory
    globalThis.__enhancedDealStore = dealStore;
    enhancedDealStore = dealStore;

    console.log(`✅ Successfully saved ${dealsArray.length} enhanced deals to ${ENHANCED_DEALS_DATA_FILE} and updated global store`);
  } catch (error) {
    console.error('❌ Failed to save enhanced deals data:', error);
    throw error; // Re-throw to see the error in migration
  }
}

// Global singleton stores for hot reload survival
declare global {
  var __pipelineStore: Map<string, Pipeline> | undefined;
  var __lostReasonStore: Map<string, LostReason> | undefined;
  var __enhancedDealStore: Map<string, EnhancedDeal> | undefined;
}

// Initialize stores
let pipelineStore = globalThis.__pipelineStore ?? loadPipelines();
let lostReasonStore = globalThis.__lostReasonStore ?? loadLostReasons();
let enhancedDealStore = globalThis.__enhancedDealStore ?? loadEnhancedDeals();

if (!globalThis.__pipelineStore) {
  globalThis.__pipelineStore = pipelineStore;
}
if (!globalThis.__lostReasonStore) {
  globalThis.__lostReasonStore = lostReasonStore;
}
if (!globalThis.__enhancedDealStore) {
  globalThis.__enhancedDealStore = enhancedDealStore;
}

// Save functions are exported directly above where they are defined

// Public API functions
export function getAllPipelines(): Pipeline[] {
  const store = globalThis.__pipelineStore ?? pipelineStore;
  return Array.from(store.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getPipelineById(id: string): Pipeline | null {
  const store = globalThis.__pipelineStore ?? pipelineStore;
  return store.get(id) || null;
}

export function getDefaultPipeline(): Pipeline | null {
  const store = globalThis.__pipelineStore ?? pipelineStore;
  return Array.from(store.values()).find(p => p.isDefault) || null;
}

export function getAllLostReasons(): LostReason[] {
  const store = globalThis.__lostReasonStore ?? lostReasonStore;
  return Array.from(store.values())
    .filter(r => r.isActive)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getLostReasonById(id: string): LostReason | null {
  const store = globalThis.__lostReasonStore ?? lostReasonStore;
  return store.get(id) || null;
}

export function getAllEnhancedDeals(): EnhancedDeal[] {
  const store = globalThis.__enhancedDealStore ?? enhancedDealStore;
  console.log(`getAllEnhancedDeals: using ${globalThis.__enhancedDealStore ? 'global' : 'local'} store, size: ${store.size}`);
  return Array.from(store.values());
}

export function getEnhancedDealById(id: string): EnhancedDeal | null {
  const store = globalThis.__enhancedDealStore ?? enhancedDealStore;
  return store.get(id) || null;
}

// Utility functions
export function getStageBySlug(pipelineId: string, slug: string): Stage | null {
  const pipeline = getPipelineById(pipelineId);
  return pipeline?.stages.find(s => s.slug === slug) || null;
}

export function isStageTerminal(stageId: string): boolean {
  const pipelines = getAllPipelines();
  for (const pipeline of pipelines) {
    const stage = pipeline.stages.find(s => s.id === stageId);
    if (stage) return stage.isTerminal;
  }
  return false;
}

export function calculateSlaBreachDays(enteredStageAt: string, slaDays?: number): number | null {
  if (!slaDays) return null;
  
  const enteredDate = new Date(enteredStageAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - enteredDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysDiff - slaDays);
}

export function isDeadlocked(outcome: string | null, isFrozen: boolean): boolean {
  return outcome === 'won' && isFrozen;
}

// Legacy mapping for migration
export const LEGACY_STAGE_MAPPING: Record<string, string> = {
  'stage-da-prospect': 'stage-investigation',
  'stage-da-qualification': 'stage-qualification',
  'stage-da-presentation': 'stage-meeting-confirmed',
  'stage-da-proposal': 'stage-contract-sent',
  'stage-da-negotiation': 'stage-negotiation',
  'stage-da-won': 'stage-closed-won',
  'stage-int-discovery': 'stage-investigation',
  'stage-int-planning': 'stage-qualification',
  'stage-int-proposal': 'stage-contract-sent',
  'stage-int-development': 'stage-contract-signed',
  'stage-int-deployment': 'stage-deposit-paid',
  'stage-int-completed': 'stage-closed-won'
};