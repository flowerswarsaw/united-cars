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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Filter, Shield, Users, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';

interface EntityPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canReadAll: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  permissions: {
    organisations: EntityPermissions;
    contacts: EntityPermissions;
    deals: EntityPermissions;
    leads: EntityPermissions;
    tasks: EntityPermissions;
    pipelines: EntityPermissions;
  };
  isActive: boolean;
  userCount?: number;
}

const DEFAULT_PERMISSIONS: EntityPermissions = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canReadAll: false
};

const DEFAULT_ROLE_PERMISSIONS = {
  organisations: DEFAULT_PERMISSIONS,
  contacts: DEFAULT_PERMISSIONS,
  deals: DEFAULT_PERMISSIONS,
  leads: DEFAULT_PERMISSIONS,
  tasks: DEFAULT_PERMISSIONS,
  pipelines: DEFAULT_PERMISSIONS
};

export default function RolesPage() {
  const { user } = useSession();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Create role dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    permissions: DEFAULT_ROLE_PERMISSIONS
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    let result = [...roles];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(role =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(role =>
        statusFilter === 'active' ? role.isActive : !role.isActive
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(role =>
        typeFilter === 'system' ? role.isSystem : !role.isSystem
      );
    }

    setFilteredRoles(result);
  }, [roles, searchQuery, statusFilter, typeFilter]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/roles');

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data);
      setFilteredRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!createFormData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      const response = await fetch('/api/crm/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      });

      if (response.ok) {
        toast.success('Role created successfully');
        setIsCreateDialogOpen(false);
        setCreateFormData({
          name: '',
          description: '',
          color: '#6B7280',
          permissions: DEFAULT_ROLE_PERMISSIONS
        });
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Error creating role');
    }
  };

  const togglePermission = (entity: string, permission: string) => {
    setCreateFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: {
          ...prev.permissions[entity as keyof typeof prev.permissions],
          [permission]: !prev.permissions[entity as keyof typeof prev.permissions][permission as keyof EntityPermissions]
        }
      }
    }));
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    if (hasPermission) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-gray-300" />;
  };

  const getRoleBadge = (role: CustomRole) => {
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

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const renderPermissionMatrix = () => {
    const entities = ['organisations', 'contacts', 'deals', 'leads', 'tasks', 'pipelines'];
    const permTypes = [
      { key: 'canCreate', label: 'Create' },
      { key: 'canRead', label: 'Read' },
      { key: 'canUpdate', label: 'Update' },
      { key: 'canDelete', label: 'Delete' },
      { key: 'canReadAll', label: 'Read All' }
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left font-medium">Entity</th>
              {permTypes.map(pt => (
                <th key={pt.key} className="border p-2 text-center font-medium">
                  {pt.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entities.map(entity => {
              const entityPerms = createFormData.permissions[entity as keyof typeof createFormData.permissions];

              return (
                <tr key={entity} className="hover:bg-gray-50">
                  <td className="border p-2 font-medium capitalize">
                    {entity}
                  </td>
                  {permTypes.map(pt => {
                    const hasPermission = entityPerms[pt.key as keyof EntityPermissions];

                    return (
                      <td key={pt.key} className="border p-2 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission(entity, pt.key)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {getPermissionIcon(hasPermission)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click icons to toggle permissions</p>
      </div>
    );
  };

  return (
    <AppLayout user={user}>
      <PageHeader
        title="CRM Roles"
        description="Manage custom roles and permissions for CRM users"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Roles' }
        ]}
        actions={
          <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        }
      />
      <div className="container mx-auto py-6 space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {roles.filter(r => r.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {roles.filter(r => r.isSystem).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custom Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {roles.filter(r => !r.isSystem).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System Roles</SelectItem>
                <SelectItem value="custom">Custom Roles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
          <CardDescription>
            Click on a role to view and edit details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading roles...
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No roles found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-gray-50">
                      <TableCell>
                        {getRoleBadge(role)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {role.description || 'No description'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            <Shield className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{role.userCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(role.isActive)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/crm/roles/${role.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role-color">Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="role-color"
                    type="color"
                    value={createFormData.color}
                    onChange={(e) => setCreateFormData({ ...createFormData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={createFormData.color}
                    onChange={(e) => setCreateFormData({ ...createFormData, color: e.target.value })}
                    placeholder="#6B7280"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Describe the role and its responsibilities..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2">
                {renderPermissionMatrix()}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setCreateFormData({
                    name: '',
                    description: '',
                    color: '#6B7280',
                    permissions: DEFAULT_ROLE_PERMISSIONS
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>
                Create Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
}
