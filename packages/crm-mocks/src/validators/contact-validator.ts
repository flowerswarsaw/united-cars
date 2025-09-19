import { 
  Contact, 
  BusinessRule, 
  BusinessRuleValidationResult,
  ContactMethodType
} from '@united-cars/crm-core';
import { BaseValidator } from './base-validator';

export class ContactValidator extends BaseValidator<Contact> {
  protected initializeRules(): void {
    this.addRule(new RequiredFirstNameRule());
    this.addRule(new RequiredLastNameRule());
    this.addRule(new RequiredContactMethodRule());
    this.addRule(new UniqueEmailPerContactRule());
    this.addRule(new ValidEmailFormatRule());
    this.addRule(new ValidPhoneFormatRule());
  }

  async validateCreate(entity: Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<BusinessRuleValidationResult> {
    // Convert to full Contact for validation (mock the missing fields)
    const mockContact: Contact = {
      ...entity,
      id: 'temp-id',
      tenantId: 'temp-tenant',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.validateWithRules(mockContact, { operation: 'create' });
  }

  async validateUpdate(id: string, updates: Partial<Contact>, existing?: Contact): Promise<BusinessRuleValidationResult> {
    if (!existing) {
      return this.failure([this.createError(undefined, 'CONTACT_NOT_FOUND', 'Contact not found for validation')]);
    }

    // Create merged entity for validation
    const updatedContact: Contact = { ...existing, ...updates };
    
    return this.validateWithRules(updatedContact, { operation: 'update', existing });
  }

  async validateDelete(id: string, existing?: Contact): Promise<BusinessRuleValidationResult> {
    if (!existing) {
      return this.failure([this.createError(undefined, 'CONTACT_NOT_FOUND', 'Contact not found for validation')]);
    }

    // For now, no restrictions on deleting contacts
    // In the future, could add rules like:
    // - Cannot delete contact if they have active deals
    // - Cannot delete contact if they are the primary contact for an organization
    
    return this.success();
  }
}

// Specific business rules for contacts
class RequiredFirstNameRule implements BusinessRule<Contact> {
  name = 'RequiredFirstName';
  
  validate(entity: Contact): BusinessRuleValidationResult {
    if (!entity.firstName || entity.firstName.trim().length === 0) {
      return {
        valid: false,
        errors: [{
          field: 'firstName',
          code: 'FIRST_NAME_REQUIRED',
          message: 'First name is required'
        }]
      };
    }
    
    if (entity.firstName.trim().length < 2) {
      return {
        valid: false,
        errors: [{
          field: 'firstName',
          code: 'FIRST_NAME_TOO_SHORT',
          message: 'First name must be at least 2 characters'
        }]
      };
    }
    
    return { valid: true, errors: [] };
  }
}

class RequiredLastNameRule implements BusinessRule<Contact> {
  name = 'RequiredLastName';
  
  validate(entity: Contact): BusinessRuleValidationResult {
    if (!entity.lastName || entity.lastName.trim().length === 0) {
      return {
        valid: false,
        errors: [{
          field: 'lastName',
          code: 'LAST_NAME_REQUIRED',
          message: 'Last name is required'
        }]
      };
    }
    
    if (entity.lastName.trim().length < 2) {
      return {
        valid: false,
        errors: [{
          field: 'lastName',
          code: 'LAST_NAME_TOO_SHORT',
          message: 'Last name must be at least 2 characters'
        }]
      };
    }
    
    return { valid: true, errors: [] };
  }
}

class RequiredContactMethodRule implements BusinessRule<Contact> {
  name = 'RequiredContactMethod';
  
  validate(entity: Contact): BusinessRuleValidationResult {
    if (!entity.contactMethods || entity.contactMethods.length === 0) {
      return {
        valid: false,
        errors: [{
          field: 'contactMethods',
          code: 'CONTACT_METHOD_REQUIRED',
          message: 'At least one contact method is required'
        }]
      };
    }
    
    return { valid: true, errors: [] };
  }
}

class UniqueEmailPerContactRule implements BusinessRule<Contact> {
  name = 'UniqueEmailPerContact';
  
  validate(entity: Contact): BusinessRuleValidationResult {
    const emailMethods = entity.contactMethods?.filter(cm => 
      cm.type.includes('EMAIL')
    ) || [];
    
    const emailValues = emailMethods.map(em => em.value.toLowerCase());
    const uniqueEmails = new Set(emailValues);
    
    if (emailValues.length !== uniqueEmails.size) {
      return {
        valid: false,
        errors: [{
          field: 'contactMethods',
          code: 'DUPLICATE_EMAIL',
          message: 'Each email address can only be used once per contact'
        }]
      };
    }
    
    return { valid: true, errors: [] };
  }
}

class ValidEmailFormatRule implements BusinessRule<Contact> {
  name = 'ValidEmailFormat';
  
  validate(entity: Contact): BusinessRuleValidationResult {
    const emailMethods = entity.contactMethods?.filter(cm => 
      cm.type.includes('EMAIL')
    ) || [];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];
    
    for (const emailMethod of emailMethods) {
      if (!emailRegex.test(emailMethod.value)) {
        errors.push({
          field: 'contactMethods',
          code: 'INVALID_EMAIL_FORMAT',
          message: `Invalid email format: ${emailMethod.value}`,
          context: { value: emailMethod.value }
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

class ValidPhoneFormatRule implements BusinessRule<Contact> {
  name = 'ValidPhoneFormat';

  validate(entity: Contact): BusinessRuleValidationResult {
    const phoneMethods = entity.contactMethods?.filter(cm =>
      cm.type.includes('PHONE')
    ) || [];

    const errors = [];

    for (const phoneMethod of phoneMethods) {
      const cleanPhone = phoneMethod.value.replace(/[^\d\+]/g, ''); // Remove formatting

      // Very flexible validation - just check if it has some digits and reasonable length
      if (cleanPhone.length < 3 || cleanPhone.length > 20) {
        errors.push({
          field: 'contactMethods',
          code: 'INVALID_PHONE_FORMAT',
          message: `Invalid phone format: ${phoneMethod.value}`,
          context: { value: phoneMethod.value }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}