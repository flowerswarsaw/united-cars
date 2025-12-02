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
  Pause,
  Calendar,
  Building2,
  User,
  TrendingUp,
  AlertTriangle,
  Edit,
  Trash2,
  TicketIcon,
  MessageSquare,
  Wrench,
  AlertCircle
} from 'lucide-react';
import {
  Ticket,
  TicketStatus,
  TicketType,
  TicketPriority,
  Organisation,
  Contact,
  Deal
} from '@united-cars/crm-core';
import toast from 'react-hot-toast';

const StatusIcons: Record<TicketStatus, React.ComponentType<{ className?: string }>> = {
  [TicketStatus.OPEN]: Circle,
  [TicketStatus.IN_PROGRESS]: Clock,
  [TicketStatus.WAITING]: Pause,
  [TicketStatus.RESOLVED]: CheckCircle2,
  [TicketStatus.CLOSED]: XCircle,
};

const StatusColors: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  [TicketStatus.IN_PROGRESS]: 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300',
  [TicketStatus.WAITING]: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
  [TicketStatus.RESOLVED]: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300',
  [TicketStatus.CLOSED]: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
};

const PriorityColors: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  [TicketPriority.MEDIUM]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [TicketPriority.HIGH]: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  [TicketPriority.URGENT]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const TypeIcons: Record<TicketType, React.ComponentType<{ className?: string }>> = {
  [TicketType.CLAIM]: AlertCircle,
  [TicketType.SUPPORT]: MessageSquare,
  [TicketType.SERVICE]: Wrench,
  [TicketType.COMPLAINT]: AlertTriangle,
};

const TypeColors: Record<TicketType, string> = {
  [TicketType.CLAIM]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  [TicketType.SUPPORT]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [TicketType.SERVICE]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  [TicketType.COMPLAINT]: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

interface TicketFilters {
  status: string;
  priority: string;
  type: string;
}

export default function TicketsPage() {
  const { user } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({
    status: 'all',
    priority: 'all',
    type: 'all'
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: TicketType.SUPPORT,
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.OPEN,
    dueDate: '',
    organisationId: '',
    contactId: '',
    dealId: '',
    source: ''
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        toast.error('Failed to load tickets');
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRelatedData = useCallback(async () => {
    try {
      const [orgsRes, contactsRes, dealsRes] = await Promise.all([
        fetch('/api/crm/organisations'),
        fetch('/api/crm/contacts'),
        fetch('/api/crm/deals')
      ]);

      if (orgsRes.ok) setOrganisations(await orgsRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
    } catch (error) {
      console.error('Failed to load related data:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadRelatedData();
  }, [loadTickets, loadRelatedData]);

  useEffect(() => {
    let filtered = tickets;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(ticket => ticket.type === filters.type);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, filters]);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    try {
      const response = await fetch('/api/crm/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          type: formData.type,
          priority: formData.priority,
          status: formData.status,
          ...(formData.dueDate && { dueDate: formData.dueDate }),
          organisationId: formData.organisationId || undefined,
          contactId: formData.contactId || undefined,
          dealId: formData.dealId || undefined,
          source: formData.source || undefined
        })
      });

      if (response.ok) {
        toast.success('Ticket created successfully');
        setIsCreateOpen(false);
        resetForm();
        await loadTickets();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      organisationId: ticket.organisationId || '',
      contactId: ticket.contactId || '',
      dealId: ticket.dealId || '',
      source: ticket.source || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTicket || !formData.title.trim()) return;

    try {
      const response = await fetch(`/api/crm/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          type: formData.type,
          priority: formData.priority,
          status: formData.status,
          ...(formData.dueDate && { dueDate: formData.dueDate }),
          organisationId: formData.organisationId || undefined,
          contactId: formData.contactId || undefined,
          dealId: formData.dealId || undefined,
          source: formData.source || undefined
        })
      });

      if (response.ok) {
        toast.success('Ticket updated successfully');
        setIsEditOpen(false);
        setSelectedTicket(null);
        resetForm();
        await loadTickets();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTicket) return;

    try {
      const response = await fetch(`/api/crm/tickets/${selectedTicket.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Ticket deleted successfully');
        setIsDeleteOpen(false);
        setSelectedTicket(null);
        await loadTickets();
      } else {
        toast.error('Failed to delete ticket');
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: TicketType.SUPPORT,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      dueDate: '',
      organisationId: '',
      contactId: '',
      dealId: '',
      source: ''
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

  const isOverdue = (dueDate?: Date | string, status?: TicketStatus) => {
    if (!dueDate) return false;
    if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) return false;
    return new Date(dueDate) < new Date();
  };

  const getRelatedEntityName = (ticket: Ticket) => {
    if (ticket.organisationId) {
      const org = organisations.find(o => o.id === ticket.organisationId);
      return { type: 'Organisation', name: org?.name || 'Unknown', icon: Building2 };
    }
    if (ticket.contactId) {
      const contact = contacts.find(c => c.id === ticket.contactId);
      return { type: 'Contact', name: contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown', icon: User };
    }
    if (ticket.dealId) {
      const deal = deals.find(d => d.id === ticket.dealId);
      return { type: 'Deal', name: deal?.title || 'Unknown', icon: TrendingUp };
    }
    return null;
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      type: 'all'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.type !== 'all' || searchQuery;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Tickets"
        description="Manage support tickets, claims, and service requests"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Tickets' }]}
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
                  placeholder="Search tickets by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/80 border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Filters and New Ticket Button */}
              <div className="flex gap-3 items-center flex-wrap">
                {/* Type Filter */}
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger className="w-40 bg-background/80 border-border/60">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={TicketType.CLAIM}>Claim</SelectItem>
                    <SelectItem value={TicketType.SUPPORT}>Support</SelectItem>
                    <SelectItem value={TicketType.SERVICE}>Service</SelectItem>
                    <SelectItem value={TicketType.COMPLAINT}>Complaint</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="w-40 bg-background/80 border-border/60">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                    <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TicketStatus.WAITING}>Waiting</SelectItem>
                    <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                    <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters({ ...filters, priority: value })}
                >
                  <SelectTrigger className="w-40 bg-background/80 border-border/60">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>

                {/* New Ticket Button */}
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </div>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTickets.length} of {tickets.length} tickets
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 border-border/50">
                <TableHead className="font-semibold text-foreground">Ticket</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Related To</TableHead>
                <TableHead className="font-semibold text-foreground">Priority</TableHead>
                <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                        <TicketIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-muted-foreground">
                        {hasActiveFilters ? 'No tickets match your filters' : 'No tickets found'}
                      </div>
                      {hasActiveFilters ? (
                        <Button variant="outline" onClick={clearFilters} className="text-sm">
                          Clear filters
                        </Button>
                      ) : (
                        <Button onClick={() => setIsCreateOpen(true)} className="text-sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first ticket
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => {
                  const StatusIcon = StatusIcons[ticket.status];
                  const TypeIcon = TypeIcons[ticket.type];
                  const overdue = isOverdue(ticket.dueDate, ticket.status);
                  const relatedEntity = getRelatedEntityName(ticket);

                  return (
                    <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{ticket.title}</div>
                          {ticket.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {ticket.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${TypeColors[ticket.type]} text-xs font-medium px-2 py-1 flex items-center space-x-1 w-fit`}>
                          <TypeIcon className="h-3 w-3" />
                          <span>{ticket.type}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {relatedEntity ? (
                          <div className="flex items-center space-x-2">
                            <relatedEntity.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{relatedEntity.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${PriorityColors[ticket.priority]} text-xs font-medium px-2 py-1`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={overdue ? 'text-red-600 font-medium' : 'text-foreground'}>
                            {formatDate(ticket.dueDate)}
                            {overdue && <span className="text-red-500 text-xs ml-1">(overdue)</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${StatusColors[ticket.status]} text-xs font-medium px-2 py-1 flex items-center space-x-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{ticket.status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ticket)}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            title="Edit ticket"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(ticket)}
                            className="h-8 px-2 text-muted-foreground hover:text-red-600"
                            title="Delete ticket"
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

        {/* Create Ticket Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter ticket title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue or request"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as TicketType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketType.SUPPORT}>Support</SelectItem>
                      <SelectItem value={TicketType.CLAIM}>Claim</SelectItem>
                      <SelectItem value={TicketType.SERVICE}>Service</SelectItem>
                      <SelectItem value={TicketType.COMPLAINT}>Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as TicketStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                      <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={TicketStatus.WAITING}>Waiting</SelectItem>
                      <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                      <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
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
                  <Label htmlFor="organisationId">Organisation</Label>
                  <Select
                    value={formData.organisationId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, organisationId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {organisations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contactId">Contact</Label>
                  <Select
                    value={formData.contactId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, contactId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dealId">Deal</Label>
                  <Select
                    value={formData.dealId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, dealId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {deals.map(deal => (
                        <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Email, Phone, Portal"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.title.trim()}>
                  Create Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Ticket Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Title *</Label>
                <Input
                  id="editTitle"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter ticket title"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue or request"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editType">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as TicketType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketType.SUPPORT}>Support</SelectItem>
                      <SelectItem value={TicketType.CLAIM}>Claim</SelectItem>
                      <SelectItem value={TicketType.SERVICE}>Service</SelectItem>
                      <SelectItem value={TicketType.COMPLAINT}>Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editPriority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as TicketStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                      <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={TicketStatus.WAITING}>Waiting</SelectItem>
                      <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                      <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
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
                  <Label htmlFor="editOrganisationId">Organisation</Label>
                  <Select
                    value={formData.organisationId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, organisationId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {organisations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editContactId">Contact</Label>
                  <Select
                    value={formData.contactId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, contactId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDealId">Deal</Label>
                  <Select
                    value={formData.dealId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, dealId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {deals.map(deal => (
                        <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editSource">Source</Label>
                  <Input
                    id="editSource"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Email, Phone, Portal"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsEditOpen(false);
                  setSelectedTicket(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={!formData.title.trim()}>
                  Update Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete "{selectedTicket?.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedTicket(null);
                }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
