export enum EntityType {
  ORGANISATION = 'ORGANISATION',
  CONTACT = 'CONTACT',
  LEAD = 'LEAD',
  DEAL = 'DEAL',
  TASK = 'TASK',
  PIPELINE = 'PIPELINE',
  STAGE = 'STAGE'
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
  NOTE_ADDED = 'NOTE_ADDED'
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

export enum PhoneType {
  MOBILE = 'MOBILE',
  WORK = 'WORK',
  HOME = 'HOME',
  FAX = 'FAX',
  OTHER = 'OTHER'
}

export enum EmailType {
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER'
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

export interface ContactMethod {
  id: string;
  type: ContactMethodType;
  value: string;
  subtype?: PhoneType | EmailType;
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

export interface OrganisationConnection {
  id: string;
  fromOrganisationId: string;
  toOrganisationId: string;
  type: OrganisationRelationType;
  description?: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organisation extends BaseEntity {
  name: string;
  companyId: string;
  type: OrganizationType;
  // Legacy fields for backward compatibility
  email?: string;
  phone?: string;
  // New multi-contact system
  contactMethods?: ContactMethod[];
  socialMedia?: SocialMediaLink[];
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  size?: string;
  notes?: string;
  tags?: string[];
  typeSpecificData?: Record<string, any>;
}

export interface Contact extends BaseEntity {
  firstName: string;
  lastName: string;
  // Legacy fields for backward compatibility
  email?: string;
  phone?: string;
  // New multi-contact system
  contactMethods?: ContactMethod[];
  title?: string;
  organisationId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  tags?: string[];
}

export interface Lead extends BaseEntity {
  title: string;
  source?: string;
  organisationId?: string;
  contactId?: string;
  isTarget: boolean;
  score?: number;
  status?: string;
  notes?: string;
  tags?: string[];
}

export interface Pipeline extends BaseEntity {
  name: string;
  description?: string;
  isDefault?: boolean;
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

export interface Deal extends BaseEntity {
  title: string;
  amount?: number;
  currency?: string;
  organisationId?: string;
  contactId?: string;
  status: DealStatus;
  closeDate?: Date;
  probability?: number;
  lossReason?: LossReason;
  notes?: string;
  tags?: string[];
  // The user responsible for this deal (sales manager, admin, etc.)
  responsibleUserId?: string;
  // Legacy field - same as responsibleUserId for backward compatibility
  assigneeId?: string;
  currentStages?: DealCurrentStage[];
  stageHistory?: DealStageHistory[];
}

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

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  targetType: EntityType;
  targetId: string;
  assigneeId?: string;
  tags?: string[];
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

export interface ConvertLeadInput {
  title: string;
  amount?: number;
  currency?: string;
  pipelineId?: string;
  notes?: string;
  assigneeId?: string;
}