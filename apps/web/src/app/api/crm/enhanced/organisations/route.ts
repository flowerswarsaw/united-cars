import { NextRequest, NextResponse } from 'next/server';
import { 
  enhancedOrganisationRepository,
  mockUsers 
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

    // In a real implementation, this would query the user's actual role from database
    // For now, we'll use mock data based on user ID patterns
    const userId = session.user.id;
    
    // Mock role assignment - in production this would come from user database
    let role: UserRole;
    let assignedEntityIds: string[] = [];

    if (userId.includes('admin') || session.user.role === 'admin') {
      role = UserRole.ADMIN;
    } else if (userId.includes('senior') || session.user.role === 'senior_sales_manager') {
      role = UserRole.SENIOR_SALES_MANAGER;
      // In real implementation, would query assigned entities from database
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

// GET /api/crm/enhanced/organisations - List organisations with RBAC
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
    const type = searchParams.get('type');
    const industry = searchParams.get('industry');
    const size = searchParams.get('size');
    const location = searchParams.get('location');
    const assignedUserId = searchParams.get('assignedUserId');
    const verified = searchParams.get('verified');
    const hasEmail = searchParams.get('hasEmail') === 'true';
    const hasPhone = searchParams.get('hasPhone') === 'true';
    const hasWebsite = searchParams.get('hasWebsite') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use enhanced search with RBAC
    if (search || type || industry || assignedUserId || verified) {
      const searchResults = await enhancedOrganisationRepository.advancedSearch({
        searchTerm: search || undefined,
        type: type as any,
        assignedUserId: assignedUserId || undefined,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined
      }, user);

      // Apply additional filters
      let filteredResults = searchResults;
      
      if (industry) {
        filteredResults = filteredResults.filter(org => 
          org.industry && org.industry.toLowerCase().includes(industry.toLowerCase())
        );
      }
      
      if (size) {
        filteredResults = filteredResults.filter(org => 
          org.size && org.size.toLowerCase().includes(size.toLowerCase())
        );
      }
      
      if (location) {
        filteredResults = filteredResults.filter(org => 
          (org.city && org.city.toLowerCase().includes(location.toLowerCase())) ||
          (org.state && org.state.toLowerCase().includes(location.toLowerCase())) ||
          (org.country && org.country.toLowerCase().includes(location.toLowerCase()))
        );
      }

      if (hasEmail) {
        filteredResults = filteredResults.filter(org => 
          org.email && org.email.trim().length > 0
        );
      }

      if (hasPhone) {
        filteredResults = filteredResults.filter(org => 
          org.phone && org.phone.trim().length > 0
        );
      }

      if (hasWebsite) {
        filteredResults = filteredResults.filter(org => 
          org.website && org.website.trim().length > 0
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = filteredResults.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: filteredResults.length,
          totalPages: Math.ceil(filteredResults.length / limit),
          hasNext: endIndex < filteredResults.length,
          hasPrev: page > 1
        },
        metadata: {
          userRole: user.role,
          canCreate: true, // Based on RBAC permissions
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Use paginated list with RBAC
      const results = await enhancedOrganisationRepository.listPaginatedWithUser({
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
    console.error('Error fetching enhanced organisations:', error);
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch organisations', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/crm/enhanced/organisations - Create organisation with validation and conflict resolution
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
      
      // Apply resolution modifications
      switch (resolution.action) {
        case 'keep_both':
          validatedData = { ...originalData, ...resolution.fieldUpdates };
          break;
        case 'update_existing':
          // This would update the existing record - not implemented in this example
          return NextResponse.json(
            { error: 'Update existing resolution not implemented in this endpoint' },
            { status: 400 }
          );
        case 'merge':
          // This would merge records - not implemented in this example
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
      validatedData = createOrganisationSchema.parse(body);
    }

    // Create organisation with enhanced repository
    const result = await enhancedOrganisationRepository.createOrganisation(validatedData, {
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
    console.error('Error creating enhanced organisation:', error);
    
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
      { error: 'Failed to create organisation', details: error.message },
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