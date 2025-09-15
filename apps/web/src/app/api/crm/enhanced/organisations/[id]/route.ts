import { NextRequest, NextResponse } from 'next/server';
import { 
  enhancedOrganisationRepository,
  historyLogger
} from '@united-cars/crm-mocks/src/enhanced-index';
import { createOrganisationSchema } from '@united-cars/crm-core';
import { RBACUser, UserRole } from '@united-cars/crm-core/src/rbac';
import { UniquenessConflict, ConflictResolution } from '@united-cars/crm-core/src/uniqueness';
import { getServerSessionFromRequest } from '@/lib/auth';

// Helper function to get user context from session
async function getUserContext(request: NextRequest): Promise<RBACUser | null> {
  try {
    const session = await getServerSessionFromRequest(request);
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    let role: UserRole;
    let assignedEntityIds: string[] = [];

    if (userId.includes('admin') || session.user.role === 'admin') {
      role = UserRole.ADMIN;
    } else if (userId.includes('senior') || session.user.role === 'senior_sales_manager') {
      role = UserRole.SENIOR_SALES_MANAGER;
      assignedEntityIds = ['org_1', 'org_2', 'contact_1', 'contact_2'];
    } else {
      role = UserRole.JUNIOR_SALES_MANAGER;
      assignedEntityIds = ['org_3', 'contact_3'];
    }

    return {
      id: userId,
      role,
      assignedEntityIds
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

// Helper function to get client IP and User Agent
function getRequestMetadata(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(/, /)[0] : 
                   request.headers.get('x-real-ip') || 
                   request.ip || 
                   '127.0.0.1';
  
  const userAgent = request.headers.get('user-agent') || '';
  
  return { ipAddress, userAgent };
}

// GET /api/crm/enhanced/organisations/[id] - Get single organisation with history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = params.id;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeContacts = searchParams.get('includeContacts') === 'true';

    // Get organisation with RBAC
    const organisation = await enhancedOrganisationRepository.get(orgId, user);
    
    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found or access denied' }, 
        { status: 404 }
      );
    }

    const response: any = {
      ...organisation,
      metadata: {
        userRole: user.role,
        canEdit: user.role === 'admin' || organisation.assignedUserId === user.id,
        canDelete: user.role === 'admin',
        timestamp: new Date().toISOString()
      }
    };

    // Include history if requested
    if (includeHistory) {
      try {
        const history = await enhancedOrganisationRepository.getHistory(orgId, user);
        response.history = {
          entries: history.slice(0, 20), // Limit to last 20 entries
          totalEntries: history.length,
          summary: {
            totalChanges: history.length,
            lastModified: history.length > 0 ? history[0].timestamp : organisation.createdAt,
            lastModifiedBy: history.length > 0 ? history[0].userId : organisation.createdBy
          }
        };
      } catch (error) {
        // History access might be restricted
        console.warn('History access denied for user:', user.id);
      }
    }

    // Include stats if requested and user has permission
    if (includeStats && (user.role === 'admin' || user.role === 'senior_sales_manager')) {
      try {
        const stats = await enhancedOrganisationRepository.getOrganisationStats(orgId, user);
        response.stats = stats;
      } catch (error) {
        console.warn('Stats access denied for user:', user.id);
      }
    }

    // Include related contacts if requested
    if (includeContacts) {
      try {
        const organisationWithContacts = await enhancedOrganisationRepository.getWithContacts(orgId, user);
        response.contacts = organisationWithContacts.contacts;
      } catch (error) {
        console.warn('Contacts access denied for user:', user.id);
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching enhanced organisation:', error);
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch organisation', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/crm/enhanced/organisations/[id] - Update organisation with validation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request metadata
    const { ipAddress, userAgent } = getRequestMetadata(request);

    const orgId = params.id;
    const body = await request.json();

    // Check for conflict resolution data
    const isConflictResolution = body._conflictResolution;
    let validatedData;
    
    if (isConflictResolution) {
      // Handle conflict resolution
      const resolution: ConflictResolution = body._conflictResolution;
      const originalData = body.data;
      
      switch (resolution.action) {
        case 'keep_both':
          // Apply field modifications to avoid conflicts
          validatedData = { ...originalData, ...resolution.fieldUpdates };
          break;
        case 'update_existing':
          validatedData = originalData;
          break;
        case 'cancel':
          return NextResponse.json(
            { error: 'Update cancelled by user' },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: 'Invalid conflict resolution action' },
            { status: 400 }
          );
      }
    } else {
      // Validate with partial schema (for updates)
      validatedData = createOrganisationSchema.partial().parse(body);
    }

    // Update organisation with enhanced repository
    const result = await enhancedOrganisationRepository.update(orgId, validatedData, {
      user,
      ipAddress,
      userAgent,
      reason: body._reason || 'Updated via API',
      skipUniquenessCheck: isConflictResolution && body._skipUniquenessCheck
    });

    if (result.success) {
      return NextResponse.json({
        ...result.data,
        metadata: {
          updated: true,
          updatedBy: user.id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Handle validation errors and conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        return NextResponse.json({
          error: 'Uniqueness conflicts detected',
          conflicts: result.conflicts,
          conflictResolutionRequired: true,
          metadata: {
            userRole: user.role,
            canResolveConflicts: user.role === 'admin' || user.role === 'senior_sales_manager',
            suggestedResolutions: body._generateSuggestions ? 
              generateConflictSuggestions(result.conflicts, validatedData) : 
              undefined
          }
        }, { status: 409 });
      } else {
        return NextResponse.json({
          error: 'Update failed',
          details: result.errors,
          metadata: {
            userRole: user.role,
            timestamp: new Date().toISOString()
          }
        }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error('Error updating enhanced organisation:', error);
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Invalid input data',
        details: error.errors,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update organisation', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/enhanced/organisations/[id] - Delete organisation with validation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request metadata
    const { ipAddress, userAgent } = getRequestMetadata(request);

    const orgId = params.id;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Deleted via API';
    const softDelete = searchParams.get('softDelete') === 'true';

    // Delete organisation with enhanced repository
    const result = await enhancedOrganisationRepository.remove(orgId, {
      user,
      ipAddress,
      userAgent,
      reason,
      softDelete
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        deleted: true,
        organisationId: orgId,
        metadata: {
          deletedBy: user.id,
          reason,
          softDelete,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        error: 'Delete failed',
        details: result.errors,
        metadata: {
          userRole: user.role,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error deleting enhanced organisation:', error);
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete organisation', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate conflict resolution suggestions
function generateConflictSuggestions(
  conflicts: UniquenessConflict[], 
  proposedData: any
): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {};

  for (const conflict of conflicts) {
    const field = conflict.field;
    const currentValue = proposedData[field];
    
    switch (field) {
      case 'email':
        if (typeof currentValue === 'string' && currentValue.includes('@')) {
          const [username, domain] = currentValue.split('@');
          suggestions[field] = [
            `${username}+new@${domain}`,
            `${username}2@${domain}`,
            `${username}.alt@${domain}`
          ];
        }
        break;
      
      case 'phone':
        if (typeof currentValue === 'string') {
          suggestions[field] = [
            `${currentValue} (ext. 1)`,
            `${currentValue} (mobile)`,
            `${currentValue} (office)`
          ];
        }
        break;
      
      case 'companyId':
        if (typeof currentValue === 'string') {
          suggestions[field] = [
            `${currentValue}-1`,
            `${currentValue}-NEW`,
            `${currentValue}-${new Date().getFullYear()}`
          ];
        }
        break;
      
      default:
        if (typeof currentValue === 'string') {
          suggestions[field] = [
            `${currentValue} (2)`,
            `${currentValue}_new`,
            `${currentValue}_${Date.now().toString(36)}`
          ];
        }
    }
  }

  return suggestions;
}