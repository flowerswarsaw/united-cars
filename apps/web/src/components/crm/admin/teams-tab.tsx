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
import { Search, Plus, Filter, Users as UsersIcon, User } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    let result = [...teams];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(team =>
        team.name.toLowerCase().includes(query) ||
        team.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(team =>
        statusFilter === 'active' ? team.isActive : !team.isActive
      );
    }

    setFilteredTeams(result);
  }, [teams, searchQuery, statusFilter]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/teams?withMembers=true');

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data);
      setFilteredTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!createFormData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      const response = await fetch('/api/crm/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      });

      if (response.ok) {
        toast.success('Team created successfully');
        setIsCreateDialogOpen(false);
        setCreateFormData({
          name: '',
          description: ''
        });
        fetchTeams();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Error creating team');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

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
            <Button className="gap-2" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teams ({filteredTeams.length})</CardTitle>
          <CardDescription>
            Click on a team to view and manage members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading teams...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No teams found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => {
                    const leader = team.memberships?.find(m => m.role === 'LEADER');
                    const memberCount = team.memberships?.length || 0;

                    return (
                      <TableRow key={team.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium">{team.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {team.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {leader ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                {leader.user?.displayName.charAt(0)}
                              </div>
                              <span className="text-sm">{leader.user?.displayName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No leader</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{memberCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(team.isActive)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/crm/teams/${team.id}`}>
                            <Button variant="outline" size="sm">
                              View Team
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team and add members later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                placeholder="e.g., Sales Team East"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Describe the team's purpose and responsibilities..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setCreateFormData({
                    name: '',
                    description: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTeam}>
                Create Team
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
