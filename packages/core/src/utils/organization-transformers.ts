/**
 * Organization Model Transformers
 * 
 * Provides type-safe transformations between different organization models:
 * - Main System ↔ Unified Model
 * - CRM System ↔ Unified Model  
 * - Unified Model validation and normalization
 */

import {
  UnifiedOrganization,
  MainSystemOrg,
  CrmSystemOrganisation,
  UnifiedOrganizationType,
  ContactMethod,
  ContactMethodType,
  MAIN_TO_UNIFIED_TYPE_MAP,
  CRM_TO_UNIFIED_TYPE_MAP
} from '../types/unified-organization';

// Main System → Unified Model
export function transformMainOrgToUnified(mainOrg: MainSystemOrg): UnifiedOrganization {
  return {
    id: mainOrg.id,
    name: mainOrg.name,
    type: MAIN_TO_UNIFIED_TYPE_MAP[mainOrg.type] || UnifiedOrganizationType.DEALER,
    parentOrgId: mainOrg.parentOrgId,
    createdAt: mainOrg.createdAt,
    updatedAt: mainOrg.updatedAt,
    orgId: mainOrg.id, // Legacy compatibility
    source: 'MAIN',
    syncStatus: 'SYNCED'
  };
}

// Unified Model → Main System
export function transformUnifiedToMainOrg(unifiedOrg: UnifiedOrganization): MainSystemOrg {
  // Map unified types back to main system types
  const mainType = unifiedOrg.type === UnifiedOrganizationType.ADMIN ? 'ADMIN' : 'DEALER';
  
  return {
    id: unifiedOrg.id,
    name: unifiedOrg.name,
    type: mainType,
    parentOrgId: unifiedOrg.parentOrgId || null,
    createdAt: unifiedOrg.createdAt,
    updatedAt: unifiedOrg.updatedAt
  };
}

// CRM System → Unified Model
export function transformCrmOrgToUnified(crmOrg: CrmSystemOrganisation): UnifiedOrganization {
  return {
    id: crmOrg.id,
    name: crmOrg.name,
    type: CRM_TO_UNIFIED_TYPE_MAP[crmOrg.type],
    tenantId: crmOrg.tenantId,
    createdAt: crmOrg.createdAt,
    updatedAt: crmOrg.updatedAt,
    source: 'CRM',
    syncStatus: 'SYNCED',
    extended: {
      contactMethods: crmOrg.contactMethods,
      address: crmOrg.address,
      businessInfo: crmOrg.businessInfo,
      notes: crmOrg.notes,
      tags: crmOrg.tags,
      typeSpecificData: crmOrg.typeSpecificData
    }
  };
}

// Unified Model → CRM System
export function transformUnifiedToCrmOrg(unifiedOrg: UnifiedOrganization): Partial<CrmSystemOrganisation> {
  const crmType = Object.entries(CRM_TO_UNIFIED_TYPE_MAP)
    .find(([, unifiedType]) => unifiedType === unifiedOrg.type)?.[0];
  
  if (!crmType) {
    throw new Error(`Cannot map unified type ${unifiedOrg.type} to CRM type`);
  }

  return {
    id: unifiedOrg.id,
    tenantId: unifiedOrg.tenantId || 'default-tenant',
    name: unifiedOrg.name,
    companyId: unifiedOrg.extended?.businessInfo?.companyId || `COMP-${unifiedOrg.id}`,
    type: crmType as any,
    contactMethods: unifiedOrg.extended?.contactMethods || [],
    address: unifiedOrg.extended?.address,
    businessInfo: unifiedOrg.extended?.businessInfo,
    notes: unifiedOrg.extended?.notes,
    tags: unifiedOrg.extended?.tags,
    typeSpecificData: unifiedOrg.extended?.typeSpecificData,
    createdAt: unifiedOrg.createdAt,
    updatedAt: unifiedOrg.updatedAt
  };
}

// Utility functions for data validation and normalization

export function validateUnifiedOrganization(org: UnifiedOrganization): { 
  isValid: boolean; 
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!org.name?.trim()) {
    errors.push('Organization name is required');
  }
  
  if (!org.type) {
    errors.push('Organization type is required');
  }
  
  if (!org.id?.trim()) {
    errors.push('Organization ID is required');
  }

  // Extended validation
  if (org.extended?.contactMethods) {
    const primaryEmails = org.extended.contactMethods.filter(
      cm => cm.type.includes('EMAIL') && cm.isPrimary
    );
    
    if (primaryEmails.length > 1) {
      warnings.push('Multiple primary email addresses found');
    }
    
    if (primaryEmails.length === 0) {
      warnings.push('No primary email address specified');
    }

    // Validate contact method values
    org.extended.contactMethods.forEach((cm, index) => {
      if (!cm.value?.trim()) {
        errors.push(`Contact method ${index + 1} has no value`);
      }
      
      if (cm.type.includes('EMAIL') && !isValidEmail(cm.value)) {
        errors.push(`Invalid email format in contact method ${index + 1}: ${cm.value}`);
      }
    });
  }

  // Business validation
  if (org.type === UnifiedOrganizationType.DEALER && !org.extended?.businessInfo?.companyId) {
    warnings.push('Dealer organizations should have a company ID/license number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function normalizeUnifiedOrganization(org: UnifiedOrganization): UnifiedOrganization {
  const normalized: UnifiedOrganization = {
    ...org,
    name: org.name?.trim(),
    updatedAt: new Date()
  };

  // Normalize contact methods
  if (normalized.extended?.contactMethods) {
    normalized.extended.contactMethods = normalized.extended.contactMethods.map(cm => ({
      ...cm,
      value: cm.value?.trim(),
      label: cm.label?.trim(),
      notes: cm.notes?.trim()
    })).filter(cm => cm.value); // Remove empty contact methods
  }

  // Normalize tags
  if (normalized.extended?.tags) {
    normalized.extended.tags = [...new Set(
      normalized.extended.tags
        .map(tag => tag.trim())
        .filter(tag => tag)
    )];
  }

  return normalized;
}

export function mergeUnifiedOrganizations(
  existing: UnifiedOrganization,
  incoming: UnifiedOrganization,
  strategy: 'MAIN_WINS' | 'CRM_WINS' | 'MERGE_SMART' = 'MERGE_SMART'
): UnifiedOrganization {
  const merged: UnifiedOrganization = { ...existing };

  switch (strategy) {
    case 'MAIN_WINS':
      // Only update non-core fields from incoming
      if (incoming.extended) {
        merged.extended = {
          ...merged.extended,
          ...incoming.extended
        };
      }
      break;

    case 'CRM_WINS':
      // CRM data overrides main system data
      Object.assign(merged, incoming);
      break;

    case 'MERGE_SMART':
    default:
      // Intelligent merging based on data quality and recency
      merged.name = incoming.name || existing.name;
      merged.type = incoming.type || existing.type;
      
      // Merge extended data intelligently
      if (incoming.extended || existing.extended) {
        merged.extended = {
          contactMethods: [
            ...(existing.extended?.contactMethods || []),
            ...(incoming.extended?.contactMethods || [])
          ].reduce((acc, cm) => {
            const existingIndex = acc.findIndex(existing => 
              existing.type === cm.type && existing.value === cm.value
            );
            if (existingIndex >= 0) {
              acc[existingIndex] = cm; // Update existing
            } else {
              acc.push(cm); // Add new
            }
            return acc;
          }, [] as ContactMethod[]),
          
          address: incoming.extended?.address || existing.extended?.address,
          businessInfo: {
            ...existing.extended?.businessInfo,
            ...incoming.extended?.businessInfo
          },
          notes: incoming.extended?.notes || existing.extended?.notes,
          tags: [...new Set([
            ...(existing.extended?.tags || []),
            ...(incoming.extended?.tags || [])
          ])],
          typeSpecificData: {
            ...existing.extended?.typeSpecificData,
            ...incoming.extended?.typeSpecificData
          }
        };
      }
      break;
  }

  merged.updatedAt = new Date();
  merged.syncStatus = 'SYNCED';

  return merged;
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function createDefaultContactMethods(type: UnifiedOrganizationType): ContactMethod[] {
  const defaults: ContactMethod[] = [];

  // Add default email
  defaults.push({
    id: `email-${Date.now()}`,
    type: ContactMethodType.EMAIL_WORK,
    value: '',
    isPrimary: true,
    label: 'Primary Email'
  });

  // Add default phone based on org type
  if (type === UnifiedOrganizationType.DEALER) {
    defaults.push({
      id: `phone-${Date.now()}`,
      type: ContactMethodType.PHONE_WORK,
      value: '',
      isPrimary: true,
      label: 'Business Phone'
    });
  }

  return defaults;
}

export function getOrganizationDisplayName(org: UnifiedOrganization): string {
  return org.name || `${org.type} Organization`;
}

export function getOrganizationPrimaryEmail(org: UnifiedOrganization): string | null {
  const primaryEmail = org.extended?.contactMethods?.find(
    cm => cm.type.includes('EMAIL') && cm.isPrimary
  );
  
  return primaryEmail?.value || 
    org.extended?.contactMethods?.find(cm => cm.type.includes('EMAIL'))?.value ||
    null;
}

export function getOrganizationPrimaryPhone(org: UnifiedOrganization): string | null {
  const primaryPhone = org.extended?.contactMethods?.find(
    cm => cm.type.includes('PHONE') && cm.isPrimary
  );
  
  return primaryPhone?.value ||
    org.extended?.contactMethods?.find(cm => cm.type.includes('PHONE'))?.value ||
    null;
}