import { NextRequest, NextResponse } from 'next/server';
import { 
  enhancedDealRepository
} from '@united-cars/crm-mocks/src/enhanced-index';
import { createDealSchema, DealStatus } from '@united-cars/crm-core';
import { 
  getUserContext, 
  getRequestMetadata,
  getPaginationParams,
  getSearchParams,
  createErrorResponse,
  createSuccessResponse,
  createConflictResponse,
  generateConflictSuggestions,
  sanitizeInput
} from '../_utils/api-helpers';
import { ConflictResolution } from '@united-cars/crm-core/src/uniqueness';

// GET /api/crm/enhanced/deals - List deals with RBAC and advanced filtering
export async function GET(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return createErrorResponse('Unauthorized', null, 401);
    }

    // Get pagination and search parameters
    const { page, limit } = getPaginationParams(request);
    const { search, sortBy, sortOrder, filters } = getSearchParams(request);

    // Use enhanced search with RBAC if filters are provided
    if (search || Object.keys(filters).length > 0) {
      const searchResults = await enhancedDealRepository.advancedSearch({
        searchTerm: search || undefined,
        organisationId: filters.organisationId,
        contactId: filters.contactId,
        leadId: filters.leadId,
        pipelineId: filters.pipelineId,
        stageId: filters.stageId,
        status: filters.status as DealStatus,
        assignedUserId: filters.assignedUserId,
        minValue: filters.minValue,
        maxValue: filters.maxValue,
        minProbability: filters.minProbability,
        maxProbability: filters.maxProbability,
        expectedCloseDateRange: filters.fromDate && filters.toDate ? {
          from: filters.fromDate,
          to: filters.toDate
        } : undefined,
        dealSource: filters.dealSource,
        overdue: filters.overdue
      }, user);

      // Apply sorting
      if (sortBy) {
        searchResults.sort((a, b) => {
          const aValue = (a as any)[sortBy];
          const bValue = (b as any)[sortBy];
          
          if (aValue === bValue) return 0;
          let comparison = aValue > bValue ? 1 : -1;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      return createSuccessResponse({
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: searchResults.length,
          totalPages: Math.ceil(searchResults.length / limit),
          hasNext: endIndex < searchResults.length,
          hasPrev: page > 1
        }
      }, 200, {
        userRole: user.role,
        canCreate: true,
        filters: filters
      });
    } else {
      // Use paginated list with RBAC
      const results = await enhancedDealRepository.listPaginatedWithUser({
        page,
        limit,
        sortBy,
        sortOrder,
        user
      });

      return createSuccessResponse(results, 200, {
        userRole: user.role,
        canCreate: true
      });
    }
  } catch (error: any) {
    console.error('Error fetching enhanced deals:', error);
    
    if (error.message.includes('Access denied')) {
      return createErrorResponse('Access denied', null, 403);
    }
    
    return createErrorResponse('Failed to fetch deals', error.message);
  }
}

// POST /api/crm/enhanced/deals - Create deal with validation and conflict resolution
export async function POST(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return createErrorResponse('Unauthorized', null, 401);
    }

    // Get request metadata
    const { ipAddress, userAgent } = getRequestMetadata(request);

    // Parse and sanitize request body
    const body = sanitizeInput(await request.json());
    
    // Check for conflict resolution data
    const isConflictResolution = body._conflictResolution;
    let validatedData;
    
    if (isConflictResolution) {
      // Handle conflict resolution
      const resolution: ConflictResolution = body._conflictResolution;
      const originalData = body.data;
      
      switch (resolution.action) {
        case 'keep_both':
          validatedData = { ...originalData, ...resolution.fieldUpdates };
          break;
        case 'update_existing':
          return createErrorResponse('Update existing resolution not implemented in this endpoint', null, 400);
        case 'cancel':
          return createErrorResponse('Operation cancelled by user', null, 400);
        default:
          return createErrorResponse('Invalid conflict resolution action', null, 400);
      }
    } else {
      validatedData = createDealSchema.parse(body);
    }

    // Create deal with enhanced repository
    const result = await enhancedDealRepository.createDeal(validatedData, {
      user,
      ipAddress,
      userAgent,
      reason: body._reason || 'Created via API',
      skipUniquenessCheck: isConflictResolution && body._skipUniquenessCheck
    });

    if (result.success) {
      return createSuccessResponse(result.data, 201, {
        created: true,
        createdBy: user.id
      });
    } else {
      // Handle validation errors and conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        const suggestions = body._generateSuggestions ? 
          generateConflictSuggestions(result.conflicts, validatedData, 'deals') : 
          undefined;
        
        return createConflictResponse(result.conflicts, user.role, suggestions);
      } else {
        return createErrorResponse('Validation failed', result.errors, 400, {
          userRole: user.role
        });
      }
    }
  } catch (error: any) {
    console.error('Error creating enhanced deal:', error);
    
    if (error.message.includes('Access denied')) {
      return createErrorResponse('Access denied', null, 403);
    }
    
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid input data', error.errors, 400);
    }
    
    return createErrorResponse('Failed to create deal', error.message);
  }
}

// PATCH /api/crm/enhanced/deals/bulk - Bulk operations on deals
export async function PATCH(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return createErrorResponse('Unauthorized', null, 401);
    }

    // Get request metadata
    const { ipAddress, userAgent } = getRequestMetadata(request);

    // Parse request body
    const body = sanitizeInput(await request.json());
    const { operation, dealIds, data } = body;

    if (!operation || !dealIds || !Array.isArray(dealIds)) {
      return createErrorResponse('Missing required fields: operation, dealIds', null, 400);
    }

    let results;

    switch (operation) {
      case 'assign':
        if (!data.assignedUserId) {
          return createErrorResponse('assignedUserId required for assign operation', null, 400);
        }
        results = await enhancedDealRepository.bulkUpdateAssignment(dealIds, data.assignedUserId, {
          user,
          ipAddress,
          userAgent,
          reason: 'Bulk assignment via API'
        });
        break;

      case 'move_stage':
        if (!data.stageId) {
          return createErrorResponse('stageId required for move_stage operation', null, 400);
        }
        // Implementation would involve calling moveDealToStage for each deal
        results = { success: false, error: 'move_stage bulk operation not yet implemented' };
        break;

      case 'close_won':
        // Implementation would involve calling closeDealAsWon for each deal
        results = { success: false, error: 'close_won bulk operation not yet implemented' };
        break;

      case 'close_lost':
        if (!data.lossReason) {
          return createErrorResponse('lossReason required for close_lost operation', null, 400);
        }
        // Implementation would involve calling closeDealAsLost for each deal
        results = { success: false, error: 'close_lost bulk operation not yet implemented' };
        break;

      default:
        return createErrorResponse(`Unknown bulk operation: ${operation}`, null, 400);
    }

    if (results.success) {
      return createSuccessResponse({
        operation,
        updated: results.updated,
        failed: results.failed,
        summary: {
          total: dealIds.length,
          successful: results.updated.length,
          failed: results.failed.length
        }
      }, 200, {
        operationType: 'bulk',
        performedBy: user.id
      });
    } else {
      return createErrorResponse(`Bulk operation failed: ${results.error}`, results, 400);
    }
  } catch (error: any) {
    console.error('Error performing bulk deal operation:', error);
    
    if (error.message.includes('Access denied')) {
      return createErrorResponse('Access denied', null, 403);
    }
    
    return createErrorResponse('Failed to perform bulk operation', error.message);
  }
}