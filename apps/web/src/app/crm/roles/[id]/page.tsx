'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle
} from 'lucide-react';
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
  createdAt?: string;
  updatedAt?: string;
}

export default function RoleDetailPage() {
  const { user: sessionUser } = useSession();
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const [role, setRole] = useState<CustomRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    isActive: true,
    permissions: {} as CustomRole['permissions']
  });

  useEffect(() => {
    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/roles/${roleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }

      const data = await response.json();
      setRole(data);

      // Initialize form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        color: data.color || '#6B7280',
        isActive: data.isActive ?? true,
        permissions: data.permissions || {}
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      toast.error('Failed to load role details');
      router.push('/crm/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!role) return;

    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      const response = await fetch(`/api/crm/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (response.ok) {
        setRole(responseData);
        setIsEditing(false);
        toast.success('Role updated successfully');
        await fetchRole();
      } else {
        toast.error(`Failed to update role: ${responseData.error}`);
      }
    } catch (error) {
      toast.error('Error updating role');
      console.error('Error:', error);
    }
  };

  const handleCancel = () => {
    if (!role) return;

    setFormData({
      name: role.name || '',
      description: role.description || '',
      color: role.color || '#6B7280',
      isActive: role.isActive ?? true,
      permissions: role.permissions || {}
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!role) return;

    if (role.isSystem) {
      toast.error('System roles cannot be deleted');
      return;
    }

    if (role.userCount && role.userCount > 0) {
      toast.error('Cannot delete role - users are still assigned to this role');
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Role deleted successfully');
        router.push('/crm/roles');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete role: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting role');
      console.error('Error:', error);
    }
  };

  const togglePermission = (entity: string, permission: string) => {
    setFormData(prev => ({
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

  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return 'Unknown';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return <Badge variant="secondary">Inactive</Badge>
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

    const permissions = isEditing ? formData.permissions : role?.permissions;
    if (!permissions) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left text-sm font-medium">Entity</th>
              {permTypes.map(pt => (
                <th key={pt.key} className="border p-2 text-center text-sm font-medium">
                  {pt.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entities.map(entity => {
              const entityPerms = permissions[entity as keyof typeof permissions];

              return (
                <tr key={entity} className="hover:bg-gray-50">
                  <td className="border p-2 text-sm font-medium capitalize">
                    {entity}
                  </td>
                  {permTypes.map(pt => {
                    const hasPermission = entityPerms?.[pt.key as keyof EntityPermissions];

                    return (
                      <td key={pt.key} className="border p-2 text-center">
                        {isEditing && !role?.isSystem ? (
                          <button
                            type="button"
                            onClick={() => togglePermission(entity, pt.key)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            {getPermissionIcon(hasPermission)}
                          </button>
                        ) : (
                          <div>
                            {getPermissionIcon(hasPermission)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {isEditing && !role?.isSystem && (
          <p className="text-xs text-gray-500 mt-2">Click icons to toggle permissions</p>
        )}
        {role?.isSystem && (
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            System role permissions cannot be modified
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout user={sessionUser}>
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading role details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!role) {
    return (
      <AppLayout user={sessionUser}>
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Role not found</h2>
            <p className="text-gray-500 mb-6">The requested role could not be found.</p>
            <Link href="/crm/roles">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={sessionUser}>
      <PageHeader
        title={role.name}
        description={role.description || 'No description provided'}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Roles', href: '/crm/roles' },
          { label: role.name }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {role.isSystem && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <Shield className="h-3 w-3 mr-1" />
              System Role
            </Badge>
          )}
          {getStatusBadge(role.isActive)}
          {getRoleBadge(role)}
          {!role.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={role.userCount && role.userCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          </div>
        }
      />
      <div className="container mx-auto py-6 space-y-6">

      {/* System Role Warning */}
      {role.isSystem && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">System Role</p>
                <p className="text-sm text-blue-700 mt-1">
                  This is a system-defined role. You can view permissions but cannot modify or delete this role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cannot Delete Warning */}
      {!role.isSystem && role.userCount && role.userCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Cannot Delete Role</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This role is currently assigned to {role.userCount} user{role.userCount > 1 ? 's' : ''}.
                  Reassign or remove users before deleting this role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Role details and settings</CardDescription>
          </div>
          {!role.isSystem && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel} size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Role name"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{role.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="color">Badge Color</Label>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6B7280"
                  />
                </div>
              ) : (
                <div className="mt-1">
                  {getRoleBadge(role)}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role..."
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {role.description || 'No description provided'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            {isEditing ? (
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1">{getStatusBadge(role.isActive)}</div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{role.userCount || 0} user{role.userCount !== 1 ? 's' : ''} assigned to this role</span>
            </div>
            {role.createdAt && (
              <div className="text-sm text-gray-600 mt-1">
                Created {formatDate(role.createdAt)}
              </div>
            )}
            {role.updatedAt && (
              <div className="text-sm text-gray-600 mt-1">
                Updated {formatDate(role.updatedAt)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
          <CardDescription>
            Define what actions users with this role can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderPermissionMatrix()}
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}
