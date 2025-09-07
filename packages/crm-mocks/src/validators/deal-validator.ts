import { 
  Deal, 
  BusinessRule, 
  BusinessRuleValidationResult,
  DealStatus,
  LossReason
} from '@united-cars/crm-core';
import { BaseValidator } from './base-validator';

export class DealValidator extends BaseValidator<Deal> {
  protected initializeRules(): void {
    this.addRule(new RequiredTitleRule());
    this.addRule(new PositiveAmountRule());
    this.addRule(new ValidCurrencyRule());
    this.addRule(new ValidProbabilityRule());
    this.addRule(new LostDealRequiresReasonRule());
    this.addRule(new ClosedDealRequiresDateRule());
  }

  async validateCreate(entity: Omit<Deal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<BusinessRuleValidationResult> {
    // Convert to full Deal for validation (mock the missing fields)
    const mockDeal: Deal = {
      ...entity,
      id: 'temp-id',
      tenantId: 'temp-tenant',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.validateWithRules(mockDeal, { operation: 'create' });
  }

  async validateUpdate(id: string, updates: Partial<Deal>, existing?: Deal): Promise<BusinessRuleValidationResult> {
    if (!existing) {
      return this.failure([this.createError(undefined, 'DEAL_NOT_FOUND', 'Deal not found for validation')]);
    }

    // Create merged entity for validation
    const updatedDeal: Deal = { ...existing, ...updates };
    
    // Additional rules for updates
    const updateResult = await this.validateStatusTransition(existing.status, updatedDeal.status);
    const rulesResult = await this.validateWithRules(updatedDeal, { operation: 'update', existing });

    return this.combineResults([updateResult, rulesResult]);
  }

  async validateDelete(id: string, existing?: Deal): Promise<BusinessRuleValidationResult> {
    if (!existing) {
      return this.failure([this.createError(undefined, 'DEAL_NOT_FOUND', 'Deal not found for validation')]);
    }

    // Business rule: Cannot delete won deals
    if (existing.status === DealStatus.WON) {
      return this.failure([
        this.createError('status', 'CANNOT_DELETE_WON_DEAL', 'Cannot delete won deals')
      ]);
    }

    return this.success();
  }

  private async validateStatusTransition(fromStatus: DealStatus, toStatus: DealStatus): Promise<BusinessRuleValidationResult> {
    // Business rule: Cannot change status from WON
    if (fromStatus === DealStatus.WON && toStatus !== DealStatus.WON) {
      return this.failure([
        this.createError('status', 'CANNOT_CHANGE_WON_STATUS', 'Cannot change status of won deals')
      ]);
    }

    // Business rule: Cannot change status from CLOSED  
    if (fromStatus === DealStatus.CLOSED && toStatus !== DealStatus.CLOSED) {
      return this.failure([
        this.createError('status', 'CANNOT_CHANGE_CLOSED_STATUS', 'Cannot change status of closed deals')
      ]);
    }

    return this.success();
  }

  private combineResults(results: BusinessRuleValidationResult[]): BusinessRuleValidationResult {
    const allErrors = results.flatMap(r => r.errors);
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

// Specific business rules for deals
class RequiredTitleRule implements BusinessRule<Deal> {
  name = 'RequiredTitle';
  
  validate(entity: Deal): BusinessRuleValidationResult {
    if (!entity.title || entity.title.trim().length === 0) {
      return {
        valid: false,
        errors: [{
          field: 'title',
          code: 'TITLE_REQUIRED',
          message: 'Deal title is required'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
}

class PositiveAmountRule implements BusinessRule<Deal> {
  name = 'PositiveAmount';
  
  validate(entity: Deal): BusinessRuleValidationResult {
    if (entity.amount !== undefined && entity.amount <= 0) {
      return {
        valid: false,
        errors: [{
          field: 'amount',
          code: 'AMOUNT_MUST_BE_POSITIVE',
          message: 'Deal amount must be positive'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
}

class ValidCurrencyRule implements BusinessRule<Deal> {
  name = 'ValidCurrency';
  
  validate(entity: Deal): BusinessRuleValidationResult {
    if (entity.currency && !['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(entity.currency)) {
      return {
        valid: false,
        errors: [{
          field: 'currency',
          code: 'INVALID_CURRENCY',
          message: 'Invalid currency code'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
}

class ValidProbabilityRule implements BusinessRule<Deal> {
  name = 'ValidProbability';
  
  validate(entity: Deal): BusinessRuleValidationResult {
    if (entity.probability !== undefined && (entity.probability < 0 || entity.probability > 100)) {
      return {
        valid: false,
        errors: [{
          field: 'probability',
          code: 'INVALID_PROBABILITY',
          message: 'Probability must be between 0 and 100'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
}

class LostDealRequiresReasonRule implements BusinessRule<Deal> {
  name = 'LostDealRequiresReason';
  
  validate(entity: Deal): BusinessRuleValidationResult {
    if (entity.status === DealStatus.LOST && !entity.lossReason) {
      return {
        valid: false,
        errors: [{
          field: 'lossReason',
          code: 'LOSS_REASON_REQUIRED',
          message: 'Loss reason is required for lost deals'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
}

class ClosedDealRequiresDateRule implements BusinessRule<Deal> {
  name = 'ClosedDealRequiresDate';
  
  validate(entity: Deal): BusinessRuleValidationResult {
    if ((entity.status === DealStatus.WON || entity.status === DealStatus.LOST || entity.status === DealStatus.CLOSED) && !entity.closeDate) {
      return {
        valid: false,
        errors: [{
          field: 'closeDate',
          code: 'CLOSE_DATE_REQUIRED',
          message: 'Close date is required for closed deals'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
}