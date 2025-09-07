import { 
  BusinessRuleError, 
  BusinessRuleValidationResult, 
  EntityValidator,
  BusinessRule 
} from '@united-cars/crm-core';

export abstract class BaseValidator<T> implements EntityValidator<T> {
  protected rules: BusinessRule<T>[] = [];

  constructor() {
    this.initializeRules();
  }

  protected abstract initializeRules(): void;

  protected addRule(rule: BusinessRule<T>): void {
    this.rules.push(rule);
  }

  protected async validateWithRules(entity: T, context?: any): Promise<BusinessRuleValidationResult> {
    const allErrors: BusinessRuleError[] = [];

    for (const rule of this.rules) {
      const result = await Promise.resolve(rule.validate(entity, context));
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }

  protected createError(field: string | undefined, code: string, message: string, context?: Record<string, any>): BusinessRuleError {
    return {
      field,
      code,
      message,
      context
    };
  }

  protected success(): BusinessRuleValidationResult {
    return {
      valid: true,
      errors: []
    };
  }

  protected failure(errors: BusinessRuleError[]): BusinessRuleValidationResult {
    return {
      valid: false,
      errors
    };
  }

  abstract validateCreate(entity: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<BusinessRuleValidationResult>;
  abstract validateUpdate(id: string, updates: Partial<T>, existing?: T): Promise<BusinessRuleValidationResult>;
  abstract validateDelete(id: string, existing?: T): Promise<BusinessRuleValidationResult>;
}

// Helper function to combine validation results
export function combineValidationResults(...results: BusinessRuleValidationResult[]): BusinessRuleValidationResult {
  const allErrors: BusinessRuleError[] = [];
  
  for (const result of results) {
    if (!result.valid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}