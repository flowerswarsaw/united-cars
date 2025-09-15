'use client';

import React from 'react';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

export interface RoleGuardProps {
  userRole: UserRole;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: 'create' | 'read' | 'update' | 'delete';
  entityType?: 'organisations' | 'contacts' | 'deals' | 'leads' | 'tasks' | 'pipelines';
  entityId?: string;
  entityAssignedUserId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  mode?: 'hide' | 'disable' | 'show-message';
  showTooltip?: boolean;
}

interface RolePermissions {
  [key: string]: {
    organisations: PermissionSet;
    contacts: PermissionSet;
    deals: PermissionSet;
    leads: PermissionSet;
    tasks: PermissionSet;
    pipelines: PermissionSet;
  };
}

interface PermissionSet {
  create: boolean;
  read: boolean;
  readAll: boolean;
  update: boolean;
  delete: boolean;
}

const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: {
    organisations: { create: true, read: true, readAll: true, update: true, delete: true },
    contacts: { create: true, read: true, readAll: true, update: true, delete: true },
    deals: { create: true, read: true, readAll: true, update: true, delete: true },
    leads: { create: true, read: true, readAll: true, update: true, delete: true },
    tasks: { create: true, read: true, readAll: true, update: true, delete: true },
    pipelines: { create: true, read: true, readAll: true, update: true, delete: true }
  },
  [UserRole.SENIOR_SALES_MANAGER]: {
    organisations: { create: true, read: true, readAll: true, update: true, delete: false },
    contacts: { create: true, read: true, readAll: true, update: true, delete: false },
    deals: { create: true, read: true, readAll: true, update: false, delete: false }, // Only assigned
    leads: { create: true, read: true, readAll: true, update: false, delete: false }, // Only assigned
    tasks: { create: true, read: true, readAll: true, update: false, delete: false }, // Only assigned
    pipelines: { create: false, read: true, readAll: true, update: false, delete: false }
  },
  [UserRole.JUNIOR_SALES_MANAGER]: {
    organisations: { create: true, read: false, readAll: false, update: false, delete: false }, // Only via deals/leads
    contacts: { create: true, read: false, readAll: false, update: false, delete: false }, // Only via deals/leads
    deals: { create: true, read: false, readAll: false, update: false, delete: false }, // Only assigned
    leads: { create: true, read: false, readAll: false, update: false, delete: false }, // Only assigned
    tasks: { create: true, read: false, readAll: false, update: false, delete: false }, // Only assigned
    pipelines: { create: false, read: true, readAll: true, update: false, delete: false }
  }
};

export function RoleGuard({
  userRole,
  requiredRole,
  requiredPermission,
  entityType,
  entityId,
  entityAssignedUserId,
  fallback,
  children,
  mode = 'hide',
  showTooltip = true
}: RoleGuardProps) {
  // Check role-based access
  const hasRoleAccess = () => {
    if (!requiredRole) return true;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Admin always has access
    if (userRole === UserRole.ADMIN) return true;
    
    return roles.includes(userRole);
  };

  // Check permission-based access
  const hasPermissionAccess = () => {
    if (!requiredPermission || !entityType) return true;
    
    const permissions = ROLE_PERMISSIONS[userRole]?.[entityType];
    if (!permissions) return false;
    
    // Basic permission check
    const hasBasicPermission = permissions[requiredPermission];
    if (!hasBasicPermission) return false;
    
    // For non-admin users, check entity-level access for update/delete operations
    if (userRole !== UserRole.ADMIN && entityId && 
        (requiredPermission === 'update' || requiredPermission === 'delete')) {
      
      // Check if entity is assigned to user
      const isAssignedToUser = entityAssignedUserId === getUserId(); // Would need actual user ID
      const canAccessAssignedOnly = !permissions.readAll;
      
      if (canAccessAssignedOnly && !isAssignedToUser) {
        return false;
      }
    }
    
    return true;
  };

  // Mock function - in real app would get from auth context
  const getUserId = () => 'current_user_id';

  const hasAccess = hasRoleAccess() && hasPermissionAccess();
  
  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle different modes when access is denied
  switch (mode) {
    case 'hide':
      return fallback ? <>{fallback}</> : null;
      
    case 'disable':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="opacity-50 cursor-not-allowed pointer-events-none">
                {children}
              </div>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>
                    {requiredRole 
                      ? `Requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role`
                      : `Insufficient permissions for ${requiredPermission} on ${entityType}`
                    }
                  </span>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
      
    case 'show-message':
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {requiredRole 
                ? `This feature requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role`
                : `You don't have permission to ${requiredPermission} ${entityType}`
              }
            </span>
            <Badge variant="outline" className="ml-2">
              Current: {userRole}
            </Badge>
          </AlertDescription>
        </Alert>
      );
      
    default:
      return fallback ? <>{fallback}</> : null;
  }
}

// Specific role guard components for common use cases
export function AdminOnlyGuard({ 
  children, 
  userRole, 
  fallback, 
  mode = 'hide' 
}: {
  children: React.ReactNode;
  userRole: UserRole;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable' | 'show-message';
}) {
  return (
    <RoleGuard 
      userRole={userRole} 
      requiredRole={UserRole.ADMIN} 
      fallback={fallback} 
      mode={mode}
    >
      {children}
    </RoleGuard>
  );
}

export function SeniorPlusGuard({ 
  children, 
  userRole, 
  fallback, 
  mode = 'hide' 
}: {
  children: React.ReactNode;
  userRole: UserRole;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable' | 'show-message';
}) {
  return (
    <RoleGuard 
      userRole={userRole} 
      requiredRole={[UserRole.ADMIN, UserRole.SENIOR_SALES_MANAGER]} 
      fallback={fallback} 
      mode={mode}
    >
      {children}
    </RoleGuard>
  );
}

export function AssignedEntityGuard({
  children,
  userRole,
  entityAssignedUserId,
  currentUserId,
  fallback,
  mode = 'hide'
}: {
  children: React.ReactNode;
  userRole: UserRole;
  entityAssignedUserId?: string;
  currentUserId: string;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable' | 'show-message';
}) {
  // Admin can see all
  if (userRole === UserRole.ADMIN) {
    return <>{children}</>;
  }
  
  // Senior managers can see all
  if (userRole === UserRole.SENIOR_SALES_MANAGER) {
    return <>{children}</>;
  }
  
  // Junior managers can only see assigned entities
  const hasAccess = entityAssignedUserId === currentUserId;
  
  if (hasAccess) {
    return <>{children}</>;
  }

  switch (mode) {
    case 'hide':
      return fallback ? <>{fallback}</> : null;
    case 'disable':
      return (
        <div className="opacity-50 cursor-not-allowed">
          {children}
        </div>
      );
    case 'show-message':
      return (
        <Alert>
          <EyeOff className="h-4 w-4" />
          <AlertDescription>
            You can only view entities assigned to you.
          </AlertDescription>
        </Alert>
      );
    default:
      return fallback ? <>{fallback}</> : null;
  }
}

// Permission check hook for conditional rendering
export function useRolePermissions(userRole: UserRole) {
  const canCreate = (entityType: string) => {
    const permissions = ROLE_PERMISSIONS[userRole]?.[entityType as keyof typeof ROLE_PERMISSIONS[UserRole.ADMIN]];
    return permissions?.create || false;
  };

  const canRead = (entityType: string, isAssigned = true) => {
    const permissions = ROLE_PERMISSIONS[userRole]?.[entityType as keyof typeof ROLE_PERMISSIONS[UserRole.ADMIN]];
    if (!permissions) return false;
    
    return permissions.readAll || (permissions.read && isAssigned);
  };

  const canUpdate = (entityType: string, isAssigned = true) => {
    const permissions = ROLE_PERMISSIONS[userRole]?.[entityType as keyof typeof ROLE_PERMISSIONS[UserRole.ADMIN]];
    if (!permissions) return false;
    
    if (userRole === UserRole.ADMIN) return permissions.update;
    
    // For non-admins, can only update assigned entities
    return permissions.update && isAssigned;
  };

  const canDelete = (entityType: string, isAssigned = true) => {
    const permissions = ROLE_PERMISSIONS[userRole]?.[entityType as keyof typeof ROLE_PERMISSIONS[UserRole.ADMIN]];
    if (!permissions) return false;
    
    if (userRole === UserRole.ADMIN) return permissions.delete;
    
    // For non-admins, can only delete assigned entities (if allowed at all)
    return permissions.delete && isAssigned;
  };

  const isAdmin = () => userRole === UserRole.ADMIN;
  const isSeniorManager = () => userRole === UserRole.SENIOR_SALES_MANAGER;
  const isJuniorManager = () => userRole === UserRole.JUNIOR_SALES_MANAGER;

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isAdmin,
    isSeniorManager,
    isJuniorManager,
    userRole
  };
}

// Role badge component for displaying user roles
export function RoleBadge({ role, size = 'default' }: { role: UserRole; size?: 'sm' | 'default' | 'lg' }) {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { variant: 'destructive' as const, icon: '👑', label: 'Admin' };
      case UserRole.SENIOR_SALES_MANAGER:
        return { variant: 'default' as const, icon: '🎯', label: 'Senior Sales Manager' };
      case UserRole.JUNIOR_SALES_MANAGER:
        return { variant: 'secondary' as const, icon: '📈', label: 'Junior Sales Manager' };
      default:
        return { variant: 'outline' as const, icon: '👤', label: 'User' };
    }
  };

  const config = getRoleConfig(role);
  
  return (
    <Badge variant={config.variant} className={size === 'sm' ? 'text-xs' : ''}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}