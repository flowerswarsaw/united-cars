"use client";

import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Circle,
  Calendar,
  User,
  Building2,
  TrendingUp,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, EntityType, Deal, Contact, Organisation } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

const StatusIcons = {
  'PENDING': Circle,
  'IN_PROGRESS': Clock,
  'COMPLETED': CheckCircle2,
  'CANCELLED': XCircle,
};

const StatusColors = {
  'PENDING': 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  'IN_PROGRESS': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  'COMPLETED': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300',
  'CANCELLED': 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
};

const PriorityColors = {
  'LOW': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'MEDIUM': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'HIGH': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'URGENT': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const TargetIcons = {
  'DEAL': TrendingUp,
  'CONTACT': User,
  'ORGANISATION': Building2,
  'LEAD': User,
};

interface TaskFilters {
  status: string;
  priority: string;
  targetType: string;
}

export default function TasksPage() {
  const { user } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    targetType: 'all'
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    targetType: EntityType.DEAL,
    targetId: ''
  });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        toast.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRelatedData = useCallback(async () => {
    try {
      const [dealsRes, contactsRes, orgsRes] = await Promise.all([
        fetch('/api/crm/deals'),
        fetch('/api/crm/contacts'),
        fetch('/api/crm/organisations')
      ]);
      
      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (orgsRes.ok) setOrganisations(await orgsRes.json());
    } catch (error) {
      console.error('Failed to load related data:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadRelatedData();
  }, [loadTasks, loadRelatedData]);

  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply target type filter
    if (filters.targetType !== 'all') {
      filtered = filtered.filter(task => task.targetType === filters.targetType);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filters]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadTasks();
        toast.success('Task updated successfully');
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          ...(formData.dueDate && { dueDate: formData.dueDate }),
          targetType: formData.targetType,
          targetId: formData.targetId || undefined,
          status: TaskStatus.TODO
        })
      });

      if (response.ok) {
        toast.success('Task created successfully');
        setIsCreateOpen(false);
        resetForm();
        await loadTasks();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      targetType: task.targetType,
      targetId: task.targetId || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTask || !formData.title.trim()) return;

    try {
      const response = await fetch(`/api/crm/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          ...(formData.dueDate && { dueDate: formData.dueDate }),
          targetType: formData.targetType,
          targetId: formData.targetId || undefined
        })
      });

      if (response.ok) {
        toast.success('Task updated successfully');
        setIsEditOpen(false);
        setSelectedTask(null);
        resetForm();
        await loadTasks();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/crm/tasks/${selectedTask.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        setIsDeleteOpen(false);
        setSelectedTask(null);
        await loadTasks();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      targetType: EntityType.DEAL,
      targetId: ''
    });
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate?: Date | string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getTargetName = (task: Task) => {
    switch (task.targetType) {
      case EntityType.DEAL:
        const deal = deals.find(d => d.id === task.targetId);
        return deal?.title || 'Unknown Deal';
      case EntityType.CONTACT:
        const contact = contacts.find(c => c.id === task.targetId);
        return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
      case EntityType.ORGANISATION:
        const org = organisations.find(o => o.id === task.targetId);
        return org?.name || 'Unknown Organisation';
      default:
        return 'Unknown Target';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      targetType: 'all'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.targetType !== 'all' || searchQuery;

  const navigateToTarget = (task: Task) => {
    if (!task.targetId) return;
    
    switch (task.targetType) {
      case EntityType.DEAL:
        window.open(`/crm/deals`, '_blank');
        break;
      case EntityType.CONTACT:
        window.open(`/crm/contacts/${task.targetId}`, '_blank');
        break;
      case EntityType.ORGANISATION:
        window.open(`/crm/organisations/${task.targetId}`, '_blank');
        break;
    }
  };

  // Create task button
  const newTaskButton = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description (optional)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetType">Target Type</Label>
              <Select 
                value={formData.targetType} 
                onValueChange={(value) => setFormData({ ...formData, targetType: value as EntityType, targetId: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EntityType.DEAL}>Deal</SelectItem>
                  <SelectItem value={EntityType.CONTACT}>Contact</SelectItem>
                  <SelectItem value={EntityType.ORGANISATION}>Organisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetId">Target</Label>
              <Select value={formData.targetId || undefined} onValueChange={(value) => setFormData({ ...formData, targetId: value || '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {formData.targetType === EntityType.DEAL && deals.map(deal => (
                    <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                  ))}
                  {formData.targetType === EntityType.CONTACT && contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</SelectItem>
                  ))}
                  {formData.targetType === EntityType.ORGANISATION && organisations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title.trim()}>
              Create Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Tasks"
        description="Manage your action items and follow-ups"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Tasks' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-card/80 to-muted/20 px-6 py-4 border-b border-border/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/80 border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>
              
              {/* Filters and New Task Button */}
              <div className="flex gap-3 items-center">
                {/* Filters */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="w-48 bg-background/80 border-border/60">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                    <SelectItem value={TaskStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters({ ...filters, priority: value })}
                >
                  <SelectTrigger className="w-48 bg-background/80 border-border/60">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.targetType}
                  onValueChange={(value) => setFilters({ ...filters, targetType: value })}
                >
                  <SelectTrigger className="w-48 bg-background/80 border-border/60">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={EntityType.DEAL}>Deals</SelectItem>
                    <SelectItem value={EntityType.CONTACT}>Contacts</SelectItem>
                    <SelectItem value={EntityType.ORGANISATION}>Organisations</SelectItem>
                  </SelectContent>
                </Select>

                {/* New Task Button */}
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </div>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 border-border/50">
                <TableHead className="font-semibold text-foreground">Task</TableHead>
                <TableHead className="font-semibold text-foreground">Target</TableHead>
                <TableHead className="font-semibold text-foreground">Priority</TableHead>
                <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-muted-foreground">
                        {hasActiveFilters ? 'No tasks match your filters' : 'No tasks found'}
                      </div>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="text-sm">
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const StatusIcon = StatusIcons[task.status];
                  const TargetIcon = TargetIcons[task.targetType];
                  const overdue = isOverdue(task.dueDate);
                  
                  return (
                    <TableRow key={task.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TargetIcon className="h-4 w-4 text-muted-foreground" />
                          {task.targetId ? (
                            <button
                              onClick={() => navigateToTarget(task)}
                              className="text-xs font-medium px-2 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors text-primary hover:text-primary/80"
                              title="Click to view target"
                            >
                              {getTargetName(task)}
                            </button>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {task.targetType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${PriorityColors[task.priority]} text-xs font-medium px-2 py-1`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={overdue ? 'text-red-600 font-medium' : 'text-foreground'}>
                            {formatDate(task.dueDate)}
                            {overdue && <span className="text-red-500 text-xs ml-1">(overdue)</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${StatusColors[task.status]} text-xs font-medium px-2 py-1 flex items-center space-x-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{task.status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const nextStatus = task.status === TaskStatus.TODO 
                                ? TaskStatus.IN_PROGRESS 
                                : task.status === TaskStatus.IN_PROGRESS 
                                  ? TaskStatus.DONE 
                                  : TaskStatus.TODO;
                              updateTaskStatus(task.id, nextStatus);
                            }}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            title="Update status"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(task)}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            title="Edit task"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(task)}
                            className="h-8 px-2 text-muted-foreground hover:text-red-600"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Task Title *</Label>
                <Input
                  id="editTitle"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description (optional)"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editDueDate">Due Date</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editTargetType">Target Type</Label>
                  <Select 
                    value={formData.targetType} 
                    onValueChange={(value) => setFormData({ ...formData, targetType: value as EntityType, targetId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EntityType.DEAL}>Deal</SelectItem>
                      <SelectItem value={EntityType.CONTACT}>Contact</SelectItem>
                      <SelectItem value={EntityType.ORGANISATION}>Organisation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editTargetId">Target</Label>
                  <Select value={formData.targetId || undefined} onValueChange={(value) => setFormData({ ...formData, targetId: value || '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.targetType === EntityType.DEAL && deals.map(deal => (
                        <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                      ))}
                      {formData.targetType === EntityType.CONTACT && contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</SelectItem>
                      ))}
                      {formData.targetType === EntityType.ORGANISATION && organisations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsEditOpen(false);
                  setSelectedTask(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={!formData.title.trim()}>
                  Update Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedTask(null);
                }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}