/**
 * Organization-scoped repositories that ensure users can only access 
 * data from their own organization context
 */

import { 
  contactRepository, 
  organisationRepository, 
  dealRepository,
  leadRepository,
  taskRepository,
  pipelineRepository,
  activityRepository,
  organisationConnectionRepository
} from './index'
import { 
  Contact, 
  Organisation, 
  Deal,
  Lead,
  Task,
  Pipeline,
  Activity,
  OrganisationConnection,
  Repository,
  DealRepository,
  LeadRepository,
  TaskRepository,
  PipelineRepository,
  ActivityRepository
} from '@united-cars/crm-core'

export interface OrganizationContext {
  userId: string
  orgId: string
  roles: string[]
}

/**
 * Base class for organization-scoped repositories
 * Provides common functionality for filtering data by organization
 */
abstract class OrganizationScopedRepository<T> {
  constructor(protected context: OrganizationContext) {}

  protected hasAdminAccess(): boolean {
    return this.context.roles.some(role => ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(role))
  }

  protected canAccessAllOrganizations(): boolean {
    return this.hasAdminAccess()
  }

  protected filterByOrganization<U extends { tenantId?: string; organisationId?: string }>(items: U[]): U[] {
    if (this.canAccessAllOrganizations()) {
      return items
    }

    return items.filter(item => 
      item.tenantId === this.context.orgId || 
      item.organisationId === this.context.orgId ||
      // For legacy compatibility
      (item as any).orgId === this.context.orgId
    )
  }

  protected ensureOrganizationAccess<U extends { tenantId?: string; organisationId?: string }>(item: U): U {
    if (this.canAccessAllOrganizations()) {
      return item
    }

    // Set organization context if not already set
    if (!item.tenantId && !item.organisationId) {
      return { ...item, tenantId: this.context.orgId }
    }

    // Verify access
    const hasAccess = item.tenantId === this.context.orgId || 
                     item.organisationId === this.context.orgId ||
                     (item as any).orgId === this.context.orgId

    if (!hasAccess) {
      throw new Error('Access denied: Item does not belong to your organization')
    }

    return item
  }
}

/**
 * Organization-scoped Contact Repository
 */
export class OrganizationScopedContactRepository extends OrganizationScopedRepository<Contact> {
  constructor(
    context: OrganizationContext,
    private contactRepo: any
  ) {
    super(context)
  }

  async findAll(): Promise<Contact[]> {
    const contacts = await this.contactRepo.list()
    return this.filterByOrganization(contacts)
  }

  async findById(id: string): Promise<Contact | null> {
    const contact = await this.contactRepo.get(id)
    if (!contact) return null
    
    try {
      this.ensureOrganizationAccess(contact)
      return contact
    } catch {
      return null
    }
  }

  async findByOrganisation(organisationId: string): Promise<Contact[]> {
    // Verify user can access this organization
    if (!this.canAccessAllOrganizations() && organisationId !== this.context.orgId) {
      throw new Error('Access denied: Cannot access contacts from different organization')
    }
    
    return await this.contactRepo.getByOrganisation(organisationId)
  }

  async create(contactData: Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const dataWithOrg = {
      ...contactData,
      tenantId: this.context.orgId,
      createdBy: this.context.userId
    }
    
    return await this.contactRepo.create(dataWithOrg as any)
  }

  async update(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const updatesWithMetadata = {
      ...updates,
      updatedBy: this.context.userId
    }

    return await this.contactRepo.update(id, updatesWithMetadata)
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false

    return await this.contactRepo.remove(id)
  }
}

/**
 * Organization-scoped Organisation Repository
 */
export class OrganizationScopedOrganisationRepository extends OrganizationScopedRepository<Organisation> {
  constructor(
    context: OrganizationContext,
    private orgRepo: any
  ) {
    super(context)
  }

  async findAll(): Promise<Organisation[]> {
    const orgs = await this.orgRepo.list()
    
    if (this.canAccessAllOrganizations()) {
      return orgs
    }

    // Non-admin users can only see their own organization and connected organizations
    return orgs.filter((org: Organisation) => 
      org.id === this.context.orgId || 
      org.tenantId === this.context.orgId
    )
  }

  async findById(id: string): Promise<Organisation | null> {
    const org = await this.orgRepo.get(id)
    if (!org) return null

    if (this.canAccessAllOrganizations()) {
      return org
    }

    // Users can view their own organization and connected organizations
    if (org.id === this.context.orgId || org.tenantId === this.context.orgId) {
      return org
    }

    return null
  }

  async create(orgData: Omit<Organisation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Organisation> {
    // Only admins can create organizations
    if (!this.hasAdminAccess()) {
      throw new Error('Access denied: Only administrators can create organizations')
    }

    const dataWithOrg = {
      ...orgData,
      tenantId: this.context.orgId,
      createdBy: this.context.userId
    }

    return await this.orgRepo.create(dataWithOrg as any)
  }

  async update(id: string, updates: Partial<Organisation>): Promise<Organisation | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    // Users can only update their own organization
    if (!this.canAccessAllOrganizations() && existing.id !== this.context.orgId) {
      throw new Error('Access denied: Cannot update other organizations')
    }

    const updatesWithMetadata = {
      ...updates,
      updatedBy: this.context.userId
    }

    return await this.orgRepo.update(id, updatesWithMetadata)
  }

  async delete(id: string): Promise<boolean> {
    // Only super admins can delete organizations
    if (!this.context.roles.includes('super_admin')) {
      throw new Error('Access denied: Only super administrators can delete organizations')
    }

    return await this.orgRepo.remove(id)
  }
}

/**
 * Organization-scoped Deal Repository
 */
export class OrganizationScopedDealRepository extends OrganizationScopedRepository<Deal> {
  constructor(
    context: OrganizationContext,
    private dealRepo: DealRepository
  ) {
    super(context)
  }

  async findAll(): Promise<Deal[]> {
    const deals = await this.dealRepo.list()
    return this.filterByOrganization(deals)
  }

  async findById(id: string): Promise<Deal | null> {
    const deal = await this.dealRepo.get(id)
    if (!deal) return null
    
    try {
      this.ensureOrganizationAccess(deal)
      return deal
    } catch {
      return null
    }
  }

  async create(dealData: Omit<Deal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const dataWithOrg = {
      ...dealData,
      tenantId: this.context.orgId,
      createdBy: this.context.userId
    }
    
    return await this.dealRepo.create(dataWithOrg as any)
  }

  async update(id: string, updates: Partial<Deal>): Promise<Deal | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const updatesWithMetadata = {
      ...updates,
      updatedBy: this.context.userId
    }

    const result = await this.dealRepo.update(id, updatesWithMetadata)
    return result || null
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false

    return await this.dealRepo.remove(id)
  }

  async moveStage(dealId: string, moveData: any): Promise<Deal | null> {
    const existing = await this.findById(dealId)
    if (!existing) return null

    const result = await this.dealRepo.moveStage(dealId, {
      ...moveData,
      movedBy: this.context.userId
    })
    return result || null
  }
}

/**
 * Repository factory for creating organization-scoped repositories
 */
export class OrganizationScopedRepositoryFactory {
  constructor(
    private contactRepo: any,
    private orgRepo: any,
    private dealRepo: any,
    private leadRepo: any,
    private taskRepo: any,
    private pipelineRepo: any,
    private activityRepo: any,
    private connectionRepo: any
  ) {}

  createContactRepository(context: OrganizationContext): OrganizationScopedContactRepository {
    return new OrganizationScopedContactRepository(context, this.contactRepo)
  }

  createOrganisationRepository(context: OrganizationContext): OrganizationScopedOrganisationRepository {
    return new OrganizationScopedOrganisationRepository(context, this.orgRepo)
  }

  createDealRepository(context: OrganizationContext): OrganizationScopedDealRepository {
    return new OrganizationScopedDealRepository(context, this.dealRepo)
  }

  // Additional scoped repositories can be added here following the same pattern
}

/**
 * Utility function to create organization context from user data
 */
export function createOrganizationContext(user: {
  id: string
  orgId: string
  roles: string[]
}): OrganizationContext {
  return {
    userId: user.id,
    orgId: user.orgId,
    roles: user.roles
  }
}