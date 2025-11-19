import { Lead, Contact, Organisation, ContactMethodType } from '@united-cars/crm-core';
import { leadRepository } from '../repositories/lead-repository';
import { contactRepository } from '../repositories/contact-repository';
import { organisationRepository } from '../repositories/organisation-repository';

export interface DuplicateResult {
  isBlocked: boolean;
  conflicts: DuplicateConflict[];
  warnings: DuplicateWarning[];
}

export interface DuplicateConflict {
  type: 'email' | 'phone' | 'companyId';
  value: string;
  existingEntity: {
    id: string;
    type: 'lead' | 'contact' | 'organisation';
    name: string;
    details?: string;
  };
}

export interface DuplicateWarning {
  type: 'companyName';
  value: string;
  existingEntities: {
    id: string;
    type: 'organisation';
    name: string;
    details?: string;
  }[];
}

export class DuplicateDetectionService {

  /**
   * Check for duplicates when creating/updating a contact
   */
  async checkContactDuplicates(
    contactData: {
      firstName: string;
      lastName: string;
      contactMethods: { type: ContactMethodType; value: string }[];
    },
    excludeContactId?: string
  ): Promise<DuplicateResult> {
    const result: DuplicateResult = {
      isBlocked: false,
      conflicts: [],
      warnings: []
    };

    // Check each contact method for duplicates
    for (const method of contactData.contactMethods) {
      if (method.type.toString().includes('EMAIL') && method.value) {
        const emailConflicts = await this.checkEmailUniqueness(method.value, excludeContactId);
        result.conflicts.push(...emailConflicts);
      }

      if (method.type.toString().includes('PHONE') && method.value) {
        const phoneConflicts = await this.checkPhoneUniqueness(method.value, excludeContactId);
        result.conflicts.push(...phoneConflicts);
      }
    }

    result.isBlocked = result.conflicts.length > 0;
    return result;
  }

  /**
   * Check for duplicates when creating/updating an organization
   */
  async checkOrganisationDuplicates(
    orgData: {
      name: string;
      companyId: string;
      contactMethods: { type: ContactMethodType; value: string }[];
    },
    excludeOrgId?: string
  ): Promise<DuplicateResult> {
    const result: DuplicateResult = {
      isBlocked: false,
      conflicts: [],
      warnings: []
    };

    // Check company ID for strict uniqueness
    if (orgData.companyId) {
      const companyIdConflicts = await this.checkCompanyIdUniqueness(orgData.companyId, excludeOrgId);
      result.conflicts.push(...companyIdConflicts);
    }

    // Check contact methods for uniqueness
    for (const method of orgData.contactMethods) {
      if (method.type.toString().includes('EMAIL') && method.value) {
        const emailConflicts = await this.checkEmailUniqueness(method.value, undefined, excludeOrgId);
        result.conflicts.push(...emailConflicts);
      }

      if (method.type.toString().includes('PHONE') && method.value) {
        const phoneConflicts = await this.checkPhoneUniqueness(method.value, undefined, excludeOrgId);
        result.conflicts.push(...phoneConflicts);
      }
    }

    // Check company name for warnings (non-blocking)
    if (orgData.name) {
      const nameWarnings = await this.checkCompanyNameWarnings(orgData.name, excludeOrgId);
      result.warnings.push(...nameWarnings);
    }

    result.isBlocked = result.conflicts.length > 0;
    return result;
  }

  /**
   * Check for duplicates when creating/updating a lead
   */
  async checkLeadDuplicates(
    leadData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
    excludeLeadId?: string
  ): Promise<DuplicateResult> {
    const result: DuplicateResult = {
      isBlocked: false,
      conflicts: [],
      warnings: []
    };

    // Check email uniqueness
    if (leadData.email) {
      const emailConflicts = await this.checkEmailUniqueness(leadData.email, undefined, undefined, excludeLeadId);
      result.conflicts.push(...emailConflicts);
    }

    // Check phone uniqueness
    if (leadData.phone) {
      const phoneConflicts = await this.checkPhoneUniqueness(leadData.phone, undefined, undefined, excludeLeadId);
      result.conflicts.push(...phoneConflicts);
    }

    result.isBlocked = result.conflicts.length > 0;
    return result;
  }

  /**
   * Check email uniqueness across all entities
   */
  private async checkEmailUniqueness(
    email: string,
    excludeContactId?: string,
    excludeOrgId?: string,
    excludeLeadId?: string
  ): Promise<DuplicateConflict[]> {
    const conflicts: DuplicateConflict[] = [];
    const emailLower = email.toLowerCase();

    // Check leads
    const leads = await leadRepository.list();
    for (const lead of leads) {
      if (lead.id !== excludeLeadId && lead.email && lead.email.toLowerCase() === emailLower) {
        conflicts.push({
          type: 'email',
          value: email,
          existingEntity: {
            id: lead.id,
            type: 'lead',
            name: `${lead.firstName} ${lead.lastName}`,
            details: lead.title
          }
        });
      }
    }

    // Check contacts
    const contacts = await contactRepository.list();
    for (const contact of contacts) {
      if (contact.id !== excludeContactId) {
        for (const method of contact.contactMethods || []) {
          if (method.type.toString().includes('EMAIL') && method.value.toLowerCase() === emailLower) {
            conflicts.push({
              type: 'email',
              value: email,
              existingEntity: {
                id: contact.id,
                type: 'contact',
                name: `${contact.firstName} ${contact.lastName}`,
                details: contact.type
              }
            });
          }
        }
      }
    }

    // Check organisations
    const orgs = await organisationRepository.list();
    for (const org of orgs) {
      if (org.id !== excludeOrgId) {
        for (const method of org.contactMethods || []) {
          if (method.type.toString().includes('EMAIL') && method.value.toLowerCase() === emailLower) {
            conflicts.push({
              type: 'email',
              value: email,
              existingEntity: {
                id: org.id,
                type: 'organisation',
                name: org.name,
                details: org.type
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Check phone uniqueness across all entities
   */
  private async checkPhoneUniqueness(
    phone: string,
    excludeContactId?: string,
    excludeOrgId?: string,
    excludeLeadId?: string
  ): Promise<DuplicateConflict[]> {
    const conflicts: DuplicateConflict[] = [];

    // Check leads
    const leads = await leadRepository.list();
    for (const lead of leads) {
      if (lead.id !== excludeLeadId && lead.phone && lead.phone === phone) {
        conflicts.push({
          type: 'phone',
          value: phone,
          existingEntity: {
            id: lead.id,
            type: 'lead',
            name: `${lead.firstName} ${lead.lastName}`,
            details: lead.title
          }
        });
      }
    }

    // Check contacts
    const contacts = await contactRepository.list();
    for (const contact of contacts) {
      if (contact.id !== excludeContactId) {
        for (const method of contact.contactMethods || []) {
          if (method.type.toString().includes('PHONE') && method.value === phone) {
            conflicts.push({
              type: 'phone',
              value: phone,
              existingEntity: {
                id: contact.id,
                type: 'contact',
                name: `${contact.firstName} ${contact.lastName}`,
                details: contact.type
              }
            });
          }
        }
      }
    }

    // Check organisations
    const orgs = await organisationRepository.list();
    for (const org of orgs) {
      if (org.id !== excludeOrgId) {
        for (const method of org.contactMethods || []) {
          if (method.type.toString().includes('PHONE') && method.value === phone) {
            conflicts.push({
              type: 'phone',
              value: phone,
              existingEntity: {
                id: org.id,
                type: 'organisation',
                name: org.name,
                details: org.type
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Check company ID uniqueness (strict)
   */
  private async checkCompanyIdUniqueness(
    companyId: string,
    excludeOrgId?: string
  ): Promise<DuplicateConflict[]> {
    const conflicts: DuplicateConflict[] = [];
    const orgs = await organisationRepository.list();

    for (const org of orgs) {
      if (org.id !== excludeOrgId && org.companyId === companyId) {
        conflicts.push({
          type: 'companyId',
          value: companyId,
          existingEntity: {
            id: org.id,
            type: 'organisation',
            name: org.name,
            details: org.type
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * Check company name for warnings (non-blocking)
   */
  private async checkCompanyNameWarnings(
    name: string,
    excludeOrgId?: string
  ): Promise<DuplicateWarning[]> {
    const warnings: DuplicateWarning[] = [];
    const orgs = await organisationRepository.list();
    const nameLower = name.toLowerCase();

    const similarOrgs = orgs.filter(org =>
      org.id !== excludeOrgId &&
      org.name.toLowerCase() === nameLower
    );

    if (similarOrgs.length > 0) {
      warnings.push({
        type: 'companyName',
        value: name,
        existingEntities: similarOrgs.map(org => ({
          id: org.id,
          type: 'organisation' as const,
          name: org.name,
          details: `${org.type} - ${org.companyId}`
        }))
      });
    }

    return warnings;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();