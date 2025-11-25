export enum EntityType {
  ORGANISATION = 'ORGANISATION',
  CONTACT = 'CONTACT',
  LEAD = 'LEAD',
  DEAL = 'DEAL',
  TASK = 'TASK',
  PIPELINE = 'PIPELINE',
  STAGE = 'STAGE',
  ACTIVITY = 'ACTIVITY'
}

export enum DealStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
  INTEGRATION = 'INTEGRATION',
  CLOSED = 'CLOSED'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum OrganizationType {
  DEALER = 'DEALER',
  BROKER = 'BROKER',
  RETAIL_CLIENT = 'RETAIL_CLIENT',
  EXPEDITOR = 'EXPEDITOR',
  SHIPPER = 'SHIPPER',
  TRANSPORTER = 'TRANSPORTER',
  AUCTION = 'AUCTION',
  PROCESSOR = 'PROCESSOR'
}

export enum LossReason {
  STOPPED_WORKING = 'STOPPED_WORKING',
  COULD_NOT_REACH_DM = 'COULD_NOT_REACH_DM',
  REJECTION = 'REJECTION',
  OTHER = 'OTHER'
}

export enum ActivityType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  STAGE_MOVED = 'STAGE_MOVED',
  DEAL_WON = 'DEAL_WON',
  DEAL_LOST = 'DEAL_LOST',
  LEAD_CONVERTED = 'LEAD_CONVERTED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  NOTE_ADDED = 'NOTE_ADDED',
  FIELD_CHANGED = 'FIELD_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  AMOUNT_CHANGED = 'AMOUNT_CHANGED',
  CONTACT_ASSIGNED = 'CONTACT_ASSIGNED',
  CONTACT_REMOVED = 'CONTACT_REMOVED',
  ORGANIZATION_ASSIGNED = 'ORGANIZATION_ASSIGNED',
  ORGANIZATION_REMOVED = 'ORGANIZATION_REMOVED'
}

export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  JSON = 'JSON'
}

export enum ContactMethodType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER'
}

export enum OrganisationRelationType {
  PARTNER = 'PARTNER',
  VENDOR = 'VENDOR',
  CLIENT = 'CLIENT',
  COMPETITOR = 'COMPETITOR',
  SUBSIDIARY = 'SUBSIDIARY',
  PARENT = 'PARENT',
  SHIPPER_DEALER = 'SHIPPER_DEALER',
  AUCTION_DEALER = 'AUCTION_DEALER',
  OTHER = 'OTHER'
}

export enum ContactType {
  ACCOUNTING = 'ACCOUNTING',
  ADMINISTRATION = 'ADMINISTRATION',
  CEO = 'CEO',
  FINANCE = 'FINANCE',
  LOGISTICS = 'LOGISTICS',
  MARKETING = 'MARKETING',
  OPERATIONS = 'OPERATIONS',
  PURCHASING = 'PURCHASING',
  RETAIL_BUYER = 'RETAIL_BUYER',
  SALES = 'SALES',
  VP = 'VP'
}

export interface ContactMethod {
  id: string;
  type: ContactMethodType;
  value: string;
  isPrimary?: boolean;
  label?: string;
  notes?: string;
}

export interface SocialMediaLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  username?: string;
  isActive?: boolean;
  notes?: string;
}

export interface OrganisationConnection extends BaseEntity {
  fromOrganisationId: string;
  toOrganisationId: string;
  type: OrganisationRelationType;
  description?: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Shared components for better reusability and separation of concerns
export interface Address {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface EntityMetadata {
  notes?: string;
  tags?: string[];
}

// Organisation-specific focused interfaces
export interface OrganisationCore {
  name: string;
  companyId: string;
  type: OrganizationType;
}

export interface OrganisationContactInfo {
  contactMethods: ContactMethod[];
  socialMedia?: SocialMediaLink[];
  website?: string;
}

export interface OrganisationBusinessInfo {
  industry?: string;
  size?: string;
  typeSpecificData?: Record<string, any>;
}

// Main Organisation interface composed of focused components
export interface Organisation extends BaseEntity, OrganisationCore, OrganisationContactInfo, OrganisationBusinessInfo, Address, EntityMetadata {}

// Contact-specific focused interfaces
export interface ContactCore {
  firstName: string;
  lastName: string;
  type: ContactType;
  organisationId?: string;
}

export interface ContactInfo {
  contactMethods: ContactMethod[];
}

// Main Contact interface composed of focused components
export interface Contact extends BaseEntity, ContactCore, ContactInfo, Address, EntityMetadata {}

// Lead-specific focused interfaces
export interface LeadCore {
  title: string;
  source?: string;
  isTarget: boolean;
  score?: number;
  status?: string;
}

export interface LeadContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  // Location fields for geographic segmentation
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

export interface LeadRelationships {
  organisationId?: string;
  contactId?: string;
  convertedDealId?: string;
}

export interface LeadArchive {
  isArchived: boolean;
  archivedAt?: Date;
  archivedReason?: 'converted' | 'not_qualified' | 'duplicate' | 'invalid';
  archivedBy?: string;
}

// Main Lead interface composed of focused components
export interface Lead extends BaseEntity, LeadCore, LeadContactInfo, LeadRelationships, LeadArchive, EntityMetadata {}

export interface Pipeline extends BaseEntity {
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order: number;
  color?: string;
  applicableTypes: OrganizationType[];
  isTypeSpecific: boolean;
  stages?: Stage[];
}

export interface Stage extends BaseEntity {
  pipelineId: string;
  name: string;
  order: number;
  color?: string;
  wipLimit?: number;
  slaTarget?: number;
  isClosing?: boolean;
  isLost?: boolean;
}

// Deal-specific focused interfaces
export interface DealCore {
  title: string;
  status: DealStatus;
}

export interface DealFinancial {
  amount?: number;
  value?: number; // Legacy field - same as amount for backward compatibility
  currency?: string;
  probability?: number;
}

export interface DealRelationships {
  organisationId?: string;
  contactId?: string;
  // The user responsible for this deal (sales manager, admin, etc.)
  responsibleUserId?: string;
  // Legacy field - same as responsibleUserId for backward compatibility
  assigneeId?: string;
}

export interface DealTimeline {
  closeDate?: Date;
  lossReason?: LossReason;
}

export interface DealWorkflow {
  currentStages?: DealCurrentStage[];
  stageHistory?: DealStageHistory[];
}

// Main Deal interface composed of focused components
export interface Deal extends BaseEntity, DealCore, DealFinancial, DealRelationships, DealTimeline, DealWorkflow, EntityMetadata {}

export interface DealCurrentStage extends BaseEntity {
  dealId: string;
  pipelineId: string;
  stageId: string;
  enteredAt: Date;
}

export interface DealStageHistory extends BaseEntity {
  dealId: string;
  pipelineId: string;
  fromStageId?: string;
  toStageId: string;
  movedAt: Date;
  movedBy?: string;
  note?: string;
}

// Task-specific focused interfaces
export interface TaskCore {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface TaskSchedule {
  dueDate?: Date;
  completedAt?: Date;
}

export interface TaskTarget {
  targetType: EntityType;
  targetId: string;
  assigneeId?: string;
}

// Main Task interface composed of focused components
export interface Task extends BaseEntity, TaskCore, TaskSchedule, TaskTarget {
  tags?: string[]; // Keep tags here since it doesn't fit EntityMetadata pattern (no notes)
}

export interface CustomFieldDef extends BaseEntity {
  entityType: EntityType;
  name: string;
  fieldKey: string;
  type: CustomFieldType;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  order: number;
  isActive: boolean;
  applicableTypes?: OrganizationType[];
  conditionalLogic?: FieldCondition[];
  validationRules?: ValidationRule[];
}

export interface CustomFieldValue extends BaseEntity {
  fieldDefId: string;
  entityId: string;
  value: any;
}

export interface Activity extends BaseEntity {
  entityType: EntityType;
  entityId: string;
  type: ActivityType;
  description: string;
  meta?: Record<string, any>;
  userId?: string;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  displayOldValue?: string;
  displayNewValue?: string;
}

export interface ChangeLog extends BaseEntity {
  entityType: EntityType;
  entityId: string;
  action: ActivityType;
  summary: string;
  changes: FieldChange[];
  userId: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FieldCondition {
  dependsOn: string;
  condition: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_empty';
  value: any;
  showWhen: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

export interface PipelineTypeMapping {
  [key: string]: string[];
}

export interface OrganizationTypeConfig {
  type: OrganizationType;
  displayName: string;
  description: string;
  defaultPipelines: string[];
  customFields: TypeSpecificFieldDef[];
  features: OrganizationFeature[];
}

export interface TypeSpecificFieldDef {
  key: string;
  name: string;
  type: CustomFieldType;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  conditionalLogic?: FieldCondition[];
  validationRules?: ValidationRule[];
  order: number;
}

export interface OrganizationFeature {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface DealerConversionConfig {
  autoTriggerStages: string[];
  minimumDealValue?: number;
  userRole: string;
  portalFeatures: string[];
  onboardingSequence: OnboardingStep[];
}

export interface OnboardingStep {
  day: number;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface DealerUserCreation {
  organizationId: string;
  dealerName: string;
  primaryContactId?: string;
  email: string;
  temporaryPassword?: string;
  role: string;
  permissions: string[];
  preferredCommunication?: 'email' | 'sms' | 'both';
  notificationSettings?: Record<string, boolean>;
}


// Pagination interfaces for scalable data loading
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ListQuery<T> extends PaginationQuery {
  search?: string;
  filter?: Partial<T>;
}

// Business rule validation framework
export interface BusinessRuleError {
  field?: string;
  code: string;
  message: string;
  context?: Record<string, any>;
}

export interface BusinessRuleValidationResult {
  valid: boolean;
  errors: BusinessRuleError[];
}

export interface BusinessRule<T> {
  name: string;
  validate(entity: T, context?: any): Promise<BusinessRuleValidationResult> | BusinessRuleValidationResult;
}

export interface EntityValidator<T> {
  validateCreate(entity: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<BusinessRuleValidationResult>;
  validateUpdate(id: string, updates: Partial<T>, existing?: T): Promise<BusinessRuleValidationResult>;
  validateDelete(id: string, existing?: T): Promise<BusinessRuleValidationResult>;
}

// Validation context for complex rules
export interface ValidationContext {
  operation: 'create' | 'update' | 'delete';
  userId?: string;
  tenantId: string;
  existing?: any;
  related?: Record<string, any>;
}

// Configurable rule engine for pipeline assignments and business logic
export interface ConfigurableRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'pipeline_assignment' | 'stage_transition' | 'field_visibility' | 'workflow_trigger';
  isActive: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata?: Record<string, any>;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'assign_pipeline' | 'restrict_pipeline' | 'show_field' | 'hide_field' | 'set_default' | 'trigger_workflow';
  target: string;
  value?: any;
  metadata?: Record<string, any>;
}

export interface RuleEvaluationContext {
  entity: any;
  entityType: EntityType;
  user?: any;
  organization?: any;
  existing?: any;
  metadata?: Record<string, any>;
}

export interface RuleEvaluationResult {
  matched: boolean;
  actions: RuleAction[];
  rule?: ConfigurableRule;
}