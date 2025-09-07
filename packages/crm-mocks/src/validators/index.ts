export { BaseValidator, combineValidationResults } from './base-validator';
export { ContactValidator } from './contact-validator';

// Import classes for instantiation
import { ContactValidator } from './contact-validator';

// Validator instances (remove DealValidator for now to fix build)
export const contactValidator = new ContactValidator();