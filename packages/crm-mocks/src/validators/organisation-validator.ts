import {
  Organisation,
  BusinessRule,
  BusinessRuleValidationResult
} from '@united-cars/crm-core';
import { BaseValidator } from './base-validator';

// Store reference to the repository for validation rules that need it
let organisationRepository: { list: (filter?: Partial<Organisation>) => Promise<Organisation[]> } | null = null;

export function setOrganisationRepository(repo: typeof organisationRepository): void {
  organisationRepository = repo;
}

export class OrganisationValidator extends BaseValidator<Organisation> {
  protected initializeRules(): void {
    this.addRule(new RequiredNameRule());
    this.addRule(new RequiredTypeRule());
    this.addRule(new UniqueCompanyIdRule());
  }

  async validateCreate(entity: Omit<Organisation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<BusinessRuleValidationResult> {
    const mockOrg: Organisation = {
      ...entity,
      id: 'temp-id',
      tenantId: 'temp-tenant',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Organisation;

    return this.validateWithRules(mockOrg, { operation: 'create' });
  }

  async validateUpdate(id: string, updates: Partial<Organisation>, existing?: Organisation): Promise<BusinessRuleValidationResult> {
    if (!existing) {
      return this.failure([this.createError(undefined, 'ORG_NOT_FOUND', 'Organisation not found for validation')]);
    }

    const updatedOrg: Organisation = { ...existing, ...updates };

    return this.validateWithRules(updatedOrg, { operation: 'update', existing, id });
  }

  async validateDelete(id: string, existing?: Organisation): Promise<BusinessRuleValidationResult> {
    if (!existing) {
      return this.failure([this.createError(undefined, 'ORG_NOT_FOUND', 'Organisation not found for validation')]);
    }

    // Could add rules like: cannot delete if has active deals
    return this.success();
  }
}

class RequiredNameRule implements BusinessRule<Organisation> {
  name = 'RequiredName';

  validate(entity: Organisation): BusinessRuleValidationResult {
    if (!entity.name || entity.name.trim().length === 0) {
      return {
        valid: false,
        errors: [{
          field: 'name',
          code: 'NAME_REQUIRED',
          message: 'Organisation name is required'
        }]
      };
    }

    return { valid: true, errors: [] };
  }
}

class RequiredTypeRule implements BusinessRule<Organisation> {
  name = 'RequiredType';

  validate(entity: Organisation): BusinessRuleValidationResult {
    if (!entity.type) {
      return {
        valid: false,
        errors: [{
          field: 'type',
          code: 'TYPE_REQUIRED',
          message: 'Organisation type is required'
        }]
      };
    }

    return { valid: true, errors: [] };
  }
}

class UniqueCompanyIdRule implements BusinessRule<Organisation> {
  name = 'UniqueCompanyId';

  async validate(entity: Organisation, context?: any): Promise<BusinessRuleValidationResult> {
    // Skip if no companyId provided
    if (!entity.companyId) {
      return { valid: true, errors: [] };
    }

    // Skip uniqueness check if repository not available
    if (!organisationRepository) {
      return { valid: true, errors: [] };
    }

    try {
      // Find organisations with the same companyId
      const existingOrgs = await organisationRepository.list({ companyId: entity.companyId });

      // Check if any existing org has this companyId (excluding current entity on update)
      const isDuplicate = existingOrgs.some(org => {
        // For updates, exclude the current entity
        if (context?.operation === 'update' && context?.id === org.id) {
          return false;
        }
        // For creates, any match is a duplicate (temp-id won't match)
        if (entity.id === 'temp-id') {
          return true;
        }
        return org.id !== entity.id;
      });

      if (isDuplicate) {
        return {
          valid: false,
          errors: [{
            field: 'companyId',
            code: 'COMPANY_ID_NOT_UNIQUE',
            message: 'Company ID already exists'
          }]
        };
      }
    } catch (error) {
      // If repository check fails, allow the operation
      console.warn('UniqueCompanyIdRule: Could not check uniqueness', error);
    }

    return { valid: true, errors: [] };
  }
}
