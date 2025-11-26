'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Shield,
  Activity,
  Users as UsersIcon,
  TrendingUp,
  Edit2,
  Save,
  X,
  Mail,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';

interface CRMUser {
  id: string;
  platformUserId: string;
  displayName: string;
  email: string;
  avatar?: string;
  title?: string;
  department?: string;
  customRoleId: string;
  status: 'ACTIVE' | 'INACTIVE';
  teamIds: string[];
  managerId?: string;
  permissionOverrides?: {
    organisations?: Partial<EntityPermissions>;
    contacts?: Partial<EntityPermissions>;
    deals?: Partial<EntityPermissions>;
    leads?: Partial<EntityPermissions>;
    tasks?: Partial<EntityPermissions>;
    pipelines?: Partial<EntityPermissions>;
  };
  createdAt?: string;
  updatedAt?: string;
  role?: CustomRole;
  manager?: CRMUser;
}

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
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

interface UserStats {
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalDealsValue: number;
  contactsManaged: number;
  tasksCompleted: number;
  conversionRate: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId?: string;
  isActive: boolean;
}

export default function UserProfilePage() {
  const { user: sessionUser } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<CRMUser | null>(null);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<CRMUser[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<UserStats>({
    activeDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    totalDealsValue: 0,
    contactsManaged: 0,
    tasksCompleted: 0,
    conversionRate: 0
  });
  const [subordinates, setSubordinates] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Section-specific editing states
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    permissions: false
  });

  // Form data
  const [basicInfoData, setBasicInfoData] = useState({
    displayName: '',
    email: '',
    title: '',
    department: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    managerId: ''
  });

  const [permissionsData, setPermissionsData] = useState({
    customRoleId: '',
    permissionOverrides: {} as CRMUser['permissionOverrides']
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchRoles();
      fetchTeams();
      fetchAllUsers();
      fetchActivities();
      fetchSubordinates();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data);

      // Initialize form data
      setBasicInfoData({
        displayName: data.displayName || '',
        email: data.email || '',
        title: data.title || '',
        department: data.department || '',
        status: data.status || 'ACTIVE',
        managerId: data.managerId || ''
      });

      setPermissionsData({
        customRoleId: data.customRoleId || '',
        permissionOverrides: data.permissionOverrides || {}
      });

      // Fetch stats (mock for now)
      setStats({
        activeDeals: Math.floor(Math.random() * 15) + 5,
        wonDeals: Math.floor(Math.random() * 10) + 2,
        lostDeals: Math.floor(Math.random() * 5),
        totalDealsValue: Math.floor(Math.random() * 500000) + 100000,
        contactsManaged: Math.floor(Math.random() * 50) + 10,
        tasksCompleted: Math.floor(Math.random() * 100) + 20,
        conversionRate: Math.floor(Math.random() * 40) + 20
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user profile');
      router.push('/crm/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/crm/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/crm/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/crm/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      // Mock activities for now
      const mockActivities: UserActivity[] = [
        {
          id: '1',
          userId,
          action: 'CREATED',
          entityType: 'Deal',
          entityId: 'deal-1',
          description: 'Created new deal "Premium Package - Acme Corp"',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          userId,
          action: 'UPDATED',
          entityType: 'Contact',
          entityId: 'contact-1',
          description: 'Updated contact information for John Smith',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          userId,
          action: 'COMPLETED',
          entityType: 'Task',
          entityId: 'task-1',
          description: 'Completed task "Follow up with client"',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchSubordinates = async () => {
    try {
      const response = await fetch(`/api/crm/users?managerId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSubordinates(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch subordinates:', error);
    }
  };

  const saveSection = async (section: string, data: any) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/crm/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser(responseData);
        setEditingSections(prev => ({ ...prev, [section]: false }));
        toast.success(`${section === 'basicInfo' ? 'Profile' : 'Permissions'} updated successfully`);

        // Refetch data after update
        await fetchUser();
      } else {
        toast.error(`Failed to update: ${responseData.error}`);
      }
    } catch (error) {
      toast.error('Error updating user');
      console.error('Error:', error);
    }
  };

  const cancelSection = (section: string) => {
    if (!user) return;

    switch (section) {
      case 'basicInfo':
        setBasicInfoData({
          displayName: user.displayName || '',
          email: user.email || '',
          title: user.title || '',
          department: user.department || '',
          status: user.status || 'ACTIVE',
          managerId: user.managerId || ''
        });
        break;
      case 'permissions':
        setPermissionsData({
          customRoleId: user.customRoleId || '',
          permissionOverrides: user.permissionOverrides || {}
        });
        break;
    }

    setEditingSections(prev => ({ ...prev, [section]: false }));
  };

  const deleteUser = async () => {
    if (!user) return;

    if (!confirm(`Are you sure you want to delete ${user.displayName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        router.push('/crm/users');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete user: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting user');
      console.error('Error:', error);
    }
  };

  const togglePermissionOverride = (entity: string, permission: string) => {
    setPermissionsData(prev => {
      const current = prev.permissionOverrides || {};
      const entityPerms = current[entity as keyof typeof current] || {};

      return {
        ...prev,
        permissionOverrides: {
          ...current,
          [entity]: {
            ...entityPerms,
            [permission]: !entityPerms[permission as keyof typeof entityPerms]
          }
        }
      };
    });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const SectionEditButtons = ({ section, onSave }: { section: keyof typeof editingSections, onSave: () => void }) => (
    <div className="flex gap-2">
      {editingSections[section] ? (
        <>
          <Button onClick={onSave} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" onClick={() => cancelSection(section)} size="sm">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          onClick={() => setEditingSections(prev => ({ ...prev, [section]: true }))}
          size="sm"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getRoleBadge = (role?: CustomRole) => {
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

  const getPermissionIcon = (hasPermission: boolean | undefined) => {
    if (hasPermission) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-gray-300" />;
  };

  const renderPermissionMatrix = (permissions: CustomRole['permissions'], overrides?: CRMUser['permissionOverrides']) => {
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
              const entityOverrides = overrides?.[entity as keyof typeof overrides];

              return (
                <tr key={entity} className="hover:bg-gray-50">
                  <td className="border p-2 text-sm font-medium capitalize">
                    {entity}
                  </td>
                  {permTypes.map(pt => {
                    const hasPermission = entityOverrides?.[pt.key as keyof typeof entityOverrides] ??
                                        entityPerms?.[pt.key as keyof typeof entityPerms];
                    const isOverridden = entityOverrides?.[pt.key as keyof typeof entityOverrides] !== undefined;

                    return (
                      <td key={pt.key} className="border p-2 text-center">
                        {editingSections.permissions ? (
                          <button
                            type="button"
                            onClick={() => togglePermissionOverride(entity, pt.key)}
                            className={`p-1 rounded hover:bg-gray-100 ${
                              isOverridden ? 'bg-blue-50' : ''
                            }`}
                          >
                            {getPermissionIcon(hasPermission)}
                          </button>
                        ) : (
                          <div className={isOverridden ? 'bg-blue-50 inline-block p-1 rounded' : ''}>
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
        {!editingSections.permissions && Object.keys(overrides || {}).length > 0 && (
          <p className="text-xs text-blue-600 mt-2">
            Permissions with blue background have been overridden
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
            <p className="text-gray-500">Loading user profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout user={sessionUser}>
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">User not found</h2>
            <p className="text-gray-500 mb-6">The requested user could not be found.</p>
            <Link href="/crm/users">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
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
        title={user.displayName}
        description={`${user.title || 'CRM User'}${user.department ? ` • ${user.department}` : ''}`}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Users', href: '/crm/users' },
          { label: user.displayName }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {getStatusBadge(user.status)}
            {getRoleBadge(user.role)}
            <Button
              variant="outline"
              size="sm"
              onClick={deleteUser}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="container mx-auto py-6 space-y-6">

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Hierarchy
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>User profile details</CardDescription>
                </div>
                <SectionEditButtons
                  section="basicInfo"
                  onSave={() => saveSection('basicInfo', basicInfoData)}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="displayName"
                      value={basicInfoData.displayName}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, displayName: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{user.displayName || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="email"
                      type="email"
                      value={basicInfoData.email}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.email || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">Job Title</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="title"
                      value={basicInfoData.title}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, title: e.target.value })}
                      placeholder="Sales Manager"
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.title || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="department"
                      value={basicInfoData.department}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, department: e.target.value })}
                      placeholder="Sales"
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.department || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  {editingSections.basicInfo ? (
                    <Select
                      value={basicInfoData.status}
                      onValueChange={(value) => setBasicInfoData({ ...basicInfoData, status: value as 'ACTIVE' | 'INACTIVE' })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getStatusBadge(user.status)}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manager Assignment */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Manager Assignment</CardTitle>
                  <CardDescription>Reporting structure</CardDescription>
                </div>
                <SectionEditButtons
                  section="basicInfo"
                  onSave={() => saveSection('basicInfo', basicInfoData)}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="managerId">Reports To</Label>
                  {editingSections.basicInfo ? (
                    <Select
                      value={basicInfoData.managerId || 'none'}
                      onValueChange={(value) => setBasicInfoData({ ...basicInfoData, managerId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {allUsers
                          .filter(u => u.id !== userId)
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.displayName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      {user.manager ? (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium">
                            {user.manager.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.manager.displayName}</p>
                            <p className="text-xs text-gray-500">{user.manager.title || 'CRM User'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No manager assigned</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Team Memberships</Label>
                  <div className="mt-1 space-y-2">
                    {user.teamIds.length > 0 ? (
                      teams
                        .filter(t => user.teamIds.includes(t.id))
                        .map(team => (
                          <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{team.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {team.leaderId === user.id ? 'Leader' : 'Member'}
                            </Badge>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No team memberships</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(user.createdAt)}</span>
                  </div>
                  {user.updatedAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(user.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Role & Permissions</CardTitle>
                <CardDescription>
                  Assign role and configure permission overrides
                </CardDescription>
              </div>
              <SectionEditButtons
                section="permissions"
                onSave={() => saveSection('permissions', permissionsData)}
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="role">Assigned Role</Label>
                {editingSections.permissions ? (
                  <Select
                    value={permissionsData.customRoleId}
                    onValueChange={(value) => setPermissionsData({ ...permissionsData, customRoleId: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    {user.role ? (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.role.name}</p>
                          {user.role.description && (
                            <p className="text-sm text-gray-600 mt-1">{user.role.description}</p>
                          )}
                        </div>
                        {getRoleBadge(user.role)}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No role assigned</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Permission Matrix</Label>
                  {editingSections.permissions && (
                    <p className="text-xs text-gray-500">Click to toggle permission overrides</p>
                  )}
                </div>
                {user.role && renderPermissionMatrix(
                  user.role.permissions,
                  editingSections.permissions ? permissionsData.permissionOverrides : user.permissionOverrides
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User actions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.entityType}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manager */}
            <Card>
              <CardHeader>
                <CardTitle>Reports To</CardTitle>
                <CardDescription>Direct manager</CardDescription>
              </CardHeader>
              <CardContent>
                {user.manager ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium text-lg">
                      {user.manager.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.manager.displayName}</p>
                      <p className="text-sm text-gray-600">{user.manager.title || 'CRM User'}</p>
                      <p className="text-xs text-gray-500">{user.manager.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No manager assigned
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subordinates */}
            <Card>
              <CardHeader>
                <CardTitle>Direct Reports</CardTitle>
                <CardDescription>Team members reporting to this user</CardDescription>
              </CardHeader>
              <CardContent>
                {subordinates.length > 0 ? (
                  <div className="space-y-3">
                    {subordinates.map((subordinate) => (
                      <div
                        key={subordinate.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => router.push(`/crm/users/${subordinate.id}`)}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-medium">
                          {subordinate.displayName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{subordinate.displayName}</p>
                          <p className="text-xs text-gray-600">{subordinate.title || 'CRM User'}</p>
                        </div>
                        {getStatusBadge(subordinate.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No direct reports
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeDeals}</div>
                <p className="text-xs text-gray-500 mt-1">Currently in pipeline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Won Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.wonDeals}</div>
                <p className="text-xs text-gray-500 mt-1">Successfully closed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Lost Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.lostDeals}</div>
                <p className="text-xs text-gray-500 mt-1">Opportunities lost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Deal Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats.totalDealsValue)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Combined deal value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Contacts Managed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.contactsManaged}</div>
                <p className="text-xs text-gray-500 mt-1">Assigned contacts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tasks Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.tasksCompleted}</div>
                <p className="text-xs text-gray-500 mt-1">Finished tasks</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Conversion Rate</Label>
                    <span className="text-sm font-medium">{stats.conversionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${stats.conversionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Win Rate</Label>
                    <span className="text-sm font-medium">
                      {stats.wonDeals + stats.lostDeals > 0
                        ? Math.round((stats.wonDeals / (stats.wonDeals + stats.lostDeals)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          stats.wonDeals + stats.lostDeals > 0
                            ? Math.round((stats.wonDeals / (stats.wonDeals + stats.lostDeals)) * 100)
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}
