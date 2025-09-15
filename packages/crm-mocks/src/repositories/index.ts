// Export all enhanced repositories
export { EnhancedOrganisationRepository, enhancedOrganisationRepository } from './enhanced-organisation-repository';
export { EnhancedContactRepository, enhancedContactRepository } from './enhanced-contact-repository';
export { EnhancedDealRepository, enhancedDealRepository } from './enhanced-deal-repository';
export { EnhancedLeadRepository, enhancedLeadRepository } from './enhanced-lead-repository';

// Export enhanced entity interfaces
export type { EnhancedOrganisation } from './enhanced-organisation-repository';
export type { EnhancedContact } from './enhanced-contact-repository';
export type { EnhancedDeal } from './enhanced-deal-repository';
export type { EnhancedLead } from './enhanced-lead-repository';

// Export base repository types
export type { 
  EnhancedEntityBase, 
  CreateOptions, 
  UpdateOptions, 
  DeleteOptions, 
  ListOptions,
  ValidationResult
} from '../enhanced-base-repository';