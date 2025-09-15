import { NextRequest, NextResponse } from 'next/server';
import { 
  enhancedContactRepository,
  mockUsers 
} from '@united-cars/crm-mocks/src/enhanced-index';
import { createContactSchema } from '@united-cars/crm-core';
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

// GET /api/crm/enhanced/contacts - List contacts with RBAC
export async function GET(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const organisationId = searchParams.get('organisationId');
    const role = searchParams.get('role');
    const assignedUserId = searchParams.get('assignedUserId');
    const verified = searchParams.get('verified');
    const hasEmail = searchParams.get('hasEmail') === 'true';
    const hasPhone = searchParams.get('hasPhone') === 'true';
    const hasSocialMedia = searchParams.get('hasSocialMedia') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use enhanced search with RBAC
    if (search || organisationId || role || assignedUserId || verified || hasEmail || hasPhone || hasSocialMedia) {
      const searchResults = await enhancedContactRepository.advancedSearch({
        searchTerm: search || undefined,
        organisationId: organisationId || undefined,
        role: role || undefined,
        assignedUserId: assignedUserId || undefined,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        hasEmail: hasEmail || undefined,
        hasPhone: hasPhone || undefined,
        hasSocialMedia: hasSocialMedia || undefined
      }, user);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: searchResults.length,
          totalPages: Math.ceil(searchResults.length / limit),
          hasNext: endIndex < searchResults.length,
          hasPrev: page > 1
        },
        metadata: {
          userRole: user.role,
          canCreate: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Use paginated list with RBAC
      const results = await enhancedContactRepository.listPaginatedWithUser({
        page,
        limit,
        user
      });

      return NextResponse.json({
        ...results,
        metadata: {
          userRole: user.role,
          canCreate: true,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching enhanced contacts:', error);
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/crm/enhanced/contacts - Create contact with validation and conflict resolution
export async function POST(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request metadata
    const { ipAddress, userAgent } = getRequestMetadata(request);

    // Parse and validate request body
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
          validatedData = { ...originalData, ...resolution.fieldUpdates };
          break;
        case 'merge':
          return NextResponse.json(
            { error: 'Merge resolution requires separate endpoint' },
            { status: 400 }
          );
        case 'cancel':
          return NextResponse.json(
            { error: 'Operation cancelled by user' },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: 'Invalid conflict resolution action' },
            { status: 400 }
          );
      }
    } else {
      validatedData = createContactSchema.parse(body);
    }

    // Create contact with enhanced repository
    const result = await enhancedContactRepository.createContact(validatedData, {
      user,
      ipAddress,
      userAgent,
      reason: body._reason || 'Created via API',
      skipUniquenessCheck: isConflictResolution && body._skipUniquenessCheck
    });

    if (result.success) {
      return NextResponse.json({
        ...result.data,
        metadata: {
          created: true,
          createdBy: user.id,
          timestamp: new Date().toISOString()
        }
      }, { status: 201 });
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
          error: 'Validation failed',
          details: result.errors,
          metadata: {
            userRole: user.role,
            timestamp: new Date().toISOString()
          }
        }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error('Error creating enhanced contact:', error);
    
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
      { error: 'Failed to create contact', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate conflict resolution suggestions for contacts
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
            `${username}+work@${domain}`,
            `${username}.${proposedData.lastName?.toLowerCase()}@${domain}`,
            `${proposedData.firstName?.toLowerCase()}.${proposedData.lastName?.toLowerCase()}@${domain}`
          ];
        }
        break;
      
      case 'phone':
        if (typeof currentValue === 'string') {
          suggestions[field] = [
            `${currentValue} (direct)`,
            `${currentValue} (mobile)`,
            `${currentValue} (office)`
          ];
        }
        break;
      
      default:
        if (typeof currentValue === 'string') {
          suggestions[field] = [
            `${currentValue} (work)`,
            `${currentValue} (alt)`,
            `${currentValue}_${Date.now().toString(36)}`
          ];
        }
    }
  }

  return suggestions;
}