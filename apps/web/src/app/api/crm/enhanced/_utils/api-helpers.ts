import { NextRequest } from 'next/server';
import { RBACUser, UserRole } from '@united-cars/crm-core/src/rbac';
import { UniquenessConflict } from '@united-cars/crm-core/src/uniqueness';
import { getServerSessionFromRequest } from '@/lib/auth';

// Standard API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
  metadata?: {
    userRole?: UserRole;
    timestamp?: string;
    [key: string]: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ConflictResponse {
  error: string;
  conflicts: UniquenessConflict[];
  conflictResolutionRequired: boolean;
  metadata: {
    userRole: UserRole;
    canResolveConflicts: boolean;
    suggestedResolutions?: Record<string, string[]>;
  };
}

// Enhanced user context retrieval
export async function getUserContext(request: NextRequest): Promise<RBACUser | null> {
  try {
    const session = await getServerSessionFromRequest(request);
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    let role: UserRole;
    let assignedEntityIds: string[] = [];

    // Mock role assignment based on session or user ID patterns
    // In production, this would query the user's actual role from database
    if (userId.includes('admin') || session.user.role === 'admin') {
      role = UserRole.ADMIN;
    } else if (userId.includes('senior') || session.user.role === 'senior_sales_manager') {
      role = UserRole.SENIOR_SALES_MANAGER;
      // In real implementation, would query assigned entities from database
      assignedEntityIds = await getAssignedEntityIds(userId);
    } else {
      role = UserRole.JUNIOR_SALES_MANAGER;
      assignedEntityIds = await getAssignedEntityIds(userId);
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

// Mock function to get assigned entity IDs - in production would query database
async function getAssignedEntityIds(userId: string): Promise<string[]> {
  // Mock implementation - in real app would query user's assigned entities
  const mockAssignments: Record<string, string[]> = {
    'user_senior_sales': ['org_1', 'org_2', 'contact_1', 'contact_2', 'deal_1', 'deal_2', 'lead_1', 'lead_2'],
    'user_junior_sales': ['org_3', 'contact_3', 'deal_3', 'lead_3']
  };
  
  return mockAssignments[userId] || [];
}

// Extract request metadata (IP, User Agent, etc.)
export function getRequestMetadata(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(/, /)[0] : 
                   request.headers.get('x-real-ip') || 
                   request.ip || 
                   '127.0.0.1';
  
  const userAgent = request.headers.get('user-agent') || '';
  
  return { ipAddress, userAgent };
}

// Parse pagination parameters from request
export function getPaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 items
    offset: parseInt(searchParams.get('offset') || '0')
  };
}

// Parse search parameters from request
export function getSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    search: searchParams.get('search'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    filters: parseFiltersFromParams(searchParams)
  };
}

// Parse filter parameters
function parseFiltersFromParams(searchParams: URLSearchParams): Record<string, any> {
  const filters: Record<string, any> = {};
  
  // Common filter parameters
  const filterKeys = [
    'assignedUserId', 'verified', 'status', 'type', 'source',
    'organisationId', 'contactId', 'leadId', 'pipelineId', 'stageId',
    'fromDate', 'toDate', 'minValue', 'maxValue'
  ];
  
  for (const key of filterKeys) {
    const value = searchParams.get(key);
    if (value !== null && value !== '') {
      // Parse dates
      if (key.includes('Date')) {
        filters[key] = new Date(value);
      }
      // Parse numbers
      else if (key.includes('Value') || key.includes('min') || key.includes('max')) {
        filters[key] = parseFloat(value);
      }
      // Parse booleans
      else if (value === 'true' || value === 'false') {
        filters[key] = value === 'true';
      }
      // Keep as string
      else {
        filters[key] = value;
      }
    }
  }
  
  return filters;
}

// Standard error response builder
export function createErrorResponse(
  error: string,
  details?: any,
  status: number = 500,
  metadata?: Record<string, any>
): Response {
  return new Response(JSON.stringify({
    error,
    details,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Standard success response builder
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  metadata?: Record<string, any>
): Response {
  return new Response(JSON.stringify({
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Conflict resolution response builder
export function createConflictResponse(
  conflicts: UniquenessConflict[],
  userRole: UserRole,
  suggestedResolutions?: Record<string, string[]>
): Response {
  return new Response(JSON.stringify({
    error: 'Uniqueness conflicts detected',
    conflicts,
    conflictResolutionRequired: true,
    metadata: {
      userRole,
      canResolveConflicts: userRole === UserRole.ADMIN || userRole === UserRole.SENIOR_SALES_MANAGER,
      suggestedResolutions,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Generic conflict suggestion generator
export function generateConflictSuggestions(
  conflicts: UniquenessConflict[], 
  proposedData: any,
  entityType: string
): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {};

  for (const conflict of conflicts) {
    const field = conflict.field;
    const currentValue = proposedData[field];
    
    if (!currentValue || typeof currentValue !== 'string') continue;

    switch (field) {
      case 'email':
        if (currentValue.includes('@')) {
          const [username, domain] = currentValue.split('@');
          suggestions[field] = [
            `${username}+new@${domain}`,
            `${username}2@${domain}`,
            `${username}.${entityType}@${domain}`
          ];
          
          // Add name-based suggestions for contacts
          if (entityType === 'contacts' && proposedData.firstName && proposedData.lastName) {
            suggestions[field].push(
              `${proposedData.firstName.toLowerCase()}.${proposedData.lastName.toLowerCase()}@${domain}`
            );
          }
        }
        break;
      
      case 'phone':
        suggestions[field] = [
          `${currentValue} (ext. 1)`,
          `${currentValue} (mobile)`,
          `${currentValue} (${entityType === 'contacts' ? 'direct' : 'main'})`
        ];
        break;
      
      case 'companyId':
      case 'taxId':
        suggestions[field] = [
          `${currentValue}-1`,
          `${currentValue}-NEW`,
          `${currentValue}-${new Date().getFullYear()}`
        ];
        break;
      
      case 'socialMediaLinks.url':
        // Extract platform from URL and suggest variations
        try {
          const url = new URL(currentValue);
          const platform = url.hostname.replace('www.', '');
          suggestions[field] = [
            `${currentValue}/official`,
            `${currentValue}-business`,
            currentValue.replace(platform, `business.${platform}`)
          ];
        } catch {
          suggestions[field] = [
            `${currentValue}/business`,
            `${currentValue}-official`,
            `${currentValue}2`
          ];
        }
        break;
      
      default:
        suggestions[field] = [
          `${currentValue} (2)`,
          `${currentValue}_new`,
          `${currentValue}_${Date.now().toString(36).substring(2, 8)}`
        ];
    }
  }

  return suggestions;
}

// Validate request permissions
export function validatePermissions(
  user: RBACUser,
  requiredRole?: UserRole,
  entityId?: string,
  entityAssignedUserId?: string
): { allowed: boolean; error?: string } {
  // Check role-based permissions
  if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
    return { allowed: false, error: `Insufficient permissions. Required role: ${requiredRole}` };
  }
  
  // Check entity-level permissions for non-admins
  if (user.role !== UserRole.ADMIN && entityId) {
    const hasAccess = user.assignedEntityIds?.includes(entityId) || 
                     entityAssignedUserId === user.id;
    
    if (!hasAccess) {
      return { allowed: false, error: 'Access denied to this entity' };
    }
  }
  
  return { allowed: true };
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60 * 1000
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const current = requestCounts.get(identifier);
  
  if (!current || now > current.resetTime) {
    // New window or reset
    const resetTime = now + windowMs;
    requestCounts.set(identifier, { count: 1, resetTime });
    return { allowed: true, remainingRequests: maxRequests - 1, resetTime };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remainingRequests: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remainingRequests: maxRequests - current.count, 
    resetTime: current.resetTime 
  };
}

// Input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Basic XSS prevention
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Audit log helper
export function createAuditLogEntry(
  operation: string,
  entityType: string,
  entityId: string,
  user: RBACUser,
  metadata?: Record<string, any>
) {
  return {
    operation,
    entityType,
    entityId,
    userId: user.id,
    userRole: user.role,
    timestamp: new Date().toISOString(),
    metadata: {
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      reason: metadata?.reason,
      ...metadata
    }
  };
}

// Query parameter validation
export function validateQueryParams(
  searchParams: URLSearchParams,
  allowedParams: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key] of searchParams.entries()) {
    if (!allowedParams.includes(key)) {
      errors.push(`Unknown query parameter: ${key}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}