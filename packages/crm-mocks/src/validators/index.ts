export { BaseValidator, combineValidationResults } from './base-validator';
export { ContactValidator, setContactRepository } from './contact-validator';
export { OrganisationValidator, setOrganisationRepository } from './organisation-validator';

// Import classes for instantiation
import { ContactValidator } from './contact-validator';
import { OrganisationValidator } from './organisation-validator';

// Validator instances
export const contactValidator = new ContactValidator();
export const organisationValidator = new OrganisationValidator();