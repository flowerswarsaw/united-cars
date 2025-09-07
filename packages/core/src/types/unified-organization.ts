/**
 * Unified Organization Model Architecture
 * 
 * This module provides a unified organization model that bridges the gap between:
 * 1. Main System (`mock-data` Org) - Simple org structure for core business operations
 * 2. CRM System (`crm-core` Organisation) - Rich org structure for relationship management
 * 
 * Design Goals:
 * - Single source of truth for organization data
 * - Backward compatibility with existing systems
 * - Support for both simple and complex organization use cases
 * - Type-safe transformations between models
 */

// Define CRM organization types locally to avoid circular dependencies
export enum CrmOrganizationType {
  DEALER = 'DEALER',
  RETAIL_CLIENT = 'RETAIL_CLIENT',
  EXPEDITOR = 'EXPEDITOR',
  SHIPPER = 'SHIPPER',
  TRANSPORTER = 'TRANSPORTER',
  AUCTION = 'AUCTION',
  PROCESSOR = 'PROCESSOR'
}

// Base entity structure used across all systems
export interface UnifiedBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

// Core organization types that work across both systems
export enum UnifiedOrganizationType {
  // Main system types
  DEALER = 'DEALER',
  ADMIN = 'ADMIN',
  
  // CRM system types (extended)
  RETAIL_CLIENT = 'RETAIL_CLIENT',
  EXPEDITOR = 'EXPEDITOR', 
  SHIPPER = 'SHIPPER',
  TRANSPORTER = 'TRANSPORTER',
  AUCTION = 'AUCTION',
  PROCESSOR = 'PROCESSOR'
}

// Contact method types for flexible communication
export enum ContactMethodType {
  EMAIL_WORK = 'EMAIL_WORK',
  EMAIL_PERSONAL = 'EMAIL_PERSONAL',
  EMAIL_OTHER = 'EMAIL_OTHER',
  PHONE_MOBILE = 'PHONE_MOBILE',
  PHONE_WORK = 'PHONE_WORK',
  PHONE_HOME = 'PHONE_HOME',
  PHONE_FAX = 'PHONE_FAX',
  PHONE_OTHER = 'PHONE_OTHER'
}

export interface ContactMethod {
  id: string;
  type: ContactMethodType;
  value: string;
  isPrimary?: boolean;
  label?: string;
  notes?: string;
}

// Address information
export interface Address {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// Business metadata
export interface BusinessInfo {
  industry?: string;
  size?: string;
  website?: string;
  companyId?: string; // Tax ID, business registration number
}

// Core organization structure - minimal required fields
export interface OrganizationCore {
  name: string;
  type: UnifiedOrganizationType;
  parentOrgId?: string | null;
}

// Extended organization structure - rich CRM features
export interface OrganizationExtended {
  contactMethods: ContactMethod[];
  address?: Address;
  businessInfo?: BusinessInfo;
  notes?: string;
  tags?: string[];
  typeSpecificData?: Record<string, any>;
}

// Main unified organization interface
export interface UnifiedOrganization extends UnifiedBaseEntity, OrganizationCore {
  // Core system compatibility
  orgId?: string; // Legacy field for backward compatibility
  tenantId?: string; // Multi-tenant support
  
  // Extended features (optional)
  extended?: OrganizationExtended;
  
  // System tracking
  source: 'MAIN' | 'CRM' | 'UNIFIED';
  syncedAt?: Date;
  syncStatus?: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'ERROR';
}

// Relationship types for inter-organization connections
export enum OrganizationRelationType {
  PARTNER = 'PARTNER',
  VENDOR = 'VENDOR',
  CLIENT = 'CLIENT',
  SUBSIDIARY = 'SUBSIDIARY',
  PARENT = 'PARENT',
  SHIPPER_DEALER = 'SHIPPER_DEALER',
  AUCTION_DEALER = 'AUCTION_DEALER'
}

export interface OrganizationConnection extends UnifiedBaseEntity {
  fromOrganizationId: string;
  toOrganizationId: string;
  type: OrganizationRelationType;
  description?: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  tenantId?: string;
}

// Type mappings between systems
export const MAIN_TO_UNIFIED_TYPE_MAP: Record<string, UnifiedOrganizationType> = {
  'DEALER': UnifiedOrganizationType.DEALER,
  'ADMIN': UnifiedOrganizationType.ADMIN
};

export const CRM_TO_UNIFIED_TYPE_MAP: Record<CrmOrganizationType, UnifiedOrganizationType> = {
  [CrmOrganizationType.DEALER]: UnifiedOrganizationType.DEALER,
  [CrmOrganizationType.RETAIL_CLIENT]: UnifiedOrganizationType.RETAIL_CLIENT,
  [CrmOrganizationType.EXPEDITOR]: UnifiedOrganizationType.EXPEDITOR,
  [CrmOrganizationType.SHIPPER]: UnifiedOrganizationType.SHIPPER,
  [CrmOrganizationType.TRANSPORTER]: UnifiedOrganizationType.TRANSPORTER,
  [CrmOrganizationType.AUCTION]: UnifiedOrganizationType.AUCTION,
  [CrmOrganizationType.PROCESSOR]: UnifiedOrganizationType.PROCESSOR
};

// Transformation interfaces for system interoperability
export interface MainSystemOrg {
  id: string;
  name: string;
  type: 'DEALER' | 'ADMIN';
  parentOrgId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmSystemOrganisation {
  id: string;
  tenantId: string;
  name: string;
  companyId: string;
  type: CrmOrganizationType;
  contactMethods: ContactMethod[];
  address?: Address;
  businessInfo?: BusinessInfo;
  notes?: string;
  tags?: string[];
  typeSpecificData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Configuration for different organization types
export interface OrganizationTypeConfig {
  type: UnifiedOrganizationType;
  displayName: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultContactMethods: ContactMethodType[];
  allowedRelationships: OrganizationRelationType[];
  features: {
    canHaveSubOrganizations: boolean;
    requiresBusinessLicense: boolean;
    supportsMultiLocation: boolean;
    hasCustomFields: boolean;
  };
}