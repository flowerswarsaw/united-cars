"use client";

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, User, DollarSign, Clock, Calendar, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Deal, Pipeline, Stage, LossReason, DealStatus, Organisation, Contact, Task, TaskStatus, TaskPriority, EntityType } from '@united-cars/crm-core';

interface KanbanBoardProps {
  pipeline: Pipeline;
  deals: Deal[];
  organisations: Organisation[];
  contacts: Contact[];
  onDealMoved: (dealId: string, toStageId: string, note?: string, lossReason?: LossReason) => void;
  onDealUpdated?: (deal: Deal) => void;
  onOrganisationClick?: (orgId: string) => void;
  onContactClick?: (contactId: string) => void;
  isFiltered?: boolean;
  totalDeals?: number;
  allDealsByStage?: Record<string, Deal[]>;
  searchQuery?: string;
}

interface DealCard {
  deal: Deal;
  organisations: Organisation[];
  contacts: Contact[];
  onClick?: () => void;
  onOrganisationClick?: (orgId: string) => void;
  onContactClick?: (contactId: string) => void;
  onTaskClick?: (dealId: string) => void;
  searchQuery?: string;
}

function DealCardComponent({ deal, organisations, contacts, onClick, onOrganisationClick, onContactClick, onTaskClick, searchQuery }: DealCard) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceCreation = () => {
    if (!deal.createdAt) return '';
    const now = new Date();
    const created = new Date(deal.createdAt);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Find associated organisation and contact
  const organisation = organisations.find(org => org.id === deal.organisationId);
  const contact = contacts.find(c => c.id === deal.contactId);

  // Function to highlight search terms
  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`rounded-lg border p-3 mb-2 transition-all duration-200 ${
        isDragging 
          ? 'bg-white shadow-2xl cursor-grabbing border-blue-300 scale-105 z-50'
          : 'bg-white hover:bg-gray-50 cursor-grab hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5'
      }`}
      title="Double-click to view details, drag to move between stages"
    >
      <div className="space-y-2">
        {/* Header with title and time */}
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">
            {highlightText(deal.title || '', searchQuery)}
          </h4>
          {deal.createdAt && (
            <div className="flex items-center text-gray-400 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeSinceCreation()}
            </div>
          )}
        </div>
        
        {/* Amount and probability */}
        {deal.amount && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-green-600 text-sm font-medium">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(deal.amount)}
            </div>
            {deal.probability && (
              <Badge variant="secondary" className="text-xs">
                {deal.probability}%
              </Badge>
            )}
          </div>
        )}
        
        {/* Organisation - clickable */}
        {organisation && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOrganisationClick?.(organisation.id);
            }}
            className="flex items-center text-blue-600 text-xs hover:text-blue-800 hover:underline w-full text-left"
          >
            <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{highlightText(organisation.name || '', searchQuery)}</span>
          </button>
        )}
        
        {/* Contact - clickable */}
        {contact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContactClick?.(contact.id);
            }}
            className="flex items-center text-blue-600 text-xs hover:text-blue-800 hover:underline w-full text-left"
          >
            <User className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {highlightText(`${contact.firstName} ${contact.lastName}`, searchQuery)}
            </span>
          </button>
        )}
        
        {/* Bottom actions and info */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex items-center text-gray-400 text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {deal.createdAt && formatDate(deal.createdAt)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick?.(deal.id);
            }}
            className="flex items-center text-gray-400 hover:text-blue-600 text-xs"
            title="Add task"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface StageColumn {
  stage: Stage;
  deals: Deal[];
  organisations: Organisation[];
  contacts: Contact[];
  onDealClick?: (deal: Deal) => void;
  onOrganisationClick?: (orgId: string) => void;
  onContactClick?: (contactId: string) => void;
  onTaskClick?: (dealId: string) => void;
  isFiltered?: boolean;
  totalDealsInStage?: number;
  searchQuery?: string;
}

function StageColumn({ stage, deals, organisations, contacts, onDealClick, onOrganisationClick, onContactClick, onTaskClick, isFiltered, totalDealsInStage, searchQuery }: StageColumn) {
  const {
    setNodeRef,
    isOver,
    active
  } = useDroppable({ id: stage.id });

  const isHighlighted = isOver && active;
  const canDrop = active && active.id !== stage.id; // Can't drop on same column

  return (
    <div className={`rounded-lg p-4 min-h-[600px] flex-1 min-w-[280px] max-w-[320px] transition-all duration-200 ${
      isHighlighted && canDrop
        ? 'bg-blue-50 border-2 border-blue-300 border-dashed shadow-lg'
        : isHighlighted
        ? 'bg-yellow-50 border-2 border-yellow-300 border-dashed'
        : 'bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: stage.color || '#6B7280' }}
          />
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <Badge variant="outline" className="ml-2 text-xs">
            {isFiltered && totalDealsInStage !== undefined ? (
              <span>
                {deals.length} of {totalDealsInStage}
              </span>
            ) : (
              deals.length
            )}
          </Badge>
        </div>
      </div>
      
      <div ref={setNodeRef} className="min-h-[400px] relative">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCardComponent 
              key={deal.id} 
              deal={deal} 
              organisations={organisations}
              contacts={contacts}
              onClick={() => onDealClick?.(deal)}
              onOrganisationClick={onOrganisationClick}
              onContactClick={onContactClick}
              onTaskClick={onTaskClick}
              searchQuery={searchQuery}
            />
          ))}
          
          {/* Drop zone indicator */}
          {isHighlighted && canDrop && (
            <div className="flex items-center justify-center h-16 border-2 border-blue-300 border-dashed rounded-lg bg-blue-50 mb-2">
              <div className="text-blue-600 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Drop deal here
              </div>
            </div>
          )}
          
          {/* Empty state when no deals */}
          {deals.length === 0 && !isHighlighted && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm text-center">
              {isFiltered && totalDealsInStage && totalDealsInStage > 0 ? (
                <div>
                  <div className="mb-1">No matching deals</div>
                  <div className="text-xs">{totalDealsInStage} deal{totalDealsInStage !== 1 ? 's' : ''} hidden by filters</div>
                </div>
              ) : (
                'No deals in this stage'
              )}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoard({ pipeline, deals, organisations, contacts, onDealMoved, onDealUpdated, onOrganisationClick, onContactClick, isFiltered = false, totalDeals = 0, allDealsByStage, searchQuery }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedDealForTask, setSelectedDealForTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingMove, setPendingMove] = useState<{
    dealId: string;
    toStageId: string;
  } | null>(null);
  const [lossReason, setLossReason] = useState<LossReason | ''>('');
  const [moveNote, setMoveNote] = useState('');
  const [dealFormData, setDealFormData] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    probability: '',
    notes: '',
    organisationId: '',
    contactId: ''
  });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for more responsive dragging
      },
    })
  );

  const stages = pipeline.stages || [];
  
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => {
      const currentStage = deal.currentStages?.find(cs => cs.pipelineId === pipeline.id);
      return currentStage?.stageId === stage.id;
    });
    return acc;
  }, {} as Record<string, Deal[]>);

  // Get total deals by stage for filter display
  const totalDealsByStage = isFiltered && allDealsByStage ? 
    Object.keys(allDealsByStage).reduce((acc, stageId) => {
      acc[stageId] = allDealsByStage[stageId].length;
      return acc;
    }, {} as Record<string, number>) : {};

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as string;
    const toStageId = over.id as string;

    // Find the target stage
    const toStage = stages.find(s => s.id === toStageId);
    if (!toStage) return;

    // Check if moving to a lost stage
    if (toStage.isLost) {
      setPendingMove({ dealId, toStageId });
      setShowLossDialog(true);
      return;
    }

    // Move the deal
    onDealMoved(dealId, toStageId, moveNote || undefined);
    setMoveNote('');
  }

  const handleLossConfirm = () => {
    if (pendingMove && lossReason) {
      onDealMoved(
        pendingMove.dealId,
        pendingMove.toStageId,
        moveNote || undefined,
        lossReason as LossReason
      );
      setShowLossDialog(false);
      setPendingMove(null);
      setLossReason('');
      setMoveNote('');
    }
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setDealFormData({
      title: deal.title || '',
      amount: deal.amount?.toString() || '',
      currency: deal.currency || 'USD',
      probability: deal.probability?.toString() || '',
      notes: deal.notes || '',
      organisationId: deal.organisationId || '',
      contactId: deal.contactId || ''
    });
    setShowDealDialog(true);
  };

  const handleDealUpdate = async () => {
    if (!selectedDeal) return;

    try {
      const response = await fetch(`/api/crm/deals/${selectedDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dealFormData.title,
          amount: dealFormData.amount ? parseFloat(dealFormData.amount) : undefined,
          currency: dealFormData.currency,
          probability: dealFormData.probability ? parseFloat(dealFormData.probability) : undefined,
          notes: dealFormData.notes,
          organisationId: dealFormData.organisationId || undefined,
          contactId: dealFormData.contactId || undefined
        })
      });

      if (response.ok) {
        const updatedDeal = await response.json();
        onDealUpdated?.(updatedDeal);
        setShowDealDialog(false);
        setSelectedDeal(null);
      }
    } catch (error) {
      console.error('Failed to update deal:', error);
    }
  };

  const handleTaskClick = (dealId: string) => {
    setSelectedDealForTask(dealId);
    setShowTaskDialog(true);
  };

  const handleTaskCreate = async () => {
    if (!taskFormData.title || !selectedDealForTask) return;

    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskFormData.title,
          description: taskFormData.description || undefined,
          priority: taskFormData.priority,
          dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
          targetType: EntityType.DEAL,
          targetId: selectedDealForTask,
          status: TaskStatus.TODO
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
        setShowTaskDialog(false);
        setSelectedDealForTask(null);
        setTaskFormData({
          title: '',
          description: '',
          priority: TaskPriority.MEDIUM,
          dueDate: '',
        });
        // You might want to show a toast here
      } else {
        const error = await response.json();
        console.error('Failed to create task:', error);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 flex-1">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] || []}
              organisations={organisations}
              contacts={contacts}
              onDealClick={handleDealClick}
              onOrganisationClick={onOrganisationClick}
              onContactClick={onContactClick}
              onTaskClick={handleTaskClick}
              isFiltered={isFiltered}
              totalDealsInStage={totalDealsByStage[stage.id] || 0}
              searchQuery={searchQuery}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="bg-white rounded-lg border-2 border-blue-400 p-3 shadow-2xl transform rotate-2 scale-110">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900 truncate">{activeDeal.title}</h4>
                
                {activeDeal.amount && (
                  <div className="flex items-center text-green-600 text-sm">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: activeDeal.currency || 'USD',
                      minimumFractionDigits: 0
                    }).format(activeDeal.amount)}
                  </div>
                )}
                
                {activeDeal.organisationId && (
                  <div className="flex items-center text-gray-500 text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    Organisation
                  </div>
                )}
                
                {activeDeal.contactId && (
                  <div className="flex items-center text-gray-500 text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Contact
                  </div>
                )}
                
                {activeDeal.probability && (
                  <Badge variant="secondary" className="text-xs">
                    {activeDeal.probability}%
                  </Badge>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lossReason">Loss Reason *</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LossReason.STOPPED_WORKING}>Stopped Working</SelectItem>
                  <SelectItem value={LossReason.COULD_NOT_REACH_DM}>Could Not Reach Decision Maker</SelectItem>
                  <SelectItem value={LossReason.REJECTION}>Rejection</SelectItem>
                  <SelectItem value={LossReason.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={moveNote}
                onChange={(e) => setMoveNote(e.target.value)}
                placeholder="Add a note about why this deal was lost..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLossDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleLossConfirm} disabled={!lossReason}>
                Mark as Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Deal Title *</Label>
                <Input
                  id="title"
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })}
                  placeholder="Deal title"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={dealFormData.amount}
                  onChange={(e) => setDealFormData({ ...dealFormData, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={dealFormData.currency} onValueChange={(value) => setDealFormData({ ...dealFormData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={dealFormData.probability}
                  onChange={(e) => setDealFormData({ ...dealFormData, probability: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={dealFormData.notes}
                onChange={(e) => setDealFormData({ ...dealFormData, notes: e.target.value })}
                placeholder="Deal notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDealDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDealUpdate} disabled={!dealFormData.title}>
                Update Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taskTitle">Task Title *</Label>
              <Input
                id="taskTitle"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={taskFormData.priority} 
                  onValueChange={(value) => setTaskFormData({ ...taskFormData, priority: value as TaskPriority })}
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
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleTaskCreate} disabled={!taskFormData.title}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}