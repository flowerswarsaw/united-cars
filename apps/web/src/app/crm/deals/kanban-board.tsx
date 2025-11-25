"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Removed @dnd-kit imports - using native HTML5 drag and drop instead
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
import { Building2, User, DollarSign, Clock, Calendar, Plus, CheckCircle2, Circle, ChevronLeft, ChevronRight, Minimize2, Maximize2, Trash2, History, CheckSquare, Square, Trophy, X, AlertCircle, AlertTriangle, ChevronsLeft, ChevronsRight, Eye, EyeOff } from 'lucide-react';
import { LossReason, DealStatus, Organisation, Contact, Task, TaskStatus, TaskPriority, EntityType, Deal, Pipeline, Stage } from '@united-cars/crm-core';

// Extend Window interface for native drag and drop
declare global {
  interface Window {
    onDealMoved?: (dealId: string, stageId: string) => void;
    kanbanExpandAllStages?: () => void;
    kanbanCollapseAllStages?: () => void;
    kanbanToggleWonLostStages?: () => void;
  }
}

interface KanbanBoardProps {
  pipeline: Pipeline & { stages: Stage[] };
  deals: Deal[];
  organisations: Organisation[];
  contacts: Contact[];
  tasks?: Task[];
  onDealMoved: (dealId: string, toStageId: string, note?: string, lossReason?: LossReason) => void;
  onDealWon?: (dealId: string, note?: string) => void;
  onDealLost?: (dealId: string, lossReason: LossReason, note?: string) => void;
  onMoveStage?: (dealId: string, direction: 'left' | 'right') => void;
  onDealUpdated?: (deal: Deal) => void;
  onTaskCreated?: (task: Task) => void;
  onOrganisationClick?: (orgId: string) => void;
  onContactClick?: (contactId: string) => void;
  onQuickAddDeal?: (stageId: string) => void;
  isFiltered?: boolean;
  totalDeals?: number;
  allDealsByStage?: Record<string, Deal[]>;
  searchQuery?: string;
  // Bulk collapse functions
  onExpandAllStages?: () => void;
  onCollapseAllStages?: () => void;
  onToggleWonLostStages?: () => void;
}

interface DealCard {
  deal: Deal;
  organisations: Organisation[];
  contacts: Contact[];
  tasks?: Task[];
  onClick?: () => void;
  onOrganisationClick?: (orgId: string) => void;
  onContactClick?: (contactId: string) => void;
  onTaskClick?: (dealId: string) => void;
  onDeleteClick?: (dealId: string) => void;
  onHistoryClick?: (dealId: string) => void;
  onMarkWon?: (dealId: string) => void;
  onMarkLost?: (dealId: string) => void;
  canMarkWon?: boolean;
  canMarkLost?: boolean;
  searchQuery?: string;
  stages?: Stage[];
}

function DealCardComponent({ deal, organisations, contacts, tasks, onClick, onOrganisationClick, onContactClick, onTaskClick, onDeleteClick, onHistoryClick, onMarkWon, onMarkLost, canMarkWon, canMarkLost, searchQuery, stages }: DealCard) {

  // Native HTML5 drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({ dealId: deal.id, type: 'deal' }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
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

  // Calculate SLA breach status
  const getSlaStatus = () => {
    if (!deal.currentStages || deal.currentStages.length === 0 || !stages) return null;

    // Get the current stage from the first currentStage (assuming single pipeline)
    const currentStage = deal.currentStages[0];
    if (!currentStage) return null;

    const stage = stages.find(s => s.id === currentStage.stageId);
    if (!stage?.slaTarget) return null;

    // Calculate days since deal creation (simplified for now)
    const daysSinceCreation = Math.floor((new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const breachDays = daysSinceCreation - stage.slaTarget;

    if (breachDays <= 0) return null;

    return {
      breachDays,
      slaDays: stage.slaTarget,
      severity: breachDays > stage.slaTarget * 0.5 ? 'critical' : 'warning'
    };
  };

  const slaStatus = getSlaStatus();

  // Find associated organisation and contact
  const organisation = organisations.find(org => org.id === deal.organisationId);
  const contact = contacts.find(c => c.id === deal.contactId);

  // Find associated tasks
  const dealTasks = tasks?.filter(task => task.targetType === EntityType.DEAL && task.targetId === deal.id) || [];
  const taskCounts = {
    total: dealTasks.length,
    todo: dealTasks.filter(task => task.status === TaskStatus.TODO).length,
    inProgress: dealTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
    done: dealTasks.filter(task => task.status === TaskStatus.DONE).length,
  };

  // Function to highlight search terms
  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={(e) => {
        e.stopPropagation();
        // Navigate to deal detail page instead of opening dialog
        window.location.href = `/crm/deals/${deal.id}`;
      }}
      className={`group relative rounded-xl border transition-all duration-200 ease-out isolate w-full max-w-full overflow-hidden bg-gradient-to-br from-card to-card/95 shadow-md shadow-slate-200/40 dark:shadow-slate-900/40 border-slate-200/60 dark:border-slate-700/60 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300/70 z-10 hover:z-20 p-2.5 mb-2 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60' : ''
      }`}
      title="Drag to move between stages, double-click to view details"
    >
      
      <div className="space-y-2 relative">
        {/* Header with title, time, and SLA status */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate leading-tight">
              {highlightText(deal.title || '', searchQuery)}
            </h4>
            {/* SLA breach indicator */}
            {slaStatus && (
              <div className={`flex items-center text-xs mt-1 px-2 py-0.5 rounded-md font-medium ${
                slaStatus.severity === 'critical'
                  ? 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/40'
                  : 'text-orange-700 bg-orange-100 dark:text-orange-200 dark:bg-orange-900/40'
              }`}>
                {slaStatus.severity === 'critical' ? (
                  <AlertCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                <span>SLA breach: {slaStatus.breachDays}d over</span>
              </div>
            )}
          </div>
          {deal.createdAt && (
            <div className="flex items-center text-muted-foreground/80 text-xs bg-muted/30 px-1.5 py-0.5 rounded-full shrink-0">
              <Clock className="h-2.5 w-2.5 mr-1" />
              <span className="font-medium">{getTimeSinceCreation()}</span>
            </div>
          )}
        </div>
        
        {/* Amount and probability */}
        {deal.value && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50/50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              <span className="tracking-tight">{formatCurrency(deal.value)}</span>
            </div>
            {deal.probability && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                {deal.probability}%
              </div>
            )}
          </div>
        )}
        
        {/* Organisation and Contact links */}
        <div className="flex flex-col space-y-1.5">
          {/* Organisation - clickable */}
          {organisation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrganisationClick?.(organisation.id);
              }}
              className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 w-full text-left transition-all duration-200 px-2 py-1 rounded-md z-20 isolate hover:shadow-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-800/50"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
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
              className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 w-full text-left transition-all duration-200 px-2 py-1 rounded-md z-20 isolate hover:shadow-sm border border-transparent hover:border-purple-200/50 dark:hover:border-purple-800/50"
            >
              <User className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {highlightText(`${contact.firstName} ${contact.lastName}`, searchQuery)}
              </span>
            </button>
          )}
        </div>
        
        {/* Tasks Section */}
        {taskCounts.total > 0 && (
          <div className="mt-2 p-2 bg-slate-50/60 dark:bg-slate-800/40 rounded-md border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {taskCounts.total} Task{taskCounts.total !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {taskCounts.todo > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {taskCounts.todo}
                  </span>
                )}
                {taskCounts.inProgress > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                    {taskCounts.inProgress}
                  </span>
                )}
                {taskCounts.done > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300">
                    {taskCounts.done}
                  </span>
                )}
              </div>
            </div>
            
            {/* Show first 2 tasks */}
            {dealTasks.slice(0, 2).map(task => (
              <div key={task.id} className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate flex-1 mr-2">{task.title}</span>
                <div className="flex items-center space-x-1">
                  {task.status === TaskStatus.TODO && <Circle className="h-2.5 w-2.5 text-slate-500" />}
                  {task.status === TaskStatus.IN_PROGRESS && <Clock className="h-2.5 w-2.5 text-blue-500" />}
                  {task.status === TaskStatus.DONE && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />}
                </div>
              </div>
            ))}
            
            {dealTasks.length > 2 && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                +{dealTasks.length - 2} more
              </div>
            )}
          </div>
        )}
        
        {/* Actions: Won/Lost and controls */}
        <div className="flex items-center justify-end pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          {/* Won/Lost action buttons */}
          <div className="flex items-center text-muted-foreground/70 text-xs bg-muted/20 px-2 py-1 rounded-md">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span className="font-medium">{deal.createdAt && formatDate(deal.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHistoryClick?.(deal.id);
              }}
              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110 group-hover:text-muted-foreground/70 z-20 isolate rounded-lg hover:shadow-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-800/50"
              title="View history"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(deal.id);
              }}
              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-green-950/40 transition-all duration-200 hover:scale-110 group-hover:text-muted-foreground/70 hover:rotate-12 z-20 isolate rounded-lg hover:shadow-sm border border-transparent hover:border-green-200/50 dark:hover:border-green-800/50"
              title="Add task"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick?.(deal.id);
              }}
              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110 group-hover:text-muted-foreground/70 z-20 isolate rounded-lg hover:shadow-sm border border-transparent hover:border-red-200/50 dark:hover:border-red-800/50"
              title="Delete deal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
  tasks?: Task[];
  onDealClick?: (deal: Deal) => void;
  onOrganisationClick?: (orgId: string) => void;
  onContactClick?: (contactId: string) => void;
  onTaskClick?: (dealId: string) => void;
  onDeleteClick?: (dealId: string) => void;
  onHistoryClick?: (dealId: string) => void;
  onMarkWon?: (dealId: string) => void;
  onMarkLost?: (dealId: string) => void;
  stages: Stage[];
  onQuickAddDeal?: (stageId: string) => void;
  isFiltered?: boolean;
  totalDealsInStage?: number;
  searchQuery?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hideHeader?: boolean;
}

function StageColumn({ stage, deals, organisations, contacts, tasks, onDealClick, onOrganisationClick, onContactClick, onTaskClick, onDeleteClick, onHistoryClick, onMarkWon, onMarkLost, stages, onQuickAddDeal, isFiltered, totalDealsInStage, searchQuery, isCollapsed = false, onToggleCollapse, hideHeader = false }: StageColumn) {
  // Native HTML5 drop handling
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isOver to false if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'deal' && data.dealId) {
        // Check if moving to a terminal stage (prevent direct drag to won/lost)
        if (stage.isClosing || stage.isLost) {
          console.log('Terminal stages require using Won/Lost buttons, not drag-and-drop');
          return;
        }

        // Trigger the move via the parent callback
        if (window.onDealMoved) {
          window.onDealMoved(data.dealId, stage.id);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Won/Lost action availability
  const canMarkWon = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    return deal?.status === DealStatus.OPEN && !(stage.isClosing || stage.isLost);
  };

  const canMarkLost = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    return deal?.status === DealStatus.OPEN && !(stage.isClosing || stage.isLost);
  };

  // Collapsed view (simplified for new structure)
  if (isCollapsed) {
    return (
      <div
        className="w-full h-full min-h-[400px] transition-all duration-300 ease-out will-change-transform relative bg-gradient-to-b from-muted/30 via-muted/20 to-muted/40 hover:from-muted/50 hover:via-muted/30 hover:to-muted/60 rounded-2xl hover:shadow-md backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
      >
        {/* Default collapsed state display */}
        <div className="h-full flex items-center justify-center p-2">
          <div className="text-foreground/80 text-xs text-center transition-all duration-300 hover:text-foreground hover:font-medium font-medium" style={{ writingMode: 'vertical-rl' }}>
            {stage.name}
          </div>
        </div>
      </div>
    );
  }

  // Expanded view (content only, no header)
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full max-w-full overflow-hidden transition-all duration-300 ease-out will-change-transform flex-1 flex flex-col bg-gradient-to-br from-card/80 via-card/90 to-muted/20 border border-slate-200/50 dark:border-slate-700/50 hover:from-card/90 hover:via-card hover:to-muted/30 hover:border-slate-300/60 dark:hover:border-slate-600/60 shadow-sm hover:shadow-md rounded-2xl p-3 relative transition-shadow duration-300 ${
        isOver ? 'ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' : ''
      }`}
    >
      
      {/* Scrollable deals container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted/20 hover:scrollbar-thumb-border/80 scroll-smooth">
          <div className="space-y-1.5 pb-2">
            {deals.map((deal) => (
              <DealCardComponent
                key={deal.id}
                deal={deal}
                organisations={organisations}
                contacts={contacts}
                tasks={tasks}
                onClick={() => onDealClick?.(deal)}
                onOrganisationClick={onOrganisationClick}
                onContactClick={onContactClick}
                onTaskClick={onTaskClick}
                onDeleteClick={onDeleteClick}
                onHistoryClick={onHistoryClick}
                onMarkWon={onMarkWon}
                onMarkLost={onMarkLost}
                canMarkWon={canMarkWon(deal.id)}
                canMarkLost={canMarkLost(deal.id)}
                searchQuery={searchQuery}
                stages={stages}
              />
            ))}
            
            {/* Empty state when no deals */}
            {deals.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm text-center">
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
          </div>
      </div>
      
      {/* Fixed Add Deal button at bottom */}
      <div className="flex-shrink-0 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 w-full">
        <button
          onClick={() => onQuickAddDeal?.(stage.id)}
          className="group w-full p-2 border-2 border-dashed border-slate-300/60 dark:border-slate-600/60 rounded-lg text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-blue-50/80 dark:hover:from-indigo-950/80 dark:hover:to-blue-950/80 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 ease-out text-sm font-medium flex items-center justify-center gap-2 active:scale-95 z-20 isolate relative overflow-hidden"
          title="Add new deal to this stage"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out"></div>
          <Plus className="h-4 w-4 transition-all duration-200 group-hover:rotate-90 relative z-10" />
          <span className="transition-all duration-200 group-hover:font-semibold relative z-10">Add Deal</span>
        </button>
      </div>
    </div>
  );
}

export default function KanbanBoard({ pipeline, deals, organisations, contacts, tasks, onDealMoved, onDealWon, onDealLost, onDealUpdated, onTaskCreated, onOrganisationClick, onContactClick, onQuickAddDeal, isFiltered = false, totalDeals = 0, allDealsByStage, searchQuery, onExpandAllStages, onCollapseAllStages, onToggleWonLostStages }: KanbanBoardProps) {
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showWonDialog, setShowWonDialog] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<string | null>(null);
  const [dealForHistory, setDealForHistory] = useState<string | null>(null);
  const [dealToMarkWon, setDealToMarkWon] = useState<string | null>(null);
  const [dealToMarkLost, setDealToMarkLost] = useState<string | null>(null);
  const [wonNote, setWonNote] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedDealForTask, setSelectedDealForTask] = useState<string | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(() => {
    // Initialize with saved collapsed stages from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('deals-collapsed-stages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return new Set(parsed);
          }
        }
      } catch (error) {
        console.error('Error reading collapsed stages from localStorage:', error);
      }
    }
    return new Set();
  });
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
    status: TaskStatus.TODO,
    targetType: EntityType.DEAL,
    targetId: '',
    assignedTo: ''
  });

  // Set up global callback for native drag and drop
  useEffect(() => {
    window.onDealMoved = onDealMoved;
    return () => {
      delete window.onDealMoved;
    };
  }, [onDealMoved]);

  // Save collapsed stages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stageArray = Array.from(collapsedStages);
        localStorage.setItem('deals-collapsed-stages', JSON.stringify(stageArray));
      } catch (error) {
        console.error('Error saving collapsed stages to localStorage:', error);
      }
    }
  }, [collapsedStages]);


  const stages = pipeline.stages || [];
  
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => {
      // Check if deal has currentStages for this pipeline and stage
      return deal.currentStages?.some(currentStage =>
        currentStage.pipelineId === pipeline.id && currentStage.stageId === stage.id
      );
    });
    return acc;
  }, {} as Record<string, Deal[]>);

  // Get total deals by stage for filter display
  const totalDealsByStage = isFiltered && allDealsByStage ? 
    Object.keys(allDealsByStage).reduce((acc, stageId) => {
      acc[stageId] = allDealsByStage[stageId].length;
      return acc;
    }, {} as Record<string, number>) : {};

  // Native drag and drop doesn't need these handlers

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

  // Won/Lost handlers
  const handleMarkWon = (dealId: string) => {
    setDealToMarkWon(dealId);
    setShowWonDialog(true);
  };

  const handleMarkLost = (dealId: string) => {
    setDealToMarkLost(dealId);
    setShowLossDialog(true);
  };

  const handleWonConfirm = () => {
    if (dealToMarkWon) {
      onDealWon?.(dealToMarkWon, wonNote || undefined);
      setShowWonDialog(false);
      setDealToMarkWon(null);
      setWonNote('');
    }
  };

  const handleLostConfirm = () => {
    if (dealToMarkLost && lossReason) {
      onDealLost?.(dealToMarkLost, lossReason as LossReason, moveNote || undefined);
      setShowLossDialog(false);
      setDealToMarkLost(null);
      setLossReason('');
      setMoveNote('');
    } else if (pendingMove && lossReason) {
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
      amount: deal.value?.toString() || '',
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
          value: dealFormData.amount ? parseFloat(dealFormData.amount) : undefined,
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
          ...(taskFormData.dueDate && { dueDate: taskFormData.dueDate }),
          targetType: EntityType.DEAL,
          targetId: selectedDealForTask,
          status: TaskStatus.TODO
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        onTaskCreated?.(newTask);
        setShowTaskDialog(false);
        setSelectedDealForTask(null);
        setTaskFormData({
          title: '',
          description: '',
          priority: TaskPriority.MEDIUM,
          dueDate: '',
          status: TaskStatus.TODO,
          targetType: EntityType.DEAL,
          targetId: '',
          assignedTo: ''
        });
        // You might want to show a toast here
      } else {
        const error = await response.json();
        console.error('Failed to create task - Status:', response.status, 'Error:', error);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const collapseAllStages = () => {
    const allStageIds = stages.map(stage => stage.id);
    setCollapsedStages(new Set(allStageIds));
  };

  const expandAllStages = () => {
    setCollapsedStages(new Set());
  };

  const toggleWonLostStages = () => {
    const wonLostStageIds = stages
      .filter(stage => stage.isClosing || stage.isLost)
      .map(stage => stage.id);

    setCollapsedStages(prev => {
      const newSet = new Set(prev);
      const allWonLostCollapsed = wonLostStageIds.every(id => newSet.has(id));

      if (allWonLostCollapsed) {
        // Expand all won/lost stages
        wonLostStageIds.forEach(id => newSet.delete(id));
      } else {
        // Collapse all won/lost stages
        wonLostStageIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Connect functions to window for external access
  useEffect(() => {
    window.kanbanExpandAllStages = expandAllStages;
    window.kanbanCollapseAllStages = collapseAllStages;
    window.kanbanToggleWonLostStages = toggleWonLostStages;

    return () => {
      delete window.kanbanExpandAllStages;
      delete window.kanbanCollapseAllStages;
      delete window.kanbanToggleWonLostStages;
    };
  }, [stages, collapsedStages]);

  const handleDeleteClick = (dealId: string) => {
    setDealToDelete(dealId);
    setShowDeleteDialog(true);
  };

  const handleHistoryClick = (dealId: string) => {
    setDealForHistory(dealId);
    setShowHistoryDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete) return;

    try {
      const response = await fetch(`/api/crm/deals/${dealToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // The parent component should handle refreshing the deals list
        // For now, we'll just close the dialog and let the parent component refresh
        setShowDeleteDialog(false);
        setDealToDelete(null);
        // Optionally, you could emit an event or call a callback here
        // to refresh the deals list in the parent component
        window.location.reload(); // Simple refresh for now
      } else {
        console.error('Failed to delete deal');
        // You might want to show a toast error here
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      // You might want to show a toast error here
    }
  };

  return (
      <div className="flex-1 flex flex-col min-h-0 h-full p-2 sm:p-4 bg-gradient-to-br from-slate-50/80 via-slate-50/60 to-indigo-50/40 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-indigo-950/40 isolate backdrop-blur-sm">
        {/* Horizontally Scrollable Kanban Container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0 h-full scroll-smooth scrollbar-thin scrollbar-thumb-slate-300/60 dark:scrollbar-thumb-slate-700/60 scrollbar-track-transparent hover:scrollbar-thumb-slate-400/80 dark:hover:scrollbar-thumb-slate-600/80 isolate">
          <div className="flex gap-3 sm:gap-4 h-full min-w-max pb-4 px-2">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex-none flex flex-col h-full transition-all duration-500 ease-out will-change-transform animate-in fade-in-0 slide-in-from-bottom-4 ${
                collapsedStages.has(stage.id)
                  ? 'w-16'
                  : 'w-64 sm:w-68 md:w-72 lg:w-76'
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Stage Header */}
              <div className="mb-2">
                <div className={`bg-gradient-to-r from-card/90 via-card to-card/90 backdrop-blur-md rounded-lg shadow-md shadow-slate-200/40 dark:shadow-slate-900/40 border border-slate-200/70 dark:border-slate-700/70 z-30 isolate hover:shadow-lg transition-all duration-300 ${
                  collapsedStages.has(stage.id)
                    ? 'p-2 w-full h-16 flex flex-col items-center justify-center relative'
                    : 'p-3 flex items-center justify-between min-h-[2.5rem] w-full'
                }`}>
                  {!collapsedStages.has(stage.id) ? (
                    <>
                      <div className="flex items-center min-w-0 flex-1 gap-3">
                        <div 
                          className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-900/50"
                          style={{ backgroundColor: stage.color || '#6B7280' }}
                        />
                        <h3 className="font-semibold text-foreground text-sm truncate">{stage.name}</h3>
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-md shadow-sm border border-slate-200/50 dark:border-slate-600/50 flex-shrink-0">
                          {isFiltered && allDealsByStage && allDealsByStage[stage.id] ? (
                            <span>
                              {(dealsByStage[stage.id] || []).length} / {allDealsByStage[stage.id].length}
                            </span>
                          ) : (
                            (dealsByStage[stage.id] || []).length
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStageCollapse(stage.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:scale-110 active:scale-95 transition-all duration-200 ease-out flex-shrink-0 hover:shadow-md border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 z-40 isolate backdrop-blur-sm"
                        title="Collapse stage"
                      >
                        <ChevronLeft className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-200" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center text-center relative">
                      <button
                        onClick={() => toggleStageCollapse(stage.id)}
                        className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:scale-110 active:scale-95 transition-all duration-200 ease-out z-40 isolate hover:shadow-md border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 backdrop-blur-sm"
                        title="Expand stage"
                      >
                        <ChevronRight className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors duration-200" />
                      </button>
                      <div className="flex flex-col items-center justify-center h-full pt-1">
                        <div
                          className="w-4 h-4 rounded-full mb-2"
                          style={{ backgroundColor: stage.color || '#6B7280' }}
                        />
                        <Badge variant="outline" className="text-xs px-1.5 py-1 min-w-0 font-medium">
                          {(dealsByStage[stage.id] || []).length}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Column Content */}
              <div className="flex-1 min-h-0 flex flex-col">
                <StageColumn
                  stage={stage}
                  deals={dealsByStage[stage.id] || []}
                  organisations={organisations}
                  contacts={contacts}
                  tasks={tasks}
                  onDealClick={handleDealClick}
                  onOrganisationClick={onOrganisationClick}
                  onContactClick={onContactClick}
                  onTaskClick={handleTaskClick}
                  onDeleteClick={handleDeleteClick}
                  onHistoryClick={handleHistoryClick}
                  onMarkWon={handleMarkWon}
                  onMarkLost={handleMarkLost}
                  stages={stages}
                  onQuickAddDeal={onQuickAddDeal}
                  isFiltered={isFiltered}
                  totalDealsInStage={totalDealsByStage[stage.id] || 0}
                  searchQuery={searchQuery}
                  isCollapsed={collapsedStages.has(stage.id)}
                  onToggleCollapse={() => toggleStageCollapse(stage.id)}
                  hideHeader={true}
                />
              </div>
            </div>
          ))}
          </div>
        </div>


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
              <Button variant="outline" onClick={() => {
                setShowLossDialog(false);
                if (dealToMarkLost) {
                  setDealToMarkLost(null);
                }
                if (pendingMove) {
                  setPendingMove(null);
                }
                setLossReason('');
                setMoveNote('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleLostConfirm} disabled={!lossReason}>
                Mark as Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWonDialog} onOpenChange={setShowWonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Won</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wonNote">Celebration Note (Optional)</Label>
              <Textarea
                id="wonNote"
                value={wonNote}
                onChange={(e) => setWonNote(e.target.value)}
                placeholder="Add a note about this successful deal..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowWonDialog(false);
                setDealToMarkWon(null);
                setWonNote('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleWonConfirm} className="bg-green-600 hover:bg-green-700">
                <Trophy className="h-4 w-4 mr-2" />
                Mark as Won
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
              <div>
                <Label htmlFor="organisationId">Organisation</Label>
                <Select 
                  value={dealFormData.organisationId || "none"} 
                  onValueChange={(value) => setDealFormData({ 
                    ...dealFormData, 
                    organisationId: value === "none" ? '' : value,
                    contactId: '' // Clear contact when org changes
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organisation (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Organisation</SelectItem>
                    {organisations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contactId">Contact</Label>
                <Select 
                  value={dealFormData.contactId || "none"} 
                  onValueChange={(value) => setDealFormData({ 
                    ...dealFormData, 
                    contactId: value === "none" ? '' : value,
                    // Don't clear org when selecting contact from same org
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      dealFormData.organisationId && dealFormData.organisationId !== "none" 
                        ? "Select contact from organisation" 
                        : "Select any contact (optional)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Contact</SelectItem>
                    {dealFormData.organisationId && dealFormData.organisationId !== "none" ? (
                      // Show only contacts from selected organisation
                      contacts
                        .filter(contact => contact.organisationId === dealFormData.organisationId)
                        .map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))
                    ) : (
                      // Show all contacts when no organisation is selected
                      contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                          {contact.organisationId && (
                            <span className="text-muted-foreground text-xs ml-2">
                              ({organisations.find(org => org.id === contact.organisationId)?.name})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
            
            {/* Related Tasks Section */}
            {selectedDeal && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Related Tasks</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setTaskFormData({
                        title: '',
                        description: '',
                        priority: TaskPriority.MEDIUM,
                        status: TaskStatus.TODO,
                        dueDate: '',
                        targetType: EntityType.DEAL,
                        targetId: selectedDeal.id,
                        assignedTo: ''
                      });
                      setShowTaskDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                {(() => {
                  const dealTasks = tasks?.filter(task => 
                    task.targetType === EntityType.DEAL && task.targetId === selectedDeal.id
                  ) || [];
                  
                  if (dealTasks.length === 0) {
                    return (
                      <div className="text-center py-6 text-muted-foreground">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks assigned to this deal</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {dealTasks.map(task => (
                        <div 
                          key={task.id}
                          className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center mt-0.5">
                            {task.status === TaskStatus.DONE ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : task.status === TaskStatus.IN_PROGRESS ? (
                              <Clock className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm truncate ${task.status === TaskStatus.DONE ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Priority Badge */}
                                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  task.priority === TaskPriority.URGENT ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  task.priority === TaskPriority.MEDIUM ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {task.priority}
                                </div>
                                
                                {/* Status Badge */}
                                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  task.status === TaskStatus.DONE ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                                  task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                }`}>
                                  {task.status.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                            
                            {task.dueDate && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Deal History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deal history and audit trail will be implemented in the next phase.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowHistoryDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
  );
}