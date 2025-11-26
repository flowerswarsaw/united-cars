import { z } from 'zod';
import {
  EntityType,
  DealStatus,
  TaskStatus,
  TaskPriority,
  OrganizationType,
  LossReason,
  ActivityType,
  CustomFieldType,
  ContactMethodType,
  ContactType,
  SocialPlatform,
  OrganisationRelationType,
  CRMUserStatus,
  TeamMemberRole
} from './types';
import {
  validatePostalCode,
  validateRegionCode,
  validateCountryCode,
  validateCurrencyCode
} from './validators';

export const contactMethodSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ContactMethodType),
  value: z.string().min(1),
  isPrimary: z.boolean().optional(),
  label: z.string().optional(),
  notes: z.string().optional()
});

export const socialMediaLinkSchema = z.object({
  id: z.string(),
  platform: z.nativeEnum(SocialPlatform),
  url: z.string().url(),
  username: z.string().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional()
});

export const organisationConnectionSchema = z.object({
  id: z.string(),
  fromOrganisationId: z.string(),
  toOrganisationId: z.string(),
  type: z.nativeEnum(OrganisationRelationType),
  description: z.string().optional(),
  isActive: z.boolean(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Base organisation schema for deriving input schemas
const organisationBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
  companyId: z.string().min(1),
  type: z.nativeEnum(OrganizationType),
  contactMethods: z.array(contactMethodSchema).min(1).refine((methods) =>
    methods.some(method =>
      method.type === 'PHONE'
    ),
    { message: "At least one phone contact method is required" }
  ),
  socialMedia: z.array(socialMediaLinkSchema).optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  // ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)
  country: z.string().length(2).regex(/^[A-Z]{2}$/, 'Must be a valid ISO 3166-1 alpha-2 country code'),
  postalCode: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  typeSpecificData: z.record(z.any()).optional(),
  // The user responsible for this organization (account manager)
  responsibleUserId: z.string().optional(),
  // Legacy field for backward compatibility
  assigneeId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Full organisation schema with cross-field validation
export const organisationSchema = organisationBaseSchema.refine(
  (data) => {
    // Validate country code exists in our list
    if (data.country && !validateCountryCode(data.country)) {
      return false;
    }
    return true;
  },
  { message: "Invalid country code", path: ["country"] }
).refine(
  (data) => {
    // Validate postal code format for the given country
    if (data.postalCode && data.country) {
      return validatePostalCode(data.postalCode, data.country);
    }
    return true;
  },
  { message: "Invalid postal code format for selected country", path: ["postalCode"] }
).refine(
  (data) => {
    // Validate state/region code for the given country
    if (data.state && data.country) {
      return validateRegionCode(data.country, data.state);
    }
    return true;
  },
  { message: "Invalid state/region code for selected country", path: ["state"] }
);

// Base contact schema for deriving input schemas
const contactBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  contactMethods: z.array(contactMethodSchema).min(1).refine((methods) =>
    methods.some(method =>
      method.type === 'PHONE'
    ),
    { message: "At least one phone contact method is required" }
  ),
  type: z.nativeEnum(ContactType),
  organisationId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  // ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)
  country: z.string().length(2).regex(/^[A-Z]{2}$/, 'Must be a valid ISO 3166-1 alpha-2 country code'),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // The user responsible for this contact
  responsibleUserId: z.string().optional(),
  // Legacy field for backward compatibility
  assigneeId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Full contact schema with cross-field validation
export const contactSchema = contactBaseSchema.refine(
  (data) => {
    // Validate country code exists in our list
    if (data.country && !validateCountryCode(data.country)) {
      return false;
    }
    return true;
  },
  { message: "Invalid country code", path: ["country"] }
).refine(
  (data) => {
    // Validate postal code format for the given country
    if (data.postalCode && data.country) {
      return validatePostalCode(data.postalCode, data.country);
    }
    return true;
  },
  { message: "Invalid postal code format for selected country", path: ["postalCode"] }
).refine(
  (data) => {
    // Validate state/region code for the given country
    if (data.state && data.country) {
      return validateRegionCode(data.country, data.state);
    }
    return true;
  },
  { message: "Invalid state/region code for selected country", path: ["state"] }
);

export const leadSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string().min(1),
  source: z.string().optional(),
  organisationId: z.string().optional(),
  contactId: z.string().optional(),
  convertedDealId: z.string().optional(),
  isTarget: z.boolean(),
  score: z.number().optional(),
  status: z.string().optional(),
  // Contact info fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  // Location fields
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  // Archive fields
  isArchived: z.boolean().default(false),
  archivedAt: z.date().optional(),
  archivedReason: z.enum(['converted', 'not_qualified', 'duplicate', 'invalid']).optional(),
  archivedBy: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // The user responsible for this lead
  responsibleUserId: z.string().optional(),
  // Legacy field for backward compatibility
  assigneeId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const stageSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  pipelineId: z.string(),
  name: z.string().min(1),
  order: z.number(),
  color: z.string().optional(),
  wipLimit: z.number().optional(),
  slaTarget: z.number().optional(),
  isClosing: z.boolean().optional(),
  isLost: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const pipelineSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  order: z.number(),
  color: z.string().optional(),
  applicableTypes: z.array(z.nativeEnum(OrganizationType)),
  isTypeSpecific: z.boolean(),
  stages: z.array(stageSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const dealCurrentStageSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  dealId: z.string(),
  pipelineId: z.string(),
  stageId: z.string(),
  enteredAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const dealStageHistorySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  dealId: z.string(),
  pipelineId: z.string(),
  fromStageId: z.string().optional(),
  toStageId: z.string(),
  movedAt: z.date(),
  movedBy: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Base deal schema for deriving input schemas
const dealBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string().min(1),
  amount: z.number().optional(),
  // ISO 4217 currency code (e.g., USD, EUR, GBP)
  currency: z.string().length(3).regex(/^[A-Z]{3}$/, 'Must be a valid ISO 4217 currency code').optional(),
  organisationId: z.string().optional(),
  contactId: z.string().optional(),
  status: z.nativeEnum(DealStatus),
  closeDate: z.date().optional(),
  probability: z.number().min(0).max(100).optional(),
  lossReason: z.nativeEnum(LossReason).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // The user responsible for this deal
  responsibleUserId: z.string().optional(),
  // Legacy field for backward compatibility
  assigneeId: z.string().optional(),
  currentStages: z.array(dealCurrentStageSchema).optional(),
  stageHistory: z.array(dealStageHistorySchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Full deal schema with currency validation
export const dealSchema = dealBaseSchema.refine(
  (data) => {
    // Validate currency code exists in our list
    if (data.currency && !validateCurrencyCode(data.currency)) {
      return false;
    }
    return true;
  },
  { message: "Invalid currency code", path: ["currency"] }
);

export const taskSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  targetType: z.nativeEnum(EntityType),
  targetId: z.string(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const customFieldDefSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entityType: z.nativeEnum(EntityType),
  name: z.string().min(1),
  fieldKey: z.string().min(1),
  type: z.nativeEnum(CustomFieldType),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(),
  order: z.number(),
  isActive: z.boolean(),
  applicableTypes: z.array(z.nativeEnum(OrganizationType)).optional(),
  conditionalLogic: z.array(z.any()).optional(),
  validationRules: z.array(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const customFieldValueSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  fieldDefId: z.string(),
  entityId: z.string(),
  value: z.any(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const activitySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string(),
  type: z.nativeEnum(ActivityType),
  description: z.string(),
  meta: z.record(z.any()).optional(),
  userId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const fieldChangeSchema = z.object({
  field: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  displayOldValue: z.string().optional(),
  displayNewValue: z.string().optional()
});

export const changeLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string(),
  action: z.nativeEnum(ActivityType),
  summary: z.string(),
  changes: z.array(fieldChangeSchema),
  userId: z.string(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Input schemas
export const createOrganisationSchema = organisationBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
}).refine(
  (data) => {
    // Validate country code exists in our list
    if (data.country && !validateCountryCode(data.country)) {
      return false;
    }
    return true;
  },
  { message: "Invalid country code", path: ["country"] }
).refine(
  (data) => {
    // Validate postal code format for the given country
    if (data.postalCode && data.country) {
      return validatePostalCode(data.postalCode, data.country);
    }
    return true;
  },
  { message: "Invalid postal code format for selected country", path: ["postalCode"] }
).refine(
  (data) => {
    // Validate state/region code for the given country
    if (data.state && data.country) {
      return validateRegionCode(data.country, data.state);
    }
    return true;
  },
  { message: "Invalid state/region code for selected country", path: ["state"] }
);

export const updateOrganisationSchema = organisationBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
}).partial().refine(
  (data) => {
    // Validate country code exists in our list (if provided)
    if (data.country && !validateCountryCode(data.country)) {
      return false;
    }
    return true;
  },
  { message: "Invalid country code", path: ["country"] }
).refine(
  (data) => {
    // Validate postal code format for the given country (if both provided)
    if (data.postalCode && data.country) {
      return validatePostalCode(data.postalCode, data.country);
    }
    return true;
  },
  { message: "Invalid postal code format for selected country", path: ["postalCode"] }
).refine(
  (data) => {
    // Validate state/region code for the given country (if both provided)
    if (data.state && data.country) {
      return validateRegionCode(data.country, data.state);
    }
    return true;
  },
  { message: "Invalid state/region code for selected country", path: ["state"] }
);

export const createContactSchema = contactBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
}).refine(
  (data) => {
    // Validate country code exists in our list
    if (data.country && !validateCountryCode(data.country)) {
      return false;
    }
    return true;
  },
  { message: "Invalid country code", path: ["country"] }
).refine(
  (data) => {
    // Validate postal code format for the given country
    if (data.postalCode && data.country) {
      return validatePostalCode(data.postalCode, data.country);
    }
    return true;
  },
  { message: "Invalid postal code format for selected country", path: ["postalCode"] }
).refine(
  (data) => {
    // Validate state/region code for the given country
    if (data.state && data.country) {
      return validateRegionCode(data.country, data.state);
    }
    return true;
  },
  { message: "Invalid state/region code for selected country", path: ["state"] }
);

export const updateContactSchema = contactBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
}).partial().refine(
  (data) => {
    // Validate country code exists in our list (if provided)
    if (data.country && !validateCountryCode(data.country)) {
      return false;
    }
    return true;
  },
  { message: "Invalid country code", path: ["country"] }
).refine(
  (data) => {
    // Validate postal code format for the given country (if both provided)
    if (data.postalCode && data.country) {
      return validatePostalCode(data.postalCode, data.country);
    }
    return true;
  },
  { message: "Invalid postal code format for selected country", path: ["postalCode"] }
).refine(
  (data) => {
    // Validate state/region code for the given country (if both provided)
    if (data.state && data.country) {
      return validateRegionCode(data.country, data.state);
    }
    return true;
  },
  { message: "Invalid state/region code for selected country", path: ["state"] }
);

export const createLeadSchema = leadSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
});

export const updateLeadSchema = createLeadSchema.partial();

export const createDealSchema = dealBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  currentStages: true,
  stageHistory: true
}).refine(
  (data) => {
    // Validate currency code exists in our list
    if (data.currency && !validateCurrencyCode(data.currency)) {
      return false;
    }
    return true;
  },
  { message: "Invalid currency code", path: ["currency"] }
);

export const updateDealSchema = dealBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  currentStages: true,
  stageHistory: true
}).partial().refine(
  (data) => {
    // Validate currency code exists in our list (if provided)
    if (data.currency && !validateCurrencyCode(data.currency)) {
      return false;
    }
    return true;
  },
  { message: "Invalid currency code", path: ["currency"] }
);

export const convertLeadInputSchema = z.object({
  title: z.string().min(1),
  amount: z.number().optional(),
  currency: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  notes: z.string().optional(),
  responsibleUserId: z.string().optional(),
  // Legacy field for backward compatibility
  assigneeId: z.string().optional()
});

export const moveDealInputSchema = z.object({
  pipelineId: z.string(),
  toStageId: z.string(),
  targetIndex: z.number().optional(),
  note: z.string().optional(),
  lossReason: z.nativeEnum(LossReason).optional(),
  movedBy: z.string().optional()
});

export const createTaskSchema = taskSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
});

export const updateTaskSchema = createTaskSchema.partial();

export const createPipelineSchema = pipelineSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  stages: true
});

export const updatePipelineSchema = createPipelineSchema.partial();

export const createStageSchema = stageSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
});

export const updateStageSchema = createStageSchema.partial();

export const reorderStagesSchema = z.object({
  stageIds: z.array(z.string()).min(1)
});

// Organization Type System Schemas
export const fieldConditionSchema = z.object({
  dependsOn: z.string(),
  condition: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'not_empty']),
  value: z.any(),
  showWhen: z.boolean()
});

export const validationRuleSchema = z.object({
  type: z.enum(['required', 'min_length', 'max_length', 'pattern', 'custom']),
  value: z.any().optional(),
  message: z.string().optional()
});

export const typeSpecificFieldDefSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.nativeEnum(CustomFieldType),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(),
  conditionalLogic: z.array(fieldConditionSchema).optional(),
  validationRules: z.array(validationRuleSchema).optional(),
  order: z.number()
});

export const organizationFeatureSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean()
});

export const onboardingStepSchema = z.object({
  day: z.number(),
  action: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const dealerConversionConfigSchema = z.object({
  autoTriggerStages: z.array(z.string()),
  minimumDealValue: z.number().optional(),
  userRole: z.string(),
  portalFeatures: z.array(z.string()),
  onboardingSequence: z.array(onboardingStepSchema)
});

export const dealerUserCreationSchema = z.object({
  organizationId: z.string(),
  dealerName: z.string(),
  primaryContactId: z.string().optional(),
  email: z.string().email(),
  temporaryPassword: z.string().optional(),
  role: z.string(),
  permissions: z.array(z.string()),
  preferredCommunication: z.enum(['email', 'sms', 'both']).optional(),
  notificationSettings: z.record(z.boolean()).optional()
});

export const organizationTypeConfigSchema = z.object({
  type: z.nativeEnum(OrganizationType),
  displayName: z.string(),
  description: z.string(),
  defaultPipelines: z.array(z.string()),
  customFields: z.array(typeSpecificFieldDefSchema),
  features: z.array(organizationFeatureSchema)
});

// ============================================================================
// USER MANAGEMENT & RBAC SCHEMAS
// ============================================================================

// Entity-level CRUD permissions
export const entityPermissionsSchema = z.object({
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
  canReadAll: z.boolean()
});

// Custom role permissions matrix
export const customRolePermissionsSchema = z.object({
  organisations: entityPermissionsSchema,
  contacts: entityPermissionsSchema,
  deals: entityPermissionsSchema,
  leads: entityPermissionsSchema,
  tasks: entityPermissionsSchema,
  pipelines: entityPermissionsSchema
});

// Permission overrides for individual users
export const permissionOverrideSchema = z.object({
  organisations: entityPermissionsSchema.partial().optional(),
  contacts: entityPermissionsSchema.partial().optional(),
  deals: entityPermissionsSchema.partial().optional(),
  leads: entityPermissionsSchema.partial().optional(),
  tasks: entityPermissionsSchema.partial().optional(),
  pipelines: entityPermissionsSchema.partial().optional()
});

// Custom Role schema
export const customRoleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  isSystem: z.boolean().default(false),
  permissions: customRolePermissionsSchema,
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

// Create custom role input
export const createCustomRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  permissions: customRolePermissionsSchema
});

// Update custom role input
export const updateCustomRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  permissions: customRolePermissionsSchema.optional(),
  isActive: z.boolean().optional()
});

// CRM User Profile schema
export const crmUserProfileSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  platformUserId: z.string(),
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address'),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  department: z.string().max(100, 'Department too long').optional(),
  customRoleId: z.string(),
  permissionOverrides: permissionOverrideSchema.optional(),
  managerId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  status: z.nativeEnum(CRMUserStatus).default('ACTIVE'),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

// Create CRM user profile input
export const createCRMUserProfileSchema = z.object({
  platformUserId: z.string(),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  email: z.string().email('Invalid email address'),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  department: z.string().max(100, 'Department too long').optional(),
  customRoleId: z.string(),
  permissionOverrides: permissionOverrideSchema.optional(),
  managerId: z.string().optional(),
  teamIds: z.array(z.string()).default([])
});

// Update CRM user profile input
export const updateCRMUserProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
  email: z.string().email('Invalid email address').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  department: z.string().max(100, 'Department too long').optional(),
  customRoleId: z.string().optional(),
  permissionOverrides: permissionOverrideSchema.optional(),
  managerId: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
  status: z.nativeEnum(CRMUserStatus).optional(),
  isActive: z.boolean().optional()
});

// Team schema
export const teamSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  leaderId: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

// Create team input
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  leaderId: z.string().optional()
});

// Update team input
export const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  leaderId: z.string().optional(),
  isActive: z.boolean().optional()
});

// Team membership schema
export const teamMembershipSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  userId: z.string(),
  role: z.nativeEnum(TeamMemberRole),
  joinedAt: z.coerce.date(),
  tenantId: z.string()
});

// Add team member input
export const addTeamMemberSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(TeamMemberRole).default('MEMBER')
});

// Update team member input
export const updateTeamMemberSchema = z.object({
  role: z.nativeEnum(TeamMemberRole)
});

// User activity schema
export const userActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  action: z.nativeEnum(ActivityType),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string(),
  entityName: z.string().optional(),
  changes: z.array(z.object({
    field: z.string(),
    oldValue: z.any().optional(),
    newValue: z.any().optional()
  })).optional(),
  timestamp: z.coerce.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// CRM user statistics schema
export const crmUserStatsSchema = z.object({
  userId: z.string(),
  dealsCreated: z.number().int().nonnegative(),
  dealsWon: z.number().int().nonnegative(),
  dealsLost: z.number().int().nonnegative(),
  dealsTotalValue: z.number().nonnegative(),
  dealsWonValue: z.number().nonnegative(),
  contactsManaged: z.number().int().nonnegative(),
  contactsCreated: z.number().int().nonnegative(),
  leadsCreated: z.number().int().nonnegative(),
  leadsConverted: z.number().int().nonnegative(),
  conversionRate: z.number().min(0).max(100),
  tasksCreated: z.number().int().nonnegative(),
  tasksCompleted: z.number().int().nonnegative(),
  tasksOverdue: z.number().int().nonnegative(),
  organisationsManaged: z.number().int().nonnegative(),
  calculatedAt: z.coerce.date(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional()
});

// Type inference exports
export type ConvertLeadInput = z.infer<typeof convertLeadInputSchema>;
export type MoveDealInput = z.infer<typeof moveDealInputSchema>;
export type EntityPermissions = z.infer<typeof entityPermissionsSchema>;
export type CustomRolePermissions = z.infer<typeof customRolePermissionsSchema>;
export type PermissionOverride = z.infer<typeof permissionOverrideSchema>;
export type CreateCustomRoleInput = z.infer<typeof createCustomRoleSchema>;
export type UpdateCustomRoleInput = z.infer<typeof updateCustomRoleSchema>;
export type CreateCRMUserProfileInput = z.infer<typeof createCRMUserProfileSchema>;
export type UpdateCRMUserProfileInput = z.infer<typeof updateCRMUserProfileSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;