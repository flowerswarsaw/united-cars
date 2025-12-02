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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users as UsersIcon,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Trash2,
  Plus,
  Crown,
  Mail,
  User
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';

interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId?: string;
  isActive: boolean;
  memberships?: TeamMembership[];
  createdAt?: string;
  updatedAt?: string;
}

interface TeamMembership {
  id: string;
  teamId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
  user?: CRMUser;
}

interface CRMUser {
  id: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function TeamDetailPage() {
  const { user: sessionUser } = useSession();
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [allUsers, setAllUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Add member dialog
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (teamId) {
      fetchTeam();
      fetchAllUsers();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/teams/${teamId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      setTeam(data);

      // Initialize form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        isActive: data.isActive ?? true
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team details');
      router.push('/crm/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/crm/users?status=ACTIVE');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSave = async () => {
    if (!team) return;

    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      const response = await fetch(`/api/crm/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (response.ok) {
        setTeam(responseData);
        setIsEditing(false);
        toast.success('Team updated successfully');
        await fetchTeam();
      } else {
        toast.error(`Failed to update team: ${responseData.error}`);
      }
    } catch (error) {
      toast.error('Error updating team');
      console.error('Error:', error);
    }
  };

  const handleCancel = () => {
    if (!team) return;

    setFormData({
      name: team.name || '',
      description: team.description || '',
      isActive: team.isActive ?? true
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!team) return;

    if (!confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/teams/${teamId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Team deleted successfully');
        router.push('/crm/admin');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete team: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting team');
      console.error('Error:', error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      const response = await fetch(`/api/crm/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: 'MEMBER'
        })
      });

      if (response.ok) {
        toast.success('Member added successfully');
        setIsAddMemberDialogOpen(false);
        setSelectedUserId('');
        fetchTeam();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Error adding member');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/teams/${teamId}/members/${membershipId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Member removed successfully');
        fetchTeam();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Error removing member');
    }
  };

  const handleSetLeader = async (userId: string) => {
    try {
      const response = await fetch(`/api/crm/teams/${teamId}/leader`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leaderId: userId })
      });

      if (response.ok) {
        toast.success('Team leader updated successfully');
        fetchTeam();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to set leader');
      }
    } catch (error) {
      console.error('Error setting leader:', error);
      toast.error('Error setting leader');
    }
  };

  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return 'Unknown';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getRoleBadge = (role: string, isLeader: boolean) => {
    if (isLeader) {
      return (
        <Badge className="bg-blue-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Leader
        </Badge>
      );
    }
    return <Badge variant="outline">Member</Badge>;
  };

  // Available users = all active users minus current members
  const availableUsers = allUsers.filter(
    user => !team?.memberships?.some(m => m.userId === user.id)
  );

  if (loading) {
    return (
      <AppLayout user={sessionUser}>
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading team details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!team) {
    return (
      <AppLayout user={sessionUser}>
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Team not found</h2>
            <p className="text-gray-500 mb-6">The requested team could not be found.</p>
            <Link href="/crm/teams">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
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
        title={team.name}
        description={team.description || 'No description provided'}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Administration', href: '/crm/admin' },
          { label: 'Teams' },
          { label: team.name }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {getStatusBadge(team.isActive)}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="container mx-auto py-6 space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>Basic team details and settings</CardDescription>
            </div>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Team Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Team name"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{team.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the team..."
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                  {team.description || 'No description provided'}
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
                <div className="mt-1">{getStatusBadge(team.isActive)}</div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                Created {formatDate(team.createdAt)}
              </div>
              {team.updatedAt && (
                <div className="text-sm text-gray-600 mt-1">
                  Updated {formatDate(team.updatedAt)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Team Stats</CardTitle>
            <CardDescription>Quick overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold">{team.memberships?.length || 0}</div>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {team.leaderId ? 1 : 0}
              </div>
              <p className="text-sm text-gray-600">Team Leader</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {team.memberships?.filter(m => m.user?.status === 'ACTIVE').length || 0}
              </div>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage team member assignments and roles
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddMemberDialogOpen(true)}
            disabled={availableUsers.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          {team.memberships && team.memberships.length > 0 ? (
            <div className="space-y-3">
              {team.memberships.map((membership) => {
                const isLeader = membership.userId === team.leaderId;

                return (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        isLeader ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      } font-medium text-lg`}>
                        {membership.user?.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {membership.user?.displayName}
                          </p>
                          {getRoleBadge(membership.role, isLeader)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {membership.user?.title || 'CRM User'}
                          {membership.user?.department && ` • ${membership.user.department}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">{membership.user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isLeader && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetLeader(membership.userId)}
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          Make Leader
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(membership.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No team members yet</p>
              <Button
                className="mt-4"
                onClick={() => setIsAddMemberDialogOpen(true)}
                disabled={availableUsers.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user to add to this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              {availableUsers.length > 0 ? (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                            {user.displayName.charAt(0)}
                          </div>
                          <div>
                            <span>{user.displayName}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  All active users are already members of this team
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddMemberDialogOpen(false);
                  setSelectedUserId('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId}
              >
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
}
