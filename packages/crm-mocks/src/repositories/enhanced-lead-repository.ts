import { Lead, LeadStatus, LeadSource, EntityType } from '@united-cars/crm-core';
import { EnhancedBaseRepository, EnhancedEntityBase, CreateOptions, UpdateOptions, DeleteOptions } from '../enhanced-base-repository';
import { RBACUser } from '@united-cars/crm-core/src/rbac';
import { UniquenessConflict } from '@united-cars/crm-core/src/uniqueness';

// Enhanced Lead interface with RBAC fields
export interface EnhancedLead extends Lead, EnhancedEntityBase {
  leadScore?: number; // 0-100 scoring based on engagement
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  engagementLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  conversionProbability?: number; // 0-100
  marketingCampaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralSource?: string;
}

export class EnhancedLeadRepository extends EnhancedBaseRepository<EnhancedLead> {
  constructor() {
    super(EntityType.LEAD, 'leads');
    
    // Leads may have uniqueness constraints on contact information
    this.setUniquenessFields([
      'email',
      'phone'
    ]);
  }

  // Enhanced create with lead-specific logic
  async createLead(
    data: Omit<EnhancedLead, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, 
    options: CreateOptions
  ): Promise<{ success: boolean; data?: EnhancedLead; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    // Auto-assign to the creating user if not specified
    if (!data.assignedUserId) {
      data.assignedUserId = options.user.id;
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = LeadStatus.NEW;
    }

    // Calculate initial lead score
    if (!data.leadScore) {
      data.leadScore = this.calculateInitialLeadScore(data);
    }

    // Set initial engagement level
    if (!data.engagementLevel) {
      data.engagementLevel = this.determineEngagementLevel(data.leadScore || 0);
    }

    // Set next follow-up date
    if (!data.nextFollowUpDate) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + this.getFollowUpDays(data.leadScore || 0));
      data.nextFollowUpDate = followUpDate;
    }

    // Validate lead data
    const validationResult = this.validateLeadData(data);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    return await this.create(data, options);
  }

  // Get leads by status with RBAC
  async getByStatus(status: LeadStatus, user: RBACUser): Promise<EnhancedLead[]> {
    const all = await this.list({}, { user });
    return all.filter(lead => lead.status === status);
  }

  // Get leads by source with RBAC
  async getBySource(source: LeadSource, user: RBACUser): Promise<EnhancedLead[]> {
    const all = await this.list({}, { user });
    return all.filter(lead => lead.source === source);
  }

  // Update lead status with automatic scoring updates
  async updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedLead; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const lead = await this.get(leadId, options.user);
    if (!lead) {
      return { success: false, errors: ['Lead not found or access denied'] };
    }

    const updateData: Partial<EnhancedLead> = {
      status: newStatus,
      lastContactDate: new Date()
    };

    // Update lead score based on status progression
    if (lead.leadScore !== undefined) {
      updateData.leadScore = this.adjustScoreForStatusChange(lead.leadScore, lead.status, newStatus);
      updateData.engagementLevel = this.determineEngagementLevel(updateData.leadScore);
    }

    // Set next follow-up date based on new status
    if (newStatus !== LeadStatus.CONVERTED && newStatus !== LeadStatus.DEAD) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + this.getFollowUpDays(updateData.leadScore || lead.leadScore || 0));
      updateData.nextFollowUpDate = followUpDate;
    }

    return await this.update(leadId, updateData, {
      ...options,
      reason: `Updated lead status from ${lead.status} to ${newStatus}`
    });
  }

  // Convert lead to deal (only for TARGET leads)
  async convertLeadToDeal(
    leadId: string,
    dealData: {
      title: string;
      value: number;
      pipelineId: string;
      stageId: string;
      description?: string;
    },
    options: UpdateOptions
  ): Promise<{ 
    success: boolean; 
    leadData?: EnhancedLead;
    dealId?: string;
    errors?: string[] 
  }> {
    
    const lead = await this.get(leadId, options.user);
    if (!lead) {
      return { success: false, errors: ['Lead not found or access denied'] };
    }

    if (lead.status !== LeadStatus.TARGET) {
      return { success: false, errors: ['Only TARGET leads can be converted to deals'] };
    }

    // Update lead status to CONVERTED
    const leadUpdateResult = await this.updateLeadStatus(leadId, LeadStatus.CONVERTED, options);
    if (!leadUpdateResult.success) {
      return {
        success: false,
        errors: leadUpdateResult.errors
      };
    }

    // Here we would create the deal in the deal repository
    // For now, we'll return a mock deal ID
    const mockDealId = `deal_${Date.now()}`;

    return {
      success: true,
      leadData: leadUpdateResult.data,
      dealId: mockDealId
    };
  }

  // Update lead score manually
  async updateLeadScore(
    leadId: string,
    newScore: number,
    reason: string,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedLead; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    if (newScore < 0 || newScore > 100) {
      return { success: false, errors: ['Lead score must be between 0 and 100'] };
    }

    const lead = await this.get(leadId, options.user);
    if (!lead) {
      return { success: false, errors: ['Lead not found or access denied'] };
    }

    const updateData: Partial<EnhancedLead> = {
      leadScore: newScore,
      engagementLevel: this.determineEngagementLevel(newScore)
    };

    return await this.update(leadId, updateData, {
      ...options,
      reason: `Updated lead score: ${reason}`
    });
  }

  // Mark lead as dead
  async markLeadAsDead(
    leadId: string,
    reason: string,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedLead; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const lead = await this.get(leadId, options.user);
    if (!lead) {
      return { success: false, errors: ['Lead not found or access denied'] };
    }

    const updateData: Partial<EnhancedLead> = {
      status: LeadStatus.DEAD,
      leadScore: 0,
      engagementLevel: 'LOW' as const,
      nextFollowUpDate: undefined
    };

    return await this.update(leadId, updateData, {
      ...options,
      reason: `Marked lead as dead: ${reason}`
    });
  }

  // Revive dead lead
  async reviveLead(
    leadId: string,
    newScore: number,
    reason: string,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedLead; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const lead = await this.get(leadId, options.user);
    if (!lead) {
      return { success: false, errors: ['Lead not found or access denied'] };
    }

    if (lead.status !== LeadStatus.DEAD) {
      return { success: false, errors: ['Only dead leads can be revived'] };
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + this.getFollowUpDays(newScore));

    const updateData: Partial<EnhancedLead> = {
      status: LeadStatus.CONTACTED,
      leadScore: newScore,
      engagementLevel: this.determineEngagementLevel(newScore),
      nextFollowUpDate: followUpDate
    };

    return await this.update(leadId, updateData, {
      ...options,
      reason: `Revived lead: ${reason}`
    });
  }

  // Advanced search with RBAC and lead-specific filters
  async advancedSearch(
    query: {
      searchTerm?: string;
      status?: LeadStatus;
      source?: LeadSource;
      assignedUserId?: string;
      minLeadScore?: number;
      maxLeadScore?: number;
      engagementLevel?: EnhancedLead['engagementLevel'];
      hasFollowUpDue?: boolean;
      overdue?: boolean;
      marketingCampaignId?: string;
      utmSource?: string;
      dateRange?: { from: Date; to: Date };
      lastContactDateRange?: { from: Date; to: Date };
    },
    user: RBACUser
  ): Promise<EnhancedLead[]> {
    let results = await this.list({}, { user });

    // Apply search filters
    if (query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      results = results.filter(lead =>
        lead.firstName.toLowerCase().includes(searchTerm) ||
        lead.lastName.toLowerCase().includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm)) ||
        (lead.phone && lead.phone.includes(searchTerm)) ||
        (lead.companyName && lead.companyName.toLowerCase().includes(searchTerm))
      );
    }

    if (query.status) {
      results = results.filter(lead => lead.status === query.status);
    }

    if (query.source) {
      results = results.filter(lead => lead.source === query.source);
    }

    if (query.assignedUserId) {
      results = results.filter(lead => lead.assignedUserId === query.assignedUserId);
    }

    if (query.minLeadScore !== undefined) {
      results = results.filter(lead => (lead.leadScore || 0) >= query.minLeadScore!);
    }

    if (query.maxLeadScore !== undefined) {
      results = results.filter(lead => (lead.leadScore || 0) <= query.maxLeadScore!);
    }

    if (query.engagementLevel) {
      results = results.filter(lead => lead.engagementLevel === query.engagementLevel);
    }

    if (query.hasFollowUpDue !== undefined) {
      const now = new Date();
      results = results.filter(lead => {
        const hasFollowUp = lead.nextFollowUpDate && lead.nextFollowUpDate <= now;
        return hasFollowUp === query.hasFollowUpDue;
      });
    }

    if (query.overdue !== undefined && query.overdue) {
      const now = new Date();
      results = results.filter(lead => 
        lead.nextFollowUpDate && 
        lead.nextFollowUpDate < now &&
        lead.status !== LeadStatus.CONVERTED &&
        lead.status !== LeadStatus.DEAD
      );
    }

    if (query.marketingCampaignId) {
      results = results.filter(lead => lead.marketingCampaignId === query.marketingCampaignId);
    }

    if (query.utmSource) {
      results = results.filter(lead => lead.utmSource === query.utmSource);
    }

    if (query.dateRange) {
      results = results.filter(lead =>
        lead.createdAt >= query.dateRange!.from &&
        lead.createdAt <= query.dateRange!.to
      );
    }

    if (query.lastContactDateRange) {
      results = results.filter(lead => 
        lead.lastContactDate &&
        lead.lastContactDate >= query.lastContactDateRange!.from &&
        lead.lastContactDate <= query.lastContactDateRange!.to
      );
    }

    return results;
  }

  // Get leads assigned to specific user
  async getAssignedToUser(userId: string, requestingUser: RBACUser): Promise<EnhancedLead[]> {
    const all = await this.list({}, { user: requestingUser });
    return all.filter(lead => lead.assignedUserId === userId);
  }

  // Get leads due for follow-up
  async getLeadsDueForFollowUp(user: RBACUser): Promise<EnhancedLead[]> {
    const now = new Date();
    const all = await this.list({}, { user });
    return all.filter(lead => 
      lead.nextFollowUpDate && 
      lead.nextFollowUpDate <= now &&
      lead.status !== LeadStatus.CONVERTED &&
      lead.status !== LeadStatus.DEAD
    );
  }

  // Get lead metrics for user
  async getLeadMetrics(userId: string, requestingUser: RBACUser): Promise<{
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    qualifiedLeads: number;
    targetLeads: number;
    convertedLeads: number;
    deadLeads: number;
    averageLeadScore: number;
    conversionRate: number;
    leadsOverdue: number;
  }> {
    const userLeads = await this.getAssignedToUser(userId, requestingUser);
    
    const totalLeads = userLeads.length;
    const newLeads = userLeads.filter(l => l.status === LeadStatus.NEW).length;
    const contactedLeads = userLeads.filter(l => l.status === LeadStatus.CONTACTED).length;
    const qualifiedLeads = userLeads.filter(l => l.status === LeadStatus.QUALIFIED).length;
    const targetLeads = userLeads.filter(l => l.status === LeadStatus.TARGET).length;
    const convertedLeads = userLeads.filter(l => l.status === LeadStatus.CONVERTED).length;
    const deadLeads = userLeads.filter(l => l.status === LeadStatus.DEAD).length;
    
    const averageLeadScore = userLeads.length > 0 
      ? userLeads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / userLeads.length 
      : 0;
    
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    const now = new Date();
    const leadsOverdue = userLeads.filter(l => 
      l.nextFollowUpDate && 
      l.nextFollowUpDate < now &&
      l.status !== LeadStatus.CONVERTED &&
      l.status !== LeadStatus.DEAD
    ).length;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      targetLeads,
      convertedLeads,
      deadLeads,
      averageLeadScore,
      conversionRate,
      leadsOverdue
    };
  }

  // Bulk update assignment
  async bulkUpdateAssignment(
    leadIds: string[], 
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

    for (const leadId of leadIds) {
      try {
        const result = await this.update(leadId, { assignedUserId: newAssignedUserId }, {
          ...options,
          reason: `Bulk assignment to user ${newAssignedUserId}`
        });
        
        if (result.success) {
          results.updated.push(leadId);
        } else {
          results.failed.push({
            id: leadId,
            error: result.errors?.join(', ') || 'Unknown error'
          });
          results.success = false;
        }
      } catch (error) {
        results.failed.push({
          id: leadId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.success = false;
      }
    }

    return results;
  }

  // Private helper methods
  private calculateInitialLeadScore(lead: Partial<EnhancedLead>): number {
    let score = 20; // Base score

    // Add points for contact information completeness
    if (lead.email) score += 15;
    if (lead.phone) score += 15;
    if (lead.companyName) score += 10;

    // Add points based on source quality
    switch (lead.source) {
      case LeadSource.REFERRAL:
        score += 25;
        break;
      case LeadSource.WEBSITE:
        score += 20;
        break;
      case LeadSource.SOCIAL_MEDIA:
        score += 15;
        break;
      case LeadSource.EMAIL:
        score += 10;
        break;
      case LeadSource.COLD_CALL:
        score += 5;
        break;
    }

    // Add points for marketing attribution
    if (lead.utmCampaign) score += 10;
    if (lead.referralSource) score += 15;

    return Math.min(score, 100); // Cap at 100
  }

  private adjustScoreForStatusChange(currentScore: number, oldStatus: LeadStatus, newStatus: LeadStatus): number {
    let adjustment = 0;

    // Positive progressions
    if (oldStatus === LeadStatus.NEW && newStatus === LeadStatus.CONTACTED) {
      adjustment = 10;
    } else if (oldStatus === LeadStatus.CONTACTED && newStatus === LeadStatus.QUALIFIED) {
      adjustment = 15;
    } else if (oldStatus === LeadStatus.QUALIFIED && newStatus === LeadStatus.TARGET) {
      adjustment = 20;
    }
    // Negative regressions
    else if (newStatus === LeadStatus.DEAD) {
      return 0;
    } else if (oldStatus === LeadStatus.TARGET && newStatus === LeadStatus.QUALIFIED) {
      adjustment = -10;
    }

    return Math.max(0, Math.min(100, currentScore + adjustment));
  }

  private determineEngagementLevel(score: number): EnhancedLead['engagementLevel'] {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private getFollowUpDays(score: number): number {
    if (score >= 70) return 1; // High score leads - follow up next day
    if (score >= 40) return 3; // Medium score leads - follow up in 3 days
    return 7; // Low score leads - follow up in a week
  }

  private validateLeadData(lead: Partial<EnhancedLead>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!lead.firstName || lead.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!lead.lastName || lead.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!lead.email && !lead.phone) {
      errors.push('Either email or phone is required');
    }

    if (lead.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lead.email)) {
        errors.push('Invalid email format');
      }
    }

    if (lead.leadScore !== undefined && (lead.leadScore < 0 || lead.leadScore > 100)) {
      errors.push('Lead score must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const enhancedLeadRepository = new EnhancedLeadRepository();