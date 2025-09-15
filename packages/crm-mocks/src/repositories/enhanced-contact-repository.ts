import { Contact, ContactMethod, SocialMediaLink, EntityType } from '@united-cars/crm-core';
import { EnhancedBaseRepository, EnhancedEntityBase, CreateOptions, UpdateOptions, DeleteOptions } from '../enhanced-base-repository';
import { RBACUser } from '@united-cars/crm-core/src/rbac';
import { UniquenessConflict } from '@united-cars/crm-core/src/uniqueness';

// Enhanced Contact interface with RBAC fields
export interface EnhancedContact extends Contact, EnhancedEntityBase {}

export class EnhancedContactRepository extends EnhancedBaseRepository<EnhancedContact> {
  constructor() {
    super(EntityType.CONTACT, 'contacts');
    
    // Set uniqueness fields for contacts
    this.setUniquenessFields([
      'email',
      'phone',
      'socialMediaLinks.url'
    ]);
  }

  // Enhanced create with contact-specific logic
  async createContact(
    data: Omit<EnhancedContact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, 
    options: CreateOptions
  ): Promise<{ success: boolean; data?: EnhancedContact; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    // Auto-assign to the creating user if not specified
    if (!data.assignedUserId) {
      data.assignedUserId = options.user.id;
    }

    // Validate contact methods
    const validationResult = this.validateContactMethods(data.contactMethods || []);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    // Validate social media links
    const socialValidation = this.validateSocialMediaLinks(data.socialMediaLinks || []);
    if (!socialValidation.isValid) {
      return {
        success: false,
        errors: socialValidation.errors
      };
    }

    return await this.create(data, options);
  }

  // Get contacts by organization with RBAC
  async getByOrganisation(organisationId: string, user: RBACUser): Promise<EnhancedContact[]> {
    const all = await this.list({}, { user });
    return all.filter(contact => contact.organisationId === organisationId);
  }

  // Get contacts by role with RBAC
  async getByRole(role: string, user: RBACUser): Promise<EnhancedContact[]> {
    const all = await this.list({}, { user });
    return all.filter(contact => contact.role === role);
  }

  // Update contact methods with validation and conflict detection
  async updateContactMethods(
    contactId: string,
    contactMethods: ContactMethod[],
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedContact; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const contact = await this.get(contactId, options.user);
    if (!contact) {
      return { success: false, errors: ['Contact not found or access denied'] };
    }

    // Validate new contact methods
    const validationResult = this.validateContactMethods(contactMethods);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    // Check for uniqueness conflicts in new contact methods
    const conflicts: UniquenessConflict[] = [];
    for (const method of contactMethods) {
      if (method.type.includes('EMAIL') || method.type.includes('PHONE')) {
        const field = method.type.includes('EMAIL') ? 'email' : 'phone';
        const conflict = this.checkUniqueness({ [field]: method.value } as Partial<EnhancedContact>, contactId);
        conflicts.push(...conflict);
      }
    }

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts
      };
    }

    return await this.update(contactId, { contactMethods }, {
      ...options,
      reason: 'Updated contact methods'
    });
  }

  // Update social media links with validation
  async updateSocialMediaLinks(
    contactId: string,
    socialMediaLinks: SocialMediaLink[],
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedContact; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const contact = await this.get(contactId, options.user);
    if (!contact) {
      return { success: false, errors: ['Contact not found or access denied'] };
    }

    // Validate social media links
    const validationResult = this.validateSocialMediaLinks(socialMediaLinks);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    return await this.update(contactId, { socialMediaLinks }, {
      ...options,
      reason: 'Updated social media links'
    });
  }

  // Search contacts with advanced filters and RBAC
  async advancedSearch(
    query: {
      searchTerm?: string;
      organisationId?: string;
      role?: string;
      assignedUserId?: string;
      verified?: boolean;
      hasEmail?: boolean;
      hasPhone?: boolean;
      hasSocialMedia?: boolean;
      dateRange?: { from: Date; to: Date };
    },
    user: RBACUser
  ): Promise<EnhancedContact[]> {
    let results = await this.list({}, { user });

    // Apply search filters
    if (query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      results = results.filter(contact =>
        contact.firstName.toLowerCase().includes(searchTerm) ||
        contact.lastName.toLowerCase().includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
        (contact.role && contact.role.toLowerCase().includes(searchTerm)) ||
        (contact.contactMethods && contact.contactMethods.some(cm => 
          cm.value.toLowerCase().includes(searchTerm)
        ))
      );
    }

    if (query.organisationId) {
      results = results.filter(contact => contact.organisationId === query.organisationId);
    }

    if (query.role) {
      results = results.filter(contact => contact.role === query.role);
    }

    if (query.assignedUserId) {
      results = results.filter(contact => contact.assignedUserId === query.assignedUserId);
    }

    if (query.verified !== undefined) {
      results = results.filter(contact => contact.verified === query.verified);
    }

    if (query.hasEmail !== undefined) {
      results = results.filter(contact => {
        const hasEmail = contact.email || 
          contact.contactMethods?.some(cm => cm.type.includes('EMAIL'));
        return hasEmail === query.hasEmail;
      });
    }

    if (query.hasPhone !== undefined) {
      results = results.filter(contact => {
        const hasPhone = contact.phone || 
          contact.contactMethods?.some(cm => cm.type.includes('PHONE'));
        return hasPhone === query.hasPhone;
      });
    }

    if (query.hasSocialMedia !== undefined) {
      results = results.filter(contact => {
        const hasSocialMedia = contact.socialMediaLinks && contact.socialMediaLinks.length > 0;
        return hasSocialMedia === query.hasSocialMedia;
      });
    }

    if (query.dateRange) {
      results = results.filter(contact =>
        contact.createdAt >= query.dateRange!.from &&
        contact.createdAt <= query.dateRange!.to
      );
    }

    return results;
  }

  // Get contacts assigned to specific user
  async getAssignedToUser(userId: string, requestingUser: RBACUser): Promise<EnhancedContact[]> {
    const all = await this.list({}, { user: requestingUser });
    return all.filter(contact => contact.assignedUserId === userId);
  }

  // Bulk update assignment
  async bulkUpdateAssignment(
    contactIds: string[], 
    newAssignedUserId: string, 
    options: UpdateOptions
  ): Promise<{ 
    success: boolean; 
    updated: string[]; 
    failed: Array<{ id: string; error: string }> 
  }> {
    const results = {
      success: true,
      updated: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const contactId of contactIds) {
      try {
        const result = await this.update(contactId, { assignedUserId: newAssignedUserId }, {
          ...options,
          reason: `Bulk assignment to user ${newAssignedUserId}`
        });
        
        if (result.success) {
          results.updated.push(contactId);
        } else {
          results.failed.push({
            id: contactId,
            error: result.errors?.join(', ') || 'Unknown error'
          });
          results.success = false;
        }
      } catch (error) {
        results.failed.push({
          id: contactId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.success = false;
      }
    }

    return results;
  }

  // Get contact activity summary
  async getContactActivity(contactId: string, user: RBACUser): Promise<{
    totalInteractions: number;
    lastContactDate?: Date;
    contactMethods: number;
    socialMediaLinks: number;
    associatedDeals: number;
    associatedTasks: number;
  }> {
    const contact = await this.get(contactId, user);
    if (!contact) {
      throw new Error('Contact not found or access denied');
    }

    // Get history for this contact
    const history = await this.getHistory(contactId, user);

    return {
      totalInteractions: history.length,
      lastContactDate: history.length > 0 ? history[0].timestamp : undefined,
      contactMethods: contact.contactMethods?.length || 0,
      socialMediaLinks: contact.socialMediaLinks?.length || 0,
      associatedDeals: 0, // Would be populated by querying deal repository
      associatedTasks: 0  // Would be populated by querying task repository
    };
  }

  // Merge duplicate contacts (admin only)
  async mergeContacts(
    primaryContactId: string,
    duplicateContactIds: string[],
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedContact; errors?: string[] }> {
    
    // Only admins can merge contacts
    if (options.user.role !== 'admin') {
      return { success: false, errors: ['Only admins can merge contacts'] };
    }

    const primaryContact = await this.get(primaryContactId, options.user);
    if (!primaryContact) {
      return { success: false, errors: ['Primary contact not found'] };
    }

    const duplicateContacts: EnhancedContact[] = [];
    for (const dupId of duplicateContactIds) {
      const contact = await this.get(dupId, options.user);
      if (contact) {
        duplicateContacts.push(contact);
      }
    }

    if (duplicateContacts.length === 0) {
      return { success: false, errors: ['No duplicate contacts found'] };
    }

    // Merge contact methods
    const mergedContactMethods = [...(primaryContact.contactMethods || [])];
    const mergedSocialLinks = [...(primaryContact.socialMediaLinks || [])];

    for (const duplicate of duplicateContacts) {
      // Add unique contact methods
      if (duplicate.contactMethods) {
        for (const method of duplicate.contactMethods) {
          const exists = mergedContactMethods.some(existing => 
            existing.type === method.type && existing.value === method.value
          );
          if (!exists) {
            mergedContactMethods.push(method);
          }
        }
      }

      // Add unique social media links
      if (duplicate.socialMediaLinks) {
        for (const link of duplicate.socialMediaLinks) {
          const exists = mergedSocialLinks.some(existing => 
            existing.platform === link.platform && existing.url === link.url
          );
          if (!exists) {
            mergedSocialLinks.push(link);
          }
        }
      }
    }

    // Update primary contact
    const updateResult = await this.update(primaryContactId, {
      contactMethods: mergedContactMethods,
      socialMediaLinks: mergedSocialLinks
    }, {
      ...options,
      reason: `Merged contacts: ${duplicateContactIds.join(', ')}`
    });

    if (!updateResult.success) {
      return updateResult;
    }

    // Delete duplicate contacts
    for (const dupId of duplicateContactIds) {
      await this.remove(dupId, {
        ...options,
        reason: `Merged into contact ${primaryContactId}`
      });
    }

    return updateResult;
  }

  // Private validation helpers
  private validateContactMethods(contactMethods: ContactMethod[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seenMethods = new Set<string>();

    for (let i = 0; i < contactMethods.length; i++) {
      const method = contactMethods[i];
      
      if (!method.type || !method.value) {
        errors.push(`Contact method ${i + 1}: type and value are required`);
        continue;
      }

      // Check for duplicates
      const methodKey = `${method.type}:${method.value}`;
      if (seenMethods.has(methodKey)) {
        errors.push(`Contact method ${i + 1}: duplicate method found`);
      }
      seenMethods.add(methodKey);

      // Validate email format
      if (method.type.includes('EMAIL')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(method.value)) {
          errors.push(`Contact method ${i + 1}: invalid email format`);
        }
      }

      // Validate phone format (basic validation)
      if (method.type.includes('PHONE')) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(method.value)) {
          errors.push(`Contact method ${i + 1}: invalid phone format`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateSocialMediaLinks(socialMediaLinks: SocialMediaLink[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seenLinks = new Set<string>();

    for (let i = 0; i < socialMediaLinks.length; i++) {
      const link = socialMediaLinks[i];
      
      if (!link.platform || !link.url) {
        errors.push(`Social media link ${i + 1}: platform and url are required`);
        continue;
      }

      // Check for duplicates
      const linkKey = `${link.platform}:${link.url}`;
      if (seenLinks.has(linkKey)) {
        errors.push(`Social media link ${i + 1}: duplicate link found`);
      }
      seenLinks.add(linkKey);

      // Validate URL format
      try {
        new URL(link.url);
      } catch {
        errors.push(`Social media link ${i + 1}: invalid URL format`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const enhancedContactRepository = new EnhancedContactRepository();