import { Organisation, OrganizationType, getOrganizationTypeConfig, getApplicablePipelines, EntityType } from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

export class OrganisationRepository extends BaseRepository<Organisation> {
  constructor() {
    super();
    this.setEntityType(EntityType.ORGANISATION);
  }
  async getWithContacts(id: string): Promise<Organisation & { contacts?: any[] }> {
    const org = await this.get(id);
    if (!org) throw new Error('Organisation not found');
    
    // This would normally fetch related contacts
    // For now, we'll just return the org
    return { ...org, contacts: [] };
  }

  // Type-specific methods
  async getByType(type: OrganizationType): Promise<Organisation[]> {
    const all = await this.list();
    return all.filter(org => org.type === type);
  }

  async updateOrganisationType(id: string, type: OrganizationType): Promise<Organisation | null> {
    const org = await this.get(id);
    if (!org) return null;

    // Get type-specific config
    const config = getOrganizationTypeConfig(type);
    
    // Initialize type-specific data if not exists
    if (!org.typeSpecificData) {
      org.typeSpecificData = {};
    }

    // Update organization type
    const updated = await this.update(id, { 
      type,
      typeSpecificData: org.typeSpecificData 
    });

    return updated || null;
  }

  async updateTypeSpecificData(id: string, data: Record<string, any>): Promise<Organisation | null> {
    const org = await this.get(id);
    if (!org) return null;

    const updated = await this.update(id, {
      typeSpecificData: { ...org.typeSpecificData, ...data }
    });

    return updated || null;
  }

  async getApplicablePipelinesForOrg(orgId: string): Promise<string[]> {
    const org = await this.get(orgId);
    if (!org) return [];

    return getApplicablePipelines(org.type);
  }

  async getDealersForConversion(): Promise<Organisation[]> {
    const dealers = await this.getByType(OrganizationType.DEALER);
    // Return dealers that might be candidates for user conversion
    return dealers.filter(dealer => 
      dealer.typeSpecificData?.dealerLicense && 
      dealer.email
    );
  }

  async searchByTypeAndCriteria(type: OrganizationType, criteria: Record<string, any>): Promise<Organisation[]> {
    const orgs = await this.getByType(type);
    
    return orgs.filter(org => {
      if (!org.typeSpecificData) return false;
      
      return Object.entries(criteria).every(([key, value]) => {
        if (key === 'name') return org.name.toLowerCase().includes(value.toLowerCase());
        if (key === 'email') return org.email?.toLowerCase().includes(value.toLowerCase());
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

  async getOrganisationStats(id: string): Promise<{
    type: OrganizationType;
    typeSpecificMetrics: Record<string, any>;
  } | null> {
    const org = await this.get(id);
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

  // Migration helper methods
  async migrateOrganisationType(orgId: string, fromType: OrganizationType, toType: OrganizationType): Promise<Organisation | null> {
    const org = await this.get(orgId);
    if (!org || org.type !== fromType) return null;

    // Backup existing data
    const backupData = { ...org.typeSpecificData };

    // Clear type-specific data for migration
    const updated = await this.update(orgId, {
      type: toType,
      typeSpecificData: {
        _migrationBackup: backupData,
        _migratedFrom: fromType,
        _migrationDate: new Date().toISOString()
      }
    });

    return updated || null;
  }

  async validateTypeSpecificData(orgId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const org = await this.get(orgId);
    if (!org) return { isValid: false, errors: ['Organisation not found'] };

    const errors: string[] = [];
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const organisationRepository = new OrganisationRepository();