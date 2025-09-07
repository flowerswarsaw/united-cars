/**
 * Organization Type Configurations
 * 
 * Defines the structure, validation rules, and behavior for different organization types.
 * This centralized configuration ensures consistency across both main and CRM systems.
 */

import {
  UnifiedOrganizationType,
  OrganizationTypeConfig,
  ContactMethodType,
  OrganizationRelationType
} from '../types/unified-organization';

// Configuration for each organization type
export const ORGANIZATION_TYPE_CONFIGS: Record<UnifiedOrganizationType, OrganizationTypeConfig> = {
  [UnifiedOrganizationType.DEALER]: {
    type: UnifiedOrganizationType.DEALER,
    displayName: 'Dealer',
    description: 'Vehicle dealers who purchase and sell vehicles through our platform',
    requiredFields: ['name', 'type', 'companyId'],
    optionalFields: ['parentOrgId', 'address', 'website', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK, ContactMethodType.PHONE_WORK],
    allowedRelationships: [
      OrganizationRelationType.SHIPPER_DEALER,
      OrganizationRelationType.AUCTION_DEALER,
      OrganizationRelationType.PARTNER,
      OrganizationRelationType.CLIENT
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: true,
      supportsMultiLocation: true,
      hasCustomFields: true
    }
  },

  [UnifiedOrganizationType.ADMIN]: {
    type: UnifiedOrganizationType.ADMIN,
    displayName: 'Administrator',
    description: 'Administrative organizations managing system operations',
    requiredFields: ['name', 'type'],
    optionalFields: ['parentOrgId', 'notes'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK],
    allowedRelationships: [
      OrganizationRelationType.CLIENT,
      OrganizationRelationType.VENDOR
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: false,
      supportsMultiLocation: false,
      hasCustomFields: false
    }
  },

  [UnifiedOrganizationType.RETAIL_CLIENT]: {
    type: UnifiedOrganizationType.RETAIL_CLIENT,
    displayName: 'Retail Client',
    description: 'Individual customers purchasing vehicles',
    requiredFields: ['name', 'type'],
    optionalFields: ['address', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_PERSONAL, ContactMethodType.PHONE_MOBILE],
    allowedRelationships: [
      OrganizationRelationType.CLIENT
    ],
    features: {
      canHaveSubOrganizations: false,
      requiresBusinessLicense: false,
      supportsMultiLocation: false,
      hasCustomFields: true
    }
  },

  [UnifiedOrganizationType.EXPEDITOR]: {
    type: UnifiedOrganizationType.EXPEDITOR,
    displayName: 'Expeditor',
    description: 'Service providers handling documentation and logistics',
    requiredFields: ['name', 'type', 'companyId'],
    optionalFields: ['address', 'website', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK, ContactMethodType.PHONE_WORK],
    allowedRelationships: [
      OrganizationRelationType.VENDOR,
      OrganizationRelationType.PARTNER
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: true,
      supportsMultiLocation: true,
      hasCustomFields: true
    }
  },

  [UnifiedOrganizationType.SHIPPER]: {
    type: UnifiedOrganizationType.SHIPPER,
    displayName: 'Shipper',
    description: 'Logistics companies handling vehicle transportation',
    requiredFields: ['name', 'type', 'companyId'],
    optionalFields: ['address', 'website', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK, ContactMethodType.PHONE_WORK],
    allowedRelationships: [
      OrganizationRelationType.SHIPPER_DEALER,
      OrganizationRelationType.VENDOR,
      OrganizationRelationType.PARTNER
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: true,
      supportsMultiLocation: true,
      hasCustomFields: true
    }
  },

  [UnifiedOrganizationType.TRANSPORTER]: {
    type: UnifiedOrganizationType.TRANSPORTER,
    displayName: 'Transporter',
    description: 'Ground transportation providers for vehicle delivery',
    requiredFields: ['name', 'type', 'companyId'],
    optionalFields: ['address', 'website', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK, ContactMethodType.PHONE_WORK],
    allowedRelationships: [
      OrganizationRelationType.VENDOR,
      OrganizationRelationType.PARTNER
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: true,
      supportsMultiLocation: true,
      hasCustomFields: true
    }
  },

  [UnifiedOrganizationType.AUCTION]: {
    type: UnifiedOrganizationType.AUCTION,
    displayName: 'Auction House',
    description: 'Vehicle auction companies (Copart, IAA, Manheim, etc.)',
    requiredFields: ['name', 'type', 'companyId'],
    optionalFields: ['address', 'website', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK, ContactMethodType.PHONE_WORK],
    allowedRelationships: [
      OrganizationRelationType.AUCTION_DEALER,
      OrganizationRelationType.VENDOR
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: true,
      supportsMultiLocation: true,
      hasCustomFields: true
    }
  },

  [UnifiedOrganizationType.PROCESSOR]: {
    type: UnifiedOrganizationType.PROCESSOR,
    displayName: 'Title Processor',
    description: 'Companies specializing in title processing and documentation',
    requiredFields: ['name', 'type', 'companyId'],
    optionalFields: ['address', 'website', 'notes', 'tags'],
    defaultContactMethods: [ContactMethodType.EMAIL_WORK, ContactMethodType.PHONE_WORK],
    allowedRelationships: [
      OrganizationRelationType.VENDOR,
      OrganizationRelationType.PARTNER
    ],
    features: {
      canHaveSubOrganizations: true,
      requiresBusinessLicense: true,
      supportsMultiLocation: false,
      hasCustomFields: true
    }
  }
};

// Helper functions for working with organization type configurations
export function getOrganizationTypeConfig(type: UnifiedOrganizationType): OrganizationTypeConfig {
  const config = ORGANIZATION_TYPE_CONFIGS[type];
  if (!config) {
    throw new Error(`No configuration found for organization type: ${type}`);
  }
  return config;
}

export function getRequiredFieldsForType(type: UnifiedOrganizationType): string[] {
  return getOrganizationTypeConfig(type).requiredFields;
}

export function getOptionalFieldsForType(type: UnifiedOrganizationType): string[] {
  return getOrganizationTypeConfig(type).optionalFields;
}

export function getDefaultContactMethodsForType(type: UnifiedOrganizationType): ContactMethodType[] {
  return getOrganizationTypeConfig(type).defaultContactMethods;
}

export function getAllowedRelationshipsForType(type: UnifiedOrganizationType): OrganizationRelationType[] {
  return getOrganizationTypeConfig(type).allowedRelationships;
}

export function canHaveSubOrganizations(type: UnifiedOrganizationType): boolean {
  return getOrganizationTypeConfig(type).features.canHaveSubOrganizations;
}

export function requiresBusinessLicense(type: UnifiedOrganizationType): boolean {
  return getOrganizationTypeConfig(type).features.requiresBusinessLicense;
}

export function supportsMultiLocation(type: UnifiedOrganizationType): boolean {
  return getOrganizationTypeConfig(type).features.supportsMultiLocation;
}

export function hasCustomFields(type: UnifiedOrganizationType): boolean {
  return getOrganizationTypeConfig(type).features.hasCustomFields;
}

export function canCreateRelationship(
  fromType: UnifiedOrganizationType,
  toType: UnifiedOrganizationType,
  relationshipType: OrganizationRelationType
): boolean {
  const fromConfig = getOrganizationTypeConfig(fromType);
  const toConfig = getOrganizationTypeConfig(toType);
  
  // Check if the relationship type is allowed for the source organization
  if (!fromConfig.allowedRelationships.includes(relationshipType)) {
    return false;
  }

  // Special relationship rules
  switch (relationshipType) {
    case OrganizationRelationType.SHIPPER_DEALER:
      return fromType === UnifiedOrganizationType.SHIPPER && toType === UnifiedOrganizationType.DEALER;
    
    case OrganizationRelationType.AUCTION_DEALER:
      return fromType === UnifiedOrganizationType.AUCTION && toType === UnifiedOrganizationType.DEALER;
    
    case OrganizationRelationType.PARENT:
      return canHaveSubOrganizations(fromType);
    
    case OrganizationRelationType.SUBSIDIARY:
      return canHaveSubOrganizations(toType);
    
    default:
      return true;
  }
}

// Validation rules for organization types
export function validateOrganizationTypeData(
  type: UnifiedOrganizationType,
  data: Record<string, any>
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const config = getOrganizationTypeConfig(type);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  config.requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  });

  // Type-specific validations
  if (config.features.requiresBusinessLicense && !data.companyId) {
    errors.push('Business license/company ID is required for this organization type');
  }

  if (data.parentOrgId && !config.features.canHaveSubOrganizations) {
    warnings.push('This organization type typically does not have sub-organizations');
  }

  // Contact method validations
  if (data.contactMethods && Array.isArray(data.contactMethods)) {
    const hasRequiredMethods = config.defaultContactMethods.every(requiredMethod => 
      data.contactMethods.some((cm: any) => cm.type === requiredMethod)
    );

    if (!hasRequiredMethods) {
      warnings.push(`Consider adding contact methods: ${config.defaultContactMethods.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Business logic helpers
export function getRecommendedTagsForType(type: UnifiedOrganizationType): string[] {
  const recommendations: Record<UnifiedOrganizationType, string[]> = {
    [UnifiedOrganizationType.DEALER]: ['automotive', 'sales', 'dealer'],
    [UnifiedOrganizationType.ADMIN]: ['administration', 'management'],
    [UnifiedOrganizationType.RETAIL_CLIENT]: ['customer', 'retail'],
    [UnifiedOrganizationType.EXPEDITOR]: ['logistics', 'documentation', 'service'],
    [UnifiedOrganizationType.SHIPPER]: ['logistics', 'transportation', 'shipping'],
    [UnifiedOrganizationType.TRANSPORTER]: ['transportation', 'delivery', 'logistics'],
    [UnifiedOrganizationType.AUCTION]: ['auction', 'automotive', 'wholesale'],
    [UnifiedOrganizationType.PROCESSOR]: ['documentation', 'titles', 'processing']
  };

  return recommendations[type] || [];
}

export function getOrganizationTypeDisplayOrder(): UnifiedOrganizationType[] {
  return [
    UnifiedOrganizationType.ADMIN,
    UnifiedOrganizationType.DEALER,
    UnifiedOrganizationType.AUCTION,
    UnifiedOrganizationType.SHIPPER,
    UnifiedOrganizationType.TRANSPORTER,
    UnifiedOrganizationType.EXPEDITOR,
    UnifiedOrganizationType.PROCESSOR,
    UnifiedOrganizationType.RETAIL_CLIENT
  ];
}

export function getOrganizationTypeColor(type: UnifiedOrganizationType): string {
  const colors: Record<UnifiedOrganizationType, string> = {
    [UnifiedOrganizationType.ADMIN]: '#dc2626',
    [UnifiedOrganizationType.DEALER]: '#2563eb',
    [UnifiedOrganizationType.AUCTION]: '#7c3aed',
    [UnifiedOrganizationType.SHIPPER]: '#059669',
    [UnifiedOrganizationType.TRANSPORTER]: '#0891b2',
    [UnifiedOrganizationType.EXPEDITOR]: '#ea580c',
    [UnifiedOrganizationType.PROCESSOR]: '#9333ea',
    [UnifiedOrganizationType.RETAIL_CLIENT]: '#6b7280'
  };

  return colors[type] || '#6b7280';
}