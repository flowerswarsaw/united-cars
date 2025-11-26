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

export interface OrganisationRelationships {
  // The user responsible for this organization (account manager, admin, etc.)
  responsibleUserId?: string;
  // Legacy field - same as responsibleUserId for backward compatibility
  assigneeId?: string;
}

// Main Organisation interface composed of focused components
export interface Organisation extends BaseEntity, OrganisationCore, OrganisationContactInfo, OrganisationBusinessInfo, OrganisationRelationships, Address, EntityMetadata {}

// Contact-specific focused interfaces
export interface ContactCore {
  firstName: string;
  lastName: string;
  type: ContactType;
}

export interface ContactInfo {
  contactMethods: ContactMethod[];
}

export interface ContactRelationships {
  organisationId?: string;
  // The user responsible for this contact (sales manager, admin, etc.)
  responsibleUserId?: string;
  // Legacy field - same as responsibleUserId for backward compatibility
  assigneeId?: string;
}

// Main Contact interface composed of focused components
export interface Contact extends BaseEntity, ContactCore, ContactInfo, ContactRelationships, Address, EntityMetadata {}

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
  // The user responsible for this lead (sales manager, admin, etc.)
  responsibleUserId?: string;
  // Legacy field - same as responsibleUserId for backward compatibility
  assigneeId?: string;
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

// ============================================================================
// CRM USER MANAGEMENT SYSTEM - Custom Roles, Teams, User Profiles
// ============================================================================

/**
 * Entity-level CRUD permissions
 * Used in CustomRole to define what operations are allowed per entity type
 */
export interface EntityPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canReadAll: boolean; // Can view all entities in tenant (not just assigned)
}

/**
 * CRM User Status
 * Separate from platform user status for CRM-specific lifecycle
 */
export enum CRMUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/**
 * Team member role within a team
 */
export enum TeamMemberRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER'
}

/**
 * Custom Role - Dynamic permission system
 * Replaces hardcoded UserRole enum with flexible role management
 */
export interface CustomRole extends BaseEntity {
  // Role Identity
  name: string; // "Regional Sales Manager"
  description?: string; // "Manages regional sales team..."
  color?: string; // "#3b82f6" for UI badges
  isSystem: boolean; // true for migrated hardcoded roles (cannot be deleted)

  // Permissions Matrix - 6 entities × 5 permissions = 30 total permissions
  permissions: {
    organisations: EntityPermissions;
    contacts: EntityPermissions;
    deals: EntityPermissions;
    leads: EntityPermissions;
    tasks: EntityPermissions;
    pipelines: EntityPermissions;
  };

  // Metadata
  isActive: boolean;
}

/**
 * CRM User Profile - Sales-focused user data
 * Links to platform user via platformUserId
 * Maintains separation between auth (platform) and sales (CRM)
 */
export interface CRMUserProfile extends BaseEntity {
  // Platform Link
  platformUserId: string; // Links to MockUser.id or future User.id

  // Display & Identity
  displayName: string; // "Sarah Johnson"
  email: string; // Synced from platform user
  avatar?: string; // Avatar URL or data URI
  title?: string; // "Senior Sales Manager"
  department?: string; // "Sales - West Coast"

  // Role & Permissions
  customRoleId: string; // Links to CustomRole
  permissionOverrides?: {
    // Individual user permission overrides on top of role
    organisations?: Partial<EntityPermissions>;
    contacts?: Partial<EntityPermissions>;
    deals?: Partial<EntityPermissions>;
    leads?: Partial<EntityPermissions>;
    tasks?: Partial<EntityPermissions>;
    pipelines?: Partial<EntityPermissions>;
  };

  // Hierarchy & Teams
  managerId?: string; // Reports to this CRM user
  teamIds: string[]; // Member of these teams

  // Status
  status: CRMUserStatus; // CRM-specific status
  isActive: boolean; // Quick check for active status

  // Metadata already provided by BaseEntity (createdAt, updatedAt, createdBy, updatedBy)
}

/**
 * Team - Organizational grouping of users
 * Enables team-based assignment and reporting
 */
export interface Team extends BaseEntity {
  // Team Identity
  name: string; // "West Coast Sales"
  description?: string;
  color?: string; // For UI visualization

  // Leadership
  leaderId?: string; // CRM user ID

  // Members tracked via TeamMembership
  // memberIds derived from memberships for quick access

  // Metadata
  isActive: boolean;
}

/**
 * Team Membership - Junction table for team members
 * Tracks when users joined teams and their role within the team
 */
export interface TeamMembership {
  id: string;
  teamId: string;
  userId: string; // CRM user ID
  role: TeamMemberRole; // LEADER or MEMBER
  joinedAt: Date;
  tenantId: string;
}

/**
 * User Activity - Audit trail of user actions
 * Tracks all significant CRM operations for reporting and compliance
 */
export interface UserActivity {
  id: string;
  userId: string; // CRM user ID who performed the action
  tenantId: string;

  // Activity Details
  action: ActivityType; // Reuse existing ActivityType enum
  entityType: EntityType;
  entityId: string;
  entityName?: string; // For display without lookup

  // Change Details
  changes?: Array<{
    field: string;
    oldValue?: any;
    newValue?: any;
  }>;

  // Context
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * CRM User Statistics - Performance metrics
 * Calculated on-demand for user profile dashboards
 */
export interface CRMUserStats {
  userId: string;

  // Deal Metrics
  dealsCreated: number;
  dealsWon: number;
  dealsLost: number;
  dealsTotalValue: number;
  dealsWonValue: number;

  // Contact Metrics
  contactsManaged: number;
  contactsCreated: number;

  // Lead Metrics
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number; // Percentage

  // Task Metrics
  tasksCreated: number;
  tasksCompleted: number;
  tasksOverdue: number;

  // Organisation Metrics
  organisationsManaged: number;

  // Time Range
  calculatedAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

/**
 * User Hierarchy Node - For org chart visualization
 * Represents a user and their direct reports in tree structure
 */
export interface UserHierarchyNode {
  user: CRMUserProfile;
  directReports: UserHierarchyNode[];
  level: number; // Depth in hierarchy (0 = root)
}

/**
 * Platform User Link - Metadata for sync tracking
 * Tracks synchronization between platform users and CRM profiles
 */
export interface PlatformUserLink {
  platformUserId: string;
  crmUserProfileId: string;
  lastSyncedAt: Date;
  syncSource: 'AUTO' | 'MANUAL';
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  errorMessage?: string;
}

/**
 * Team with members populated
 * Used in API responses when returning team details
 */
export interface TeamWithMembers extends Team {
  members: Array<{
    membership: TeamMembership;
    user: CRMUserProfile;
  }>;
  memberCount: number;
}

/**
 * Custom Role with user count
 * Used in role management UI to show how many users have each role
 */
export interface CustomRoleWithStats extends CustomRole {
  userCount: number;
}

/**
 * CRM User with resolved role and permissions
 * Used in API/auth layer after fetching user profile and role
 */
export interface CRMUserWithRole {
  id: string;
  platformUserId: string;
  email: string;
  displayName: string;
  tenantId: string;
  customRole: CustomRole;
  permissionOverrides?: CRMUserProfile['permissionOverrides'];
  managerId?: string;
  teamIds: string[];
}

/**
 * User Summary - Lightweight user info for dropdowns/lists
 * Avoids loading full profile when only basic info needed
 */
export interface CRMUserSummary {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  customRoleId: string;
  customRoleName?: string;
  customRoleColor?: string;
  isActive: boolean;
}