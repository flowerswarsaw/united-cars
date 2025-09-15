import { Deal, DealStatus, DealLossReason, EntityType } from '@united-cars/crm-core';
import { EnhancedBaseRepository, EnhancedEntityBase, CreateOptions, UpdateOptions, DeleteOptions } from '../enhanced-base-repository';
import { RBACUser } from '@united-cars/crm-core/src/rbac';
import { UniquenessConflict } from '@united-cars/crm-core/src/uniqueness';

// Enhanced Deal interface with RBAC fields
export interface EnhancedDeal extends Deal, EnhancedEntityBase {
  probability?: number; // Win probability based on stage
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  dealSource?: string; // Lead conversion, direct, referral, etc.
  competitorInfo?: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export class EnhancedDealRepository extends EnhancedBaseRepository<EnhancedDeal> {
  constructor() {
    super(EntityType.DEAL, 'deals');
    
    // Deals don't have global uniqueness constraints like organizations/contacts
    // but may have business-specific constraints
    this.setUniquenessFields([]);
  }

  // Enhanced create with deal-specific logic
  async createDeal(
    data: Omit<EnhancedDeal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, 
    options: CreateOptions
  ): Promise<{ success: boolean; data?: EnhancedDeal; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    // Auto-assign to the creating user if not specified
    if (!data.assignedUserId) {
      data.assignedUserId = options.user.id;
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = DealStatus.QUALIFIED;
    }

    // Calculate initial probability based on pipeline stage
    if (!data.probability && data.pipelineId && data.stageId) {
      data.probability = await this.calculateProbabilityForStage(data.stageId);
    }

    // Set expected close date if not provided (30 days from now)
    if (!data.expectedCloseDate) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      data.expectedCloseDate = expectedDate;
    }

    // Validate deal data
    const validationResult = this.validateDealData(data);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    return await this.create(data, options);
  }

  // Get deals by pipeline with RBAC
  async getByPipeline(pipelineId: string, user: RBACUser): Promise<EnhancedDeal[]> {
    const all = await this.list({}, { user });
    return all.filter(deal => deal.pipelineId === pipelineId);
  }

  // Get deals by stage with RBAC
  async getByStage(stageId: string, user: RBACUser): Promise<EnhancedDeal[]> {
    const all = await this.list({}, { user });
    return all.filter(deal => deal.stageId === stageId);
  }

  // Get deals by status with RBAC
  async getByStatus(status: DealStatus, user: RBACUser): Promise<EnhancedDeal[]> {
    const all = await this.list({}, { user });
    return all.filter(deal => deal.status === status);
  }

  // Move deal to different stage
  async moveDealToStage(
    dealId: string,
    newStageId: string,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedDeal; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const deal = await this.get(dealId, options.user);
    if (!deal) {
      return { success: false, errors: ['Deal not found or access denied'] };
    }

    // Calculate new probability based on stage
    const newProbability = await this.calculateProbabilityForStage(newStageId);

    const updateData: Partial<EnhancedDeal> = {
      stageId: newStageId,
      probability: newProbability
    };

    // Update expected close date if moving to later stages
    if (newProbability > (deal.probability || 0)) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + Math.max(7, 30 - (newProbability / 10)));
      updateData.expectedCloseDate = expectedDate;
    }

    return await this.update(dealId, updateData, {
      ...options,
      reason: `Moved deal to stage ${newStageId}`
    });
  }

  // Close deal as won
  async closeDealAsWon(
    dealId: string,
    finalValue?: number,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedDeal; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const deal = await this.get(dealId, options.user);
    if (!deal) {
      return { success: false, errors: ['Deal not found or access denied'] };
    }

    const updateData: Partial<EnhancedDeal> = {
      status: DealStatus.WON,
      probability: 100,
      actualCloseDate: new Date()
    };

    if (finalValue !== undefined) {
      updateData.value = finalValue;
    }

    return await this.update(dealId, updateData, {
      ...options,
      reason: 'Closed deal as won'
    });
  }

  // Close deal as lost
  async closeDealAsLost(
    dealId: string,
    lossReason: DealLossReason,
    lossReasonDetail?: string,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedDeal; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const deal = await this.get(dealId, options.user);
    if (!deal) {
      return { success: false, errors: ['Deal not found or access denied'] };
    }

    const updateData: Partial<EnhancedDeal> = {
      status: DealStatus.LOST,
      probability: 0,
      actualCloseDate: new Date(),
      lossReason,
      lossReasonDetail
    };

    return await this.update(dealId, updateData, {
      ...options,
      reason: `Closed deal as lost: ${lossReason}`
    });
  }

  // Reopen deal
  async reopenDeal(
    dealId: string,
    newStageId: string,
    reason: string,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: EnhancedDeal; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    
    const deal = await this.get(dealId, options.user);
    if (!deal) {
      return { success: false, errors: ['Deal not found or access denied'] };
    }

    if (deal.status !== DealStatus.WON && deal.status !== DealStatus.LOST) {
      return { success: false, errors: ['Only closed deals can be reopened'] };
    }

    const newProbability = await this.calculateProbabilityForStage(newStageId);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);

    const updateData: Partial<EnhancedDeal> = {
      status: DealStatus.QUALIFIED,
      stageId: newStageId,
      probability: newProbability,
      expectedCloseDate: expectedDate,
      actualCloseDate: undefined,
      lossReason: undefined,
      lossReasonDetail: undefined
    };

    return await this.update(dealId, updateData, {
      ...options,
      reason: `Reopened deal: ${reason}`
    });
  }

  // Advanced search with RBAC and deal-specific filters
  async advancedSearch(
    query: {
      searchTerm?: string;
      organisationId?: string;
      contactId?: string;
      leadId?: string;
      pipelineId?: string;
      stageId?: string;
      status?: DealStatus;
      assignedUserId?: string;
      minValue?: number;
      maxValue?: number;
      minProbability?: number;
      maxProbability?: number;
      expectedCloseDateRange?: { from: Date; to: Date };
      actualCloseDateRange?: { from: Date; to: Date };
      dealSource?: string;
      overdue?: boolean;
      dateRange?: { from: Date; to: Date };
    },
    user: RBACUser
  ): Promise<EnhancedDeal[]> {
    let results = await this.list({}, { user });

    // Apply search filters
    if (query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      results = results.filter(deal =>
        deal.title.toLowerCase().includes(searchTerm) ||
        (deal.description && deal.description.toLowerCase().includes(searchTerm)) ||
        (deal.nextAction && deal.nextAction.toLowerCase().includes(searchTerm))
      );
    }

    if (query.organisationId) {
      results = results.filter(deal => deal.organisationId === query.organisationId);
    }

    if (query.contactId) {
      results = results.filter(deal => deal.contactId === query.contactId);
    }

    if (query.leadId) {
      results = results.filter(deal => deal.leadId === query.leadId);
    }

    if (query.pipelineId) {
      results = results.filter(deal => deal.pipelineId === query.pipelineId);
    }

    if (query.stageId) {
      results = results.filter(deal => deal.stageId === query.stageId);
    }

    if (query.status) {
      results = results.filter(deal => deal.status === query.status);
    }

    if (query.assignedUserId) {
      results = results.filter(deal => deal.assignedUserId === query.assignedUserId);
    }

    if (query.minValue !== undefined) {
      results = results.filter(deal => deal.value >= query.minValue!);
    }

    if (query.maxValue !== undefined) {
      results = results.filter(deal => deal.value <= query.maxValue!);
    }

    if (query.minProbability !== undefined) {
      results = results.filter(deal => (deal.probability || 0) >= query.minProbability!);
    }

    if (query.maxProbability !== undefined) {
      results = results.filter(deal => (deal.probability || 0) <= query.maxProbability!);
    }

    if (query.expectedCloseDateRange) {
      results = results.filter(deal => 
        deal.expectedCloseDate &&
        deal.expectedCloseDate >= query.expectedCloseDateRange!.from &&
        deal.expectedCloseDate <= query.expectedCloseDateRange!.to
      );
    }

    if (query.actualCloseDateRange) {
      results = results.filter(deal => 
        deal.actualCloseDate &&
        deal.actualCloseDate >= query.actualCloseDateRange!.from &&
        deal.actualCloseDate <= query.actualCloseDateRange!.to
      );
    }

    if (query.dealSource) {
      results = results.filter(deal => deal.dealSource === query.dealSource);
    }

    if (query.overdue !== undefined && query.overdue) {
      const now = new Date();
      results = results.filter(deal => 
        deal.expectedCloseDate && 
        deal.expectedCloseDate < now &&
        deal.status !== DealStatus.WON &&
        deal.status !== DealStatus.LOST
      );
    }

    if (query.dateRange) {
      results = results.filter(deal =>
        deal.createdAt >= query.dateRange!.from &&
        deal.createdAt <= query.dateRange!.to
      );
    }

    return results;
  }

  // Get deals assigned to specific user
  async getAssignedToUser(userId: string, requestingUser: RBACUser): Promise<EnhancedDeal[]> {
    const all = await this.list({}, { user: requestingUser });
    return all.filter(deal => deal.assignedUserId === userId);
  }

  // Get overdue deals
  async getOverdueDeals(user: RBACUser): Promise<EnhancedDeal[]> {
    const now = new Date();
    const all = await this.list({}, { user });
    return all.filter(deal => 
      deal.expectedCloseDate && 
      deal.expectedCloseDate < now &&
      deal.status !== DealStatus.WON &&
      deal.status !== DealStatus.LOST
    );
  }

  // Get deal metrics for user
  async getDealMetrics(userId: string, requestingUser: RBACUser): Promise<{
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    averageDealSize: number;
    winRate: number;
    averageSalesCycle: number;
    overdueDeals: number;
  }> {
    const userDeals = await this.getAssignedToUser(userId, requestingUser);
    
    const totalDeals = userDeals.length;
    const openDeals = userDeals.filter(d => d.status !== DealStatus.WON && d.status !== DealStatus.LOST).length;
    const wonDeals = userDeals.filter(d => d.status === DealStatus.WON).length;
    const lostDeals = userDeals.filter(d => d.status === DealStatus.LOST).length;
    
    const totalValue = userDeals.reduce((sum, deal) => sum + deal.value, 0);
    const wonValue = userDeals.filter(d => d.status === DealStatus.WON).reduce((sum, deal) => sum + deal.value, 0);
    
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
    const winRate = (wonDeals + lostDeals) > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    
    // Calculate average sales cycle for won deals
    const wonDealsWithDates = userDeals.filter(d => 
      d.status === DealStatus.WON && d.actualCloseDate
    );
    const averageSalesCycle = wonDealsWithDates.length > 0 
      ? wonDealsWithDates.reduce((sum, deal) => {
          const cycleTime = deal.actualCloseDate!.getTime() - deal.createdAt.getTime();
          return sum + (cycleTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / wonDealsWithDates.length
      : 0;
    
    const now = new Date();
    const overdueDeals = userDeals.filter(d => 
      d.expectedCloseDate && 
      d.expectedCloseDate < now &&
      d.status !== DealStatus.WON &&
      d.status !== DealStatus.LOST
    ).length;

    return {
      totalDeals,
      openDeals,
      wonDeals,
      lostDeals,
      totalValue,
      wonValue,
      averageDealSize,
      winRate,
      averageSalesCycle,
      overdueDeals
    };
  }

  // Bulk update assignment
  async bulkUpdateAssignment(
    dealIds: string[], 
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

    for (const dealId of dealIds) {
      try {
        const result = await this.update(dealId, { assignedUserId: newAssignedUserId }, {
          ...options,
          reason: `Bulk assignment to user ${newAssignedUserId}`
        });
        
        if (result.success) {
          results.updated.push(dealId);
        } else {
          results.failed.push({
            id: dealId,
            error: result.errors?.join(', ') || 'Unknown error'
          });
          results.success = false;
        }
      } catch (error) {
        results.failed.push({
          id: dealId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.success = false;
      }
    }

    return results;
  }

  // Private helper methods
  private async calculateProbabilityForStage(stageId: string): Promise<number> {
    // Mock stage probability mapping - in real implementation would query pipeline stages
    const stageProbabilities: Record<string, number> = {
      'stage_qualified': 25,
      'stage_proposal': 50,
      'stage_negotiation': 75,
      'stage_closed_won': 100,
      'stage_closed_lost': 0
    };

    return stageProbabilities[stageId] || 25;
  }

  private validateDealData(deal: Partial<EnhancedDeal>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!deal.title || deal.title.trim().length === 0) {
      errors.push('Deal title is required');
    }

    if (!deal.organisationId) {
      errors.push('Organisation is required');
    }

    if (!deal.pipelineId) {
      errors.push('Pipeline is required');
    }

    if (!deal.stageId) {
      errors.push('Stage is required');
    }

    if (deal.value !== undefined && deal.value < 0) {
      errors.push('Deal value cannot be negative');
    }

    if (deal.probability !== undefined && (deal.probability < 0 || deal.probability > 100)) {
      errors.push('Probability must be between 0 and 100');
    }

    if (deal.expectedCloseDate && deal.actualCloseDate) {
      if (deal.expectedCloseDate > deal.actualCloseDate) {
        errors.push('Expected close date cannot be after actual close date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const enhancedDealRepository = new EnhancedDealRepository();