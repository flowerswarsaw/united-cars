/**
 * Context Builder
 *
 * Builds the EventContext from an AutomationEvent by loading related entities.
 * This context is used for condition evaluation and action execution.
 */

import {
  AutomationEvent,
  EventContext,
  EntityType,
} from '../domain/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Entity loader interface - implement this to connect to your data layer
 */
export interface EntityLoader {
  loadEntity(entityType: EntityType, entityId: string): Promise<any>;
}

/**
 * Relation mapping - defines how to load related entities
 */
interface RelationMapping {
  foreignKey: string;
  relatedType: EntityType;
  contextKey: string;
}

// ============================================================================
// RELATION DEFINITIONS
// ============================================================================

/**
 * Define how entities relate to each other
 * Used to auto-load related entities into context
 */
const ENTITY_RELATIONS: Record<EntityType, RelationMapping[]> = {
  [EntityType.DEAL]: [
    { foreignKey: 'organisationId', relatedType: EntityType.ORGANISATION, contextKey: 'organisation' },
    { foreignKey: 'contactId', relatedType: EntityType.CONTACT, contextKey: 'contact' },
    { foreignKey: 'pipelineId', relatedType: EntityType.PIPELINE, contextKey: 'pipeline' },
    { foreignKey: 'stageId', relatedType: EntityType.STAGE, contextKey: 'stage' },
  ],
  [EntityType.TICKET]: [
    { foreignKey: 'organisationId', relatedType: EntityType.ORGANISATION, contextKey: 'organisation' },
    { foreignKey: 'contactId', relatedType: EntityType.CONTACT, contextKey: 'contact' },
    { foreignKey: 'dealId', relatedType: EntityType.DEAL, contextKey: 'deal' },
  ],
  [EntityType.CONTACT]: [
    { foreignKey: 'organisationId', relatedType: EntityType.ORGANISATION, contextKey: 'organisation' },
  ],
  [EntityType.TASK]: [
    { foreignKey: 'dealId', relatedType: EntityType.DEAL, contextKey: 'deal' },
    { foreignKey: 'organisationId', relatedType: EntityType.ORGANISATION, contextKey: 'organisation' },
    { foreignKey: 'contactId', relatedType: EntityType.CONTACT, contextKey: 'contact' },
  ],
  [EntityType.LEAD]: [
    { foreignKey: 'organisationId', relatedType: EntityType.ORGANISATION, contextKey: 'organisation' },
    { foreignKey: 'contactId', relatedType: EntityType.CONTACT, contextKey: 'contact' },
  ],
  [EntityType.ORGANISATION]: [],
  [EntityType.CONTRACT]: [
    { foreignKey: 'organisationId', relatedType: EntityType.ORGANISATION, contextKey: 'organisation' },
    { foreignKey: 'dealId', relatedType: EntityType.DEAL, contextKey: 'deal' },
  ],
  [EntityType.PIPELINE]: [],
  [EntityType.STAGE]: [
    { foreignKey: 'pipelineId', relatedType: EntityType.PIPELINE, contextKey: 'pipeline' },
  ],
};

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

/**
 * Builds EventContext from an AutomationEvent
 */
export class ContextBuilder {
  private loader: EntityLoader;

  constructor(loader: EntityLoader) {
    this.loader = loader;
  }

  /**
   * Build full context from an event
   * Loads primary entity and all related entities
   */
  async buildContext(event: AutomationEvent): Promise<EventContext> {
    // Load primary entity (or use payload if already full entity)
    const primaryEntity = event.payload?.id
      ? event.payload
      : await this.loader.loadEntity(event.primaryEntity, event.primaryEntityId);

    // Load related entities
    const related = await this.loadRelatedEntities(
      event.primaryEntity,
      primaryEntity
    );

    // Build the context object
    const context: EventContext = {
      event,
      primaryEntity,
      related,
      // Flatten for easy field access
      [this.getEntityKey(event.primaryEntity)]: primaryEntity,
      ...related,
    };

    return context;
  }

  /**
   * Load related entities based on entity type
   */
  private async loadRelatedEntities(
    entityType: EntityType,
    entity: any
  ): Promise<Record<string, any>> {
    const related: Record<string, any> = {};
    const relations = ENTITY_RELATIONS[entityType] || [];

    for (const relation of relations) {
      const foreignKeyValue = entity?.[relation.foreignKey];
      if (foreignKeyValue) {
        try {
          const relatedEntity = await this.loader.loadEntity(
            relation.relatedType,
            foreignKeyValue
          );
          if (relatedEntity) {
            related[relation.contextKey] = relatedEntity;
          }
        } catch (error) {
          // Log but don't fail - related entity might not exist
          console.warn(
            `Failed to load related ${relation.contextKey} for ${entityType}:`,
            error
          );
        }
      }
    }

    return related;
  }

  /**
   * Get the context key for an entity type
   */
  private getEntityKey(entityType: EntityType): string {
    return entityType.toLowerCase();
  }
}

// ============================================================================
// SIMPLE CONTEXT (for testing or when entities are already loaded)
// ============================================================================

/**
 * Build a simple context from pre-loaded entities
 * Use this when you already have the entities loaded
 */
export function buildSimpleContext(
  event: AutomationEvent,
  entities: {
    primary: any;
    organisation?: any;
    contact?: any;
    deal?: any;
    ticket?: any;
    lead?: any;
    pipeline?: any;
    stage?: any;
    [key: string]: any;
  }
): EventContext {
  const primaryKey = event.primaryEntity.toLowerCase();

  return {
    event,
    primaryEntity: entities.primary,
    related: {
      organisation: entities.organisation,
      contact: entities.contact,
      deal: entities.deal,
      ticket: entities.ticket,
      lead: entities.lead,
      pipeline: entities.pipeline,
      stage: entities.stage,
    },
    // Flatten for easy access
    [primaryKey]: entities.primary,
    organisation: entities.organisation,
    contact: entities.contact,
    deal: entities.deal,
    ticket: entities.ticket,
    lead: entities.lead,
    pipeline: entities.pipeline,
    stage: entities.stage,
  };
}

// ============================================================================
// MOCK ENTITY LOADER (for development/testing)
// ============================================================================

/**
 * Mock entity loader that uses CRM mock repositories
 * Replace with real Prisma loader in production
 */
export class MockEntityLoader implements EntityLoader {
  private repositories: Record<EntityType, any>;

  constructor(repositories: Record<EntityType, any>) {
    this.repositories = repositories;
  }

  async loadEntity(entityType: EntityType, entityId: string): Promise<any> {
    const repo = this.repositories[entityType];
    if (!repo) {
      console.warn(`No repository for entity type: ${entityType}`);
      return null;
    }

    // Most repositories have a getById or findById method
    if (typeof repo.getById === 'function') {
      return repo.getById(entityId);
    }
    if (typeof repo.findById === 'function') {
      return repo.findById(entityId);
    }
    if (typeof repo.get === 'function') {
      return repo.get(entityId);
    }

    console.warn(`Repository for ${entityType} has no getById method`);
    return null;
  }
}
