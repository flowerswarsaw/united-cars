import { Organisation, OrganizationType, getOrganizationTypeConfig, getApplicablePipelines, EntityType } from '@united-cars/crm-core';
import { EnhancedBaseRepository, EnhancedEntityBase, CreateOptions, UpdateOptions, DeleteOptions } from '../enhanced-base-repository';
import { RBACUser } from '@united-cars/crm-core/src/rbac';
import { UniquenessConflict } from '@united-cars/crm-core/src/uniqueness';

// Enhanced Organisation interface with RBAC fields
export interface EnhancedOrganisation extends Organisation, EnhancedEntityBase {}

export class EnhancedOrganisationRepository extends EnhancedBaseRepository<EnhancedOrganisation> {
  constructor() {
    super(EntityType.ORGANISATION, 'organisations');
    
    // Set uniqueness fields for organisations
    this.setUniquenessFields([
      'email',
      'phone',
      'companyId',
      'taxId',
      'socialMediaLinks.url'
    ]);
  }

  // Enhanced create with organization-specific logic
  async createOrganisation(
    data: Omit<EnhancedOrganisation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, 
    options: CreateOptions
  ): Promise<{ success: boolean; data?: EnhancedOrganisation; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    // Auto-assign to the creating user if not specified
    if (!data.assignedUserId) {
      data.assignedUserId = options.user.id;
    }

    // Validate organization type specific data
    const validationResult = this.validateOrganizationType(data);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    return await this.create(data, options);
  }

  // Get organization with contacts (RBAC-aware)
  async getWithContacts(id: string, user: RBACUser): Promise<EnhancedOrganisation & { contacts?: any[] }> {
    const org = await this.get(id, user);
    if (!org) throw new Error('Organisation not found or access denied');
    
    // This would normally fetch related contacts with RBAC filtering
    // For now, we'll just return the org
    return { ...org, contacts: [] };
  }

  // Type-specific methods with RBAC
  async getByType(type: OrganizationType, user: RBACUser): Promise<EnhancedOrganisation[]> {
    const all = await this.list({}, { user });
    return all.filter(org => org.type === type);
  }

  // Update organization type with validation and RBAC
  async updateOrganisationType(
    id: string, 
    type: OrganizationType, 
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedOrganisation; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const org = await this.get(id, options.user);
    if (!org) {
      return { success: false, errors: ['Organisation not found or access denied'] };
    }

    // Get type-specific config
    const config = getOrganizationTypeConfig(type);
    
    // Initialize type-specific data if not exists
    const updatedTypeSpecificData = org.typeSpecificData || {};

    const updateData = {
      type,
      typeSpecificData: updatedTypeSpecificData
    };

    return await this.update(id, updateData, {
      ...options,
      reason: `Changed organization type from ${org.type} to ${type}`
    });
  }

  // Update type-specific data with validation
  async updateTypeSpecificData(
    id: string, 
    data: Record<string, any>, 
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedOrganisation; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const org = await this.get(id, options.user);
    if (!org) {
      return { success: false, errors: ['Organisation not found or access denied'] };
    }

    const updateData = {
      typeSpecificData: { ...org.typeSpecificData, ...data }
    };

    return await this.update(id, updateData, {
      ...options,
      reason: 'Updated type-specific data'
    });
  }

  // Get applicable pipelines for organization (RBAC-aware)
  async getApplicablePipelinesForOrg(orgId: string, user: RBACUser): Promise<string[]> {
    const org = await this.get(orgId, user);
    if (!org) return [];

    return getApplicablePipelines(org.type);
  }

  // Get dealers for conversion (RBAC-aware)
  async getDealersForConversion(user: RBACUser): Promise<EnhancedOrganisation[]> {
    const dealers = await this.getByType(OrganizationType.DEALER, user);
    
    // Return dealers that might be candidates for user conversion
    return dealers.filter(dealer => 
      dealer.typeSpecificData?.dealerLicense && 
      dealer.contactMethods?.some(cm => cm.type.includes('EMAIL'))
    );
  }

  // Search by type and criteria with RBAC
  async searchByTypeAndCriteria(
    type: OrganizationType, 
    criteria: Record<string, any>, 
    user: RBACUser
  ): Promise<EnhancedOrganisation[]> {
    const orgs = await this.getByType(type, user);
    
    return orgs.filter(org => {
      if (!org.typeSpecificData) return false;
      
      return Object.entries(criteria).every(([key, value]) => {
        if (key === 'name') return org.name.toLowerCase().includes(value.toLowerCase());
        if (key === 'email') return org.contactMethods?.some(cm => 
          cm.type.includes('EMAIL') && cm.value.toLowerCase().includes(value.toLowerCase())
        );
        if (key === 'city') return org.city?.toLowerCase().includes(value.toLowerCase());
        
        // Check type-specific data
        const orgValue = org.typeSpecificData?.[key];
        if (Array.isArray(orgValue) && Array.isArray(value)) {
          return value.some(v => orgValue.includes(v));
        }
        return orgValue === value;
      });
    });
  }

  // Get organization stats with RBAC
  async getOrganisationStats(id: string, user: RBACUser): Promise<{
    type: OrganizationType;
    typeSpecificMetrics: Record<string, any>;
  } | null> {
    const org = await this.get(id, user);
    if (!org) return null;

    const metrics: Record<string, any> = {};

    // Type-specific metrics calculation
    switch (org.type) {
      case OrganizationType.DEALER:
        metrics.lotCapacity = org.typeSpecificData?.lotSize || 0;
        metrics.monthlyVolume = org.typeSpecificData?.monthlyVolume || 0;
        metrics.creditLimit = org.typeSpecificData?.creditLimit || 0;
        metrics.specializations = org.typeSpecificData?.specializations || [];
        break;
      
      case OrganizationType.RETAIL_CLIENT:
        metrics.budgetRange = org.typeSpecificData?.budgetRange;
        metrics.vehiclePreferences = org.typeSpecificData?.vehiclePreferences || [];
        metrics.previousPurchases = org.typeSpecificData?.previousPurchases || 0;
        break;

      case OrganizationType.EXPEDITOR:
      case OrganizationType.SHIPPER:
      case OrganizationType.TRANSPORTER:
        metrics.serviceAreas = org.typeSpecificData?.serviceAreas || [];
        metrics.capacity = org.typeSpecificData?.capacity || 0;
        metrics.equipmentTypes = org.typeSpecificData?.equipmentTypes || [];
        metrics.certifications = org.typeSpecificData?.certifications || [];
        break;

      case OrganizationType.AUCTION:
        metrics.auctionType = org.typeSpecificData?.auctionType;
        metrics.volumePerWeek = org.typeSpecificData?.volumePerWeek || 0;
        metrics.apiAccess = org.typeSpecificData?.apiAccess || false;
        metrics.locations = org.typeSpecificData?.locations || [];
        break;

      case OrganizationType.PROCESSOR:
        metrics.processingTypes = org.typeSpecificData?.processingTypes || [];
        metrics.statesCovered = org.typeSpecificData?.statesCovered || [];
        metrics.turnaroundTime = org.typeSpecificData?.turnaroundTime;
        metrics.monthlyCapacity = org.typeSpecificData?.capacity || 0;
        break;
    }

    return {
      type: org.type,
      typeSpecificMetrics: metrics
    };
  }

  // Migration helper methods with RBAC
  async migrateOrganisationType(
    orgId: string, 
    fromType: OrganizationType, 
    toType: OrganizationType, 
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedOrganisation; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const org = await this.get(orgId, options.user);
    if (!org || org.type !== fromType) {
      return { success: false, errors: ['Organisation not found, access denied, or type mismatch'] };
    }

    // Backup existing data
    const backupData = { ...org.typeSpecificData };

    // Clear type-specific data for migration
    const updateData = {
      type: toType,
      typeSpecificData: {
        _migrationBackup: backupData,
        _migratedFrom: fromType,
        _migrationDate: new Date().toISOString()
      }
    };

    return await this.update(orgId, updateData, {
      ...options,
      reason: `Migrated organization type from ${fromType} to ${toType}`
    });
  }

  // Validate type-specific data
  async validateTypeSpecificData(id: string, user: RBACUser): Promise<{ isValid: boolean; errors: string[] }> {
    const org = await this.get(id, user);
    if (!org) return { isValid: false, errors: ['Organisation not found or access denied'] };

    return this.validateOrganizationType(org);
  }

  // Private validation helper
  private validateOrganizationType(org: Partial<EnhancedOrganisation>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!org.type) {
      errors.push('Organization type is required');
      return { isValid: false, errors };
    }

    try {
      const config = getOrganizationTypeConfig(org.type);

      // Validate required fields
      config.customFields.forEach(field => {
        if (field.required) {
          const value = org.typeSpecificData?.[field.key];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors.push(`Required field '${field.name}' is missing or empty`);
          }
        }
      });
    } catch (error) {
      errors.push(`Invalid organization type: ${org.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Enhanced methods for bulk operations with RBAC
  async bulkUpdateAssignment(
    orgIds: string[], 
    newAssignedUserId: string, 
    options: UpdateOptions
  ): Promise<{ 
    success: boolean; 
    updated: string[]; 
    failed: Array<{ id: string; error: string }> 
  }> {
    const results = {
      success: true,
      updated: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const orgId of orgIds) {
      try {
        const result = await this.update(orgId, { assignedUserId: newAssignedUserId }, {
          ...options,
          reason: `Bulk assignment to user ${newAssignedUserId}`
        });
        
        if (result.success) {
          results.updated.push(orgId);
        } else {
          results.failed.push({
            id: orgId,
            error: result.errors?.join(', ') || 'Unknown error'
          });
          results.success = false;
        }
      } catch (error) {
        results.failed.push({
          id: orgId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.success = false;
      }
    }

    return results;
  }

  // Get organizations assigned to specific user
  async getAssignedToUser(userId: string, requestingUser: RBACUser): Promise<EnhancedOrganisation[]> {
    const all = await this.list({}, { user: requestingUser });
    return all.filter(org => org.assignedUserId === userId);
  }

  // Advanced search with RBAC and conflict detection
  async advancedSearch(
    query: {
      searchTerm?: string;
      type?: OrganizationType;
      assignedUserId?: string;
      verified?: boolean;
      hasConflicts?: boolean;
      dateRange?: { from: Date; to: Date };
    },
    user: RBACUser
  ): Promise<EnhancedOrganisation[]> {
    let results = await this.list({}, { user });

    // Apply search filters
    if (query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      results = results.filter(org =>
        org.name.toLowerCase().includes(searchTerm) ||
        (org.companyId && org.companyId.toLowerCase().includes(searchTerm)) ||
        (org.industry && org.industry.toLowerCase().includes(searchTerm)) ||
        (org.email && org.email.toLowerCase().includes(searchTerm))
      );
    }

    if (query.type) {
      results = results.filter(org => org.type === query.type);
    }

    if (query.assignedUserId) {
      results = results.filter(org => org.assignedUserId === query.assignedUserId);
    }

    if (query.verified !== undefined) {
      results = results.filter(org => org.verified === query.verified);
    }

    if (query.dateRange) {
      results = results.filter(org =>
        org.createdAt >= query.dateRange!.from &&
        org.createdAt <= query.dateRange!.to
      );
    }

    return results;
  }
}

export const enhancedOrganisationRepository = new EnhancedOrganisationRepository();