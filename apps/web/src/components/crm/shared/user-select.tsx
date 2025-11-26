'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Loader2 } from 'lucide-react';

export interface CRMUser {
  id: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
  role?: {
    id: string;
    name: string;
    color?: string;
  };
}

interface UserSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  statusFilter?: 'ACTIVE' | 'INACTIVE' | 'all';
  roleFilter?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * UserSelect Component
 *
 * A reusable select component for choosing CRM users across the application.
 * Fetches users from the API and provides filtering options.
 *
 * @example
 * ```tsx
 * <UserSelect
 *   value={selectedUserId}
 *   onValueChange={setSelectedUserId}
 *   placeholder="Assign to user..."
 *   includeEmpty
 *   statusFilter="ACTIVE"
 * />
 * ```
 */
export function UserSelect({
  value,
  onValueChange,
  placeholder = 'Select user...',
  includeEmpty = false,
  emptyLabel = 'Unassigned',
  statusFilter = 'ACTIVE',
  roleFilter,
  className,
  disabled = false,
  required = false
}: UserSelectProps) {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (roleFilter) {
        params.append('roleId', roleFilter);
      }

      const response = await fetch(`/api/crm/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === value);

  return (
    <Select
      value={value || (includeEmpty ? 'none' : undefined)}
      onValueChange={(val) => onValueChange(val === 'none' ? '' : val)}
      disabled={disabled || loading}
      required={required}
    >
      <SelectTrigger className={className}>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading users...</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder}>
            {value && selectedUser ? (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {selectedUser.displayName.charAt(0)}
                </div>
                <span className="truncate">{selectedUser.displayName}</span>
                {selectedUser.role && (
                  <Badge
                    className="ml-auto"
                    style={{
                      backgroundColor: selectedUser.role.color || '#6B7280',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}
                  >
                    {selectedUser.role.name}
                  </Badge>
                )}
              </div>
            ) : null}
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
        {includeEmpty && (
          <SelectItem value="none">
            <div className="flex items-center gap-2 text-gray-500">
              <User className="h-4 w-4" />
              <span>{emptyLabel}</span>
            </div>
          </SelectItem>
        )}

        {users.length === 0 && !loading ? (
          <div className="px-2 py-6 text-center text-sm text-gray-500">
            No users available
          </div>
        ) : (
          users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-3 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex-shrink-0">
                  {user.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{user.displayName}</span>
                    {user.status === 'INACTIVE' && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.title || 'CRM User'}
                    {user.department && ` • ${user.department}`}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
                {user.role && (
                  <Badge
                    className="flex-shrink-0"
                    style={{
                      backgroundColor: user.role.color || '#6B7280',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}
                  >
                    {user.role.name}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/**
 * UserSelectMultiple Component
 *
 * A variant that allows selecting multiple users (for future use).
 * Currently returns the base component - extend as needed.
 */
export function UserSelectMultiple(props: Omit<UserSelectProps, 'value' | 'onValueChange'> & {
  values: string[];
  onValuesChange: (values: string[]) => void;
}) {
  // TODO: Implement multi-select variant if needed
  // For now, return null as a placeholder
  return null;
}
