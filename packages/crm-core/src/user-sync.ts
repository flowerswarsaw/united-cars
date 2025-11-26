/**
 * User Sync Service
 *
 * Manages synchronization between platform users (authentication layer) and CRM user profiles (sales layer).
 * Ensures consistency between the two user systems and handles automatic CRM profile creation.
 */

import { CRMUserProfile, PlatformUserLink, CRMUserStatus } from './types';
import { CRMUserRepository, CustomRoleRepository } from './repositories';

export interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
}

export interface UserSyncOptions {
  autoCreateProfiles?: boolean;  // Auto-create CRM profiles for new platform users
  syncEmail?: boolean;            // Keep emails in sync
  syncName?: boolean;             // Keep names in sync
  defaultRoleId?: string;         // Default CRM role for new users
  tenantId: string;               // Tenant context
}

export interface UserSyncResult {
  success: boolean;
  crmUserId?: string;
  created?: boolean;
  updated?: boolean;
  errors?: string[];
}

export class UserSyncService {
  constructor(
    private crmUserRepo: CRMUserRepository,
    private customRoleRepo: CustomRoleRepository,
    private options: UserSyncOptions
  ) {}

  /**
   * Sync a platform user to a CRM profile
   * Creates a new CRM profile if it doesn't exist (when autoCreateProfiles is true)
   * Updates existing profile if data has changed
   */
  async syncUser(platformUser: PlatformUser): Promise<UserSyncResult> {
    const errors: string[] = [];

    try {
      // Check if CRM profile already exists
      let crmUser = await this.crmUserRepo.getByPlatformUserId(platformUser.id);

      if (!crmUser) {
        // Create new CRM profile if auto-create is enabled
        if (this.options.autoCreateProfiles) {
          crmUser = await this.createCRMProfile(platformUser);
          return {
            success: true,
            crmUserId: crmUser.id,
            created: true
          };
        } else {
          return {
            success: false,
            errors: ['CRM profile does not exist and auto-create is disabled']
          };
        }
      }

      // Update existing profile if needed
      const updates: Partial<CRMUserProfile> = {};
      let hasUpdates = false;

      if (this.options.syncEmail && crmUser.email !== platformUser.email) {
        updates.email = platformUser.email;
        hasUpdates = true;
      }

      if (this.options.syncName && platformUser.name && crmUser.displayName !== platformUser.name) {
        updates.displayName = platformUser.name;
        hasUpdates = true;
      }

      // Sync active status
      const expectedStatus = platformUser.isActive ? CRMUserStatus.ACTIVE : CRMUserStatus.INACTIVE;
      if (crmUser.status !== expectedStatus) {
        updates.status = expectedStatus;
        hasUpdates = true;
      }

      if (hasUpdates) {
        const updated = await this.crmUserRepo.update(crmUser.id, updates);
        if (!updated) {
          return {
            success: false,
            errors: ['Failed to update CRM profile']
          };
        }
        return {
          success: true,
          crmUserId: crmUser.id,
          updated: true
        };
      }

      return {
        success: true,
        crmUserId: crmUser.id
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Sync multiple platform users to CRM profiles
   */
  async syncUsers(platformUsers: PlatformUser[]): Promise<UserSyncResult[]> {
    const results: UserSyncResult[] = [];

    for (const user of platformUsers) {
      const result = await this.syncUser(user);
      results.push(result);
    }

    return results;
  }

  /**
   * Create a new CRM profile for a platform user
   */
  private async createCRMProfile(platformUser: PlatformUser): Promise<CRMUserProfile> {
    // Get the default role or use a fallback
    let roleId = this.options.defaultRoleId;

    if (!roleId) {
      // Try to find a default role (e.g., "Junior Sales Manager" or the first active role)
      const roles = await this.customRoleRepo.getActiveRoles();
      if (roles.length === 0) {
        throw new Error('No active roles available for CRM profile creation');
      }

      // Prefer a role named "Junior Sales Manager" or similar
      const defaultRole = roles.find(r =>
        r.name.toLowerCase().includes('junior') ||
        r.name.toLowerCase().includes('sales')
      ) || roles[0];

      roleId = defaultRole.id;
    }

    const crmUser = await this.crmUserRepo.create({
      platformUserId: platformUser.id,
      displayName: platformUser.name || platformUser.email,
      email: platformUser.email,
      customRoleId: roleId,
      status: platformUser.isActive ? CRMUserStatus.ACTIVE : CRMUserStatus.INACTIVE,
      isActive: platformUser.isActive,
      teamIds: []
    });

    return crmUser;
  }

  /**
   * Ensure a CRM profile exists for a platform user
   * Creates one if it doesn't exist
   */
  async ensureCRMProfile(platformUser: PlatformUser): Promise<CRMUserProfile | null> {
    const existingProfile = await this.crmUserRepo.getByPlatformUserId(platformUser.id);

    if (existingProfile) {
      return existingProfile;
    }

    if (!this.options.autoCreateProfiles) {
      return null;
    }

    return await this.createCRMProfile(platformUser);
  }

  /**
   * Get CRM profile for a platform user
   */
  async getCRMProfile(platformUserId: string): Promise<CRMUserProfile | undefined> {
    return await this.crmUserRepo.getByPlatformUserId(platformUserId);
  }

  /**
   * Link an existing CRM profile to a platform user
   * Useful for migrating existing CRM data to the new system
   */
  async linkProfile(platformUserId: string, crmUserId: string): Promise<boolean> {
    const crmUser = await this.crmUserRepo.get(crmUserId);
    if (!crmUser) {
      return false;
    }

    // Check if platform user is already linked to a different profile
    const existingLink = await this.crmUserRepo.getByPlatformUserId(platformUserId);
    if (existingLink && existingLink.id !== crmUserId) {
      throw new Error(`Platform user ${platformUserId} is already linked to CRM profile ${existingLink.id}`);
    }

    const updated = await this.crmUserRepo.update(crmUserId, {
      platformUserId
    });

    return !!updated;
  }

  /**
   * Unlink a CRM profile from its platform user
   * Use with caution - this will make the CRM profile orphaned
   */
  async unlinkProfile(crmUserId: string): Promise<boolean> {
    const crmUser = await this.crmUserRepo.get(crmUserId);
    if (!crmUser) {
      return false;
    }

    const updated = await this.crmUserRepo.update(crmUserId, {
      platformUserId: '', // Clear the link
      status: CRMUserStatus.INACTIVE // Deactivate orphaned profiles
    });

    return !!updated;
  }

  /**
   * Bulk sync all platform users
   * Useful for initial migration or periodic sync jobs
   */
  async bulkSync(platformUsers: PlatformUser[]): Promise<{
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ userId: string; errors: string[] }>;
  }> {
    const results = await this.syncUsers(platformUsers);

    const summary = {
      total: results.length,
      created: results.filter(r => r.created).length,
      updated: results.filter(r => r.updated).length,
      failed: results.filter(r => !r.success).length,
      errors: results
        .filter(r => !r.success && r.errors)
        .map((r, i) => ({
          userId: platformUsers[i].id,
          errors: r.errors || []
        }))
    };

    return summary;
  }

  /**
   * Validate sync status for a platform user
   * Returns information about sync state and any discrepancies
   */
  async validateSync(platformUser: PlatformUser): Promise<{
    isLinked: boolean;
    isSynced: boolean;
    discrepancies: string[];
    crmProfile?: CRMUserProfile;
  }> {
    const crmUser = await this.crmUserRepo.getByPlatformUserId(platformUser.id);

    if (!crmUser) {
      return {
        isLinked: false,
        isSynced: false,
        discrepancies: ['No CRM profile found for platform user']
      };
    }

    const discrepancies: string[] = [];

    if (this.options.syncEmail && crmUser.email !== platformUser.email) {
      discrepancies.push(`Email mismatch: platform=${platformUser.email}, crm=${crmUser.email}`);
    }

    if (this.options.syncName && platformUser.name && crmUser.displayName !== platformUser.name) {
      discrepancies.push(`Name mismatch: platform=${platformUser.name}, crm=${crmUser.displayName}`);
    }

    const expectedStatus = platformUser.isActive ? CRMUserStatus.ACTIVE : CRMUserStatus.INACTIVE;
    if (crmUser.status !== expectedStatus) {
      discrepancies.push(`Status mismatch: platform=${expectedStatus}, crm=${crmUser.status}`);
    }

    return {
      isLinked: true,
      isSynced: discrepancies.length === 0,
      discrepancies,
      crmProfile: crmUser
    };
  }
}

/**
 * Create a UserSyncService instance with default options
 */
export function createUserSyncService(
  crmUserRepo: CRMUserRepository,
  customRoleRepo: CustomRoleRepository,
  tenantId: string,
  defaultRoleId?: string
): UserSyncService {
  return new UserSyncService(crmUserRepo, customRoleRepo, {
    autoCreateProfiles: true,
    syncEmail: true,
    syncName: true,
    defaultRoleId,
    tenantId
  });
}
