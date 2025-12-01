/**
 * CRM Entity Loader
 *
 * Implements EntityLoader interface from crm-automation package.
 * Connects the automation context builder to real CRM repositories.
 *
 * Supports: DEAL, TICKET, ORGANISATION, CONTACT (v1 scope)
 */

import { EntityLoader, EntityType } from '@united-cars/crm-automation';
import { dealRepository, organisationRepository, contactRepository } from '../seeds';
import { ticketRepository } from '../repositories';

// ============================================================================
// CRM ENTITY LOADER
// ============================================================================

export class CRMEntityLoader implements EntityLoader {
  /**
   * Load an entity by type and ID from CRM repositories
   */
  async loadEntity(entityType: EntityType, entityId: string): Promise<any> {
    switch (entityType) {
      case EntityType.DEAL:
        return this.loadDeal(entityId);

      case EntityType.TICKET:
        return this.loadTicket(entityId);

      case EntityType.ORGANISATION:
        return this.loadOrganisation(entityId);

      case EntityType.CONTACT:
        return this.loadContact(entityId);

      // v1 does not support these - return null
      case EntityType.PIPELINE:
      case EntityType.STAGE:
      case EntityType.LEAD:
      case EntityType.TASK:
      case EntityType.ACTIVITY:
        console.warn(`Entity type ${entityType} not supported in v1`);
        return null;

      default:
        console.warn(`Unknown entity type: ${entityType}`);
        return null;
    }
  }

  private async loadDeal(id: string): Promise<any> {
    try {
      return await dealRepository.get(id);
    } catch (error) {
      console.warn(`Failed to load deal ${id}:`, error);
      return null;
    }
  }

  private async loadTicket(id: string): Promise<any> {
    try {
      return await ticketRepository.getById(id);
    } catch (error) {
      console.warn(`Failed to load ticket ${id}:`, error);
      return null;
    }
  }

  private async loadOrganisation(id: string): Promise<any> {
    try {
      return await organisationRepository.get(id);
    } catch (error) {
      console.warn(`Failed to load organisation ${id}:`, error);
      return null;
    }
  }

  private async loadContact(id: string): Promise<any> {
    try {
      return await contactRepository.get(id);
    } catch (error) {
      console.warn(`Failed to load contact ${id}:`, error);
      return null;
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const crmEntityLoader = new CRMEntityLoader();
