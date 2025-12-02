/**
 * Tenant Adapter for CRM Platform Integration
 *
 * This adapter implements the CRM TenantProvider interface
 * for United Cars single-tenant setup. Can be extended for multi-tenancy.
 */

import {
  TenantProvider,
  TenantConfig,
  PlatformUser
} from '@united-cars/crm-core';

/**
 * Default tenant ID for United Cars
 */
export const DEFAULT_TENANT_ID = 'united-cars';

/**
 * United Cars implementation of the CRM TenantProvider
 * Currently implements single-tenant mode - can be extended for multi-tenancy
 */
export class UnitedCarsTenantAdapter implements TenantProvider {
  private tenantConfig: TenantConfig;

  constructor(config?: Partial<TenantConfig>) {
    this.tenantConfig = {
      id: DEFAULT_TENANT_ID,
      name: 'United Cars',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        ...config?.settings
      },
      limits: {
        maxUsers: 100,
        maxDeals: 10000,
        maxContacts: 50000,
        maxOrganisations: 10000,
        ...config?.limits
      },
      ...config
    };
  }

  /**
   * Get the tenant ID for a user
   * In single-tenant mode, all users belong to the same tenant
   */
  getTenantId(user: PlatformUser): string {
    // In multi-tenant mode, you would:
    // 1. Look up the user's organization in the database
    // 2. Return the associated tenant ID
    // 3. Handle users belonging to multiple tenants

    // For single-tenant United Cars:
    return DEFAULT_TENANT_ID;
  }

  /**
   * Get tenant configuration
   */
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    if (tenantId !== DEFAULT_TENANT_ID) {
      // In multi-tenant mode, you would fetch from database
      return null;
    }
    return this.tenantConfig;
  }

  /**
   * Check if a tenant is active
   */
  async isTenantActive(tenantId: string): Promise<boolean> {
    // In multi-tenant mode, check subscription status, etc.
    return tenantId === DEFAULT_TENANT_ID;
  }

  /**
   * Update tenant configuration at runtime
   */
  updateConfig(config: Partial<TenantConfig>): void {
    this.tenantConfig = {
      ...this.tenantConfig,
      ...config,
      settings: {
        ...this.tenantConfig.settings,
        ...config.settings
      },
      limits: {
        ...this.tenantConfig.limits,
        ...config.limits
      }
    };
  }
}

/**
 * Singleton instance of the tenant adapter
 */
export const tenantAdapter = new UnitedCarsTenantAdapter();
