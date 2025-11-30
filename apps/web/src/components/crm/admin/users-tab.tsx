'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, UserPlus, Filter, Mail, Users as UsersIcon, UserX, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CRMUser {
  id: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
  customRoleId: string;
  status: 'ACTIVE' | 'INACTIVE';
  teamIds: string[];
  role?: {
    id: string;
    name: string;
    color?: string;
  };
}

export function UsersTab() {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deactivatingUser, setDeactivatingUser] = useState<CRMUser | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivationStats, setDeactivationStats] = useState<{
    dealsUnassigned: number;
    leadsUnassigned: number;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.title?.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      result = result.filter(user => user.customRoleId === roleFilter);
    }

    setFilteredUsers(result);
  }, [users, searchQuery, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateClick = (user: CRMUser) => {
    setDeactivatingUser(user);
    setDeactivationStats(null);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingUser) return;

    try {
      setDeactivating(true);

      const res = await fetch(`/api/crm/users/${deactivatingUser.id}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.error || 'Failed to deactivate user');
      }

      const result = await res.json();

      setDeactivationStats({
        dealsUnassigned: result.stats.dealsUnassigned,
        leadsUnassigned: result.stats.leadsUnassigned
      });

      toast.success(`User deactivated: ${deactivatingUser.displayName}`);

      // Reload users
      await fetchUsers();

      // Close dialog after a brief delay to show stats
      setTimeout(() => {
        setDeactivatingUser(null);
        setDeactivationStats(null);
      }, 3000);
    } catch (error: any) {
      console.error('Failed to deactivate user:', error);
      toast.error(error.message || 'Failed to deactivate user');
    } finally {
      setDeactivating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getRoleBadge = (role?: { name: string; color?: string }) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;

    return (
      <Badge
        style={{
          backgroundColor: role.color || '#6B7280',
          color: 'white'
        }}
      >
        {role.name}
      </Badge>
    );
  };

  const uniqueRoles = Array.from(
    new Map(
      users
        .filter(u => u.role)
        .map(u => [u.role!.id, u.role!])
    ).values()
  );

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
            <Button className="gap-2" size="sm">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active Only</SelectItem>
                <SelectItem value="INACTIVE">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Click on a user to view their detailed profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No users found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{user.displayName}</div>
                        {user.department && (
                          <div className="text-sm text-gray-500">{user.department}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {user.title || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.teamIds.length} {user.teamIds.length === 1 ? 'team' : 'teams'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/crm/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                          {user.status === 'ACTIVE' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeactivateClick(user)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deactivation Dialog */}
      <Dialog open={!!deactivatingUser} onOpenChange={(open) => !open && setDeactivatingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Deactivate User
            </DialogTitle>
            <DialogDescription className="pt-2">
              {deactivationStats ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">
                    User successfully deactivated!
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                    <p className="font-medium text-blue-900">Reassignment Summary:</p>
                    <ul className="mt-2 space-y-1 text-blue-800">
                      <li>• {deactivationStats.dealsUnassigned} deals unassigned</li>
                      <li>• {deactivationStats.leadsUnassigned} leads unassigned</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This dialog will close automatically...
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-medium">
                    Are you sure you want to deactivate {deactivatingUser?.displayName}?
                  </p>
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-md p-3 text-sm">
                    <p className="font-medium text-orange-900">This action will:</p>
                    <ul className="mt-2 space-y-1 text-orange-800">
                      <li>• Set the user's status to INACTIVE</li>
                      <li>• Unassign all their deals</li>
                      <li>• Unassign all their leads</li>
                      <li>• Tasks will remain connected to deals</li>
                      <li>• All actions will be logged for audit purposes</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Other users can claim the unassigned deals from the Deal Recovery page.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {!deactivationStats && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeactivatingUser(null)}
                disabled={deactivating}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivateConfirm}
                disabled={deactivating}
              >
                {deactivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate User
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
