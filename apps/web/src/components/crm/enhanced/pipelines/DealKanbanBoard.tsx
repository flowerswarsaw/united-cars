'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MoreVertical, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { EnhancedDeal } from '@united-cars/crm-mocks/src/repositories';
import { DealStatus } from '@united-cars/crm-core';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { RoleGuard, useRolePermissions } from '../rbac/RoleGuard';

const ITEM_TYPE = 'deal';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  deals: EnhancedDeal[];
  maxDeals?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface DealKanbanBoardProps {
  pipeline: Pipeline;
  userRole: UserRole;
  currentUserId: string;
  onDealMove: (dealId: string, fromStageId: string, toStageId: string) => Promise<boolean>;
  onDealClick: (deal: EnhancedDeal) => void;
  onDealEdit?: (deal: EnhancedDeal) => void;
  onDealDelete?: (dealId: string) => void;
  onAddDeal?: (stageId: string) => void;
  showFilters?: boolean;
  className?: string;
}

interface DealFilters {
  assignedUserId?: string;
  minValue?: number;
  maxValue?: number;
  overdue?: boolean;
}

export function DealKanbanBoard({
  pipeline,
  userRole,
  currentUserId,
  onDealMove,
  onDealClick,
  onDealEdit,
  onDealDelete,
  onAddDeal,
  showFilters = true,
  className
}: DealKanbanBoardProps) {
  const [filters, setFilters] = useState<DealFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissions = useRolePermissions(userRole);

  // Filter deals based on current filters and permissions
  const getFilteredDeals = useCallback((deals: EnhancedDeal[]) => {
    let filtered = [...deals];

    // Apply role-based filtering
    if (!permissions.canRead('deals', true)) {
      // Junior managers can only see assigned deals
      filtered = filtered.filter(deal => 
        deal.assignedUserId === currentUserId || deal.createdBy === currentUserId
      );
    }

    // Apply user-defined filters
    if (filters.assignedUserId) {
      filtered = filtered.filter(deal => deal.assignedUserId === filters.assignedUserId);
    }

    if (filters.minValue !== undefined) {
      filtered = filtered.filter(deal => deal.value >= filters.minValue!);
    }

    if (filters.maxValue !== undefined) {
      filtered = filtered.filter(deal => deal.value <= filters.maxValue!);
    }

    if (filters.overdue) {
      const now = new Date();
      filtered = filtered.filter(deal => 
        deal.expectedCloseDate && 
        deal.expectedCloseDate < now && 
        deal.status !== DealStatus.WON && 
        deal.status !== DealStatus.LOST
      );
    }

    return filtered;
  }, [filters, permissions, currentUserId]);

  // Calculate stage statistics
  const getStageStats = (stage: PipelineStage) => {
    const filteredDeals = getFilteredDeals(stage.deals);
    const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
    const avgValue = filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0;
    const overdueCount = filteredDeals.filter(deal => {
      const now = new Date();
      return deal.expectedCloseDate && 
             deal.expectedCloseDate < now && 
             deal.status !== DealStatus.WON && 
             deal.status !== DealStatus.LOST;
    }).length;

    return {
      count: filteredDeals.length,
      totalValue,
      avgValue,
      overdueCount
    };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`space-y-4 ${className}`}>
        {/* Pipeline header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{pipeline.name}</h2>
            <p className="text-muted-foreground">
              {pipeline.stages.reduce((sum, stage) => sum + getStageStats(stage).count, 0)} active deals
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            )}
            
            <RoleGuard userRole={userRole} requiredPermission="create" entityType="deals">
              <Button onClick={() => onAddDeal?.(pipeline.stages[0]?.id)}>
                <Plus className="h-4 w-4 mr-1" />
                New Deal
              </Button>
            </RoleGuard>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Kanban board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages.map(stage => (
            <KanbanStage
              key={stage.id}
              stage={stage}
              deals={getFilteredDeals(stage.deals)}
              stats={getStageStats(stage)}
              userRole={userRole}
              currentUserId={currentUserId}
              onDealMove={onDealMove}
              onDealClick={onDealClick}
              onDealEdit={onDealEdit}
              onDealDelete={onDealDelete}
              onAddDeal={onAddDeal}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}

interface KanbanStageProps {
  stage: PipelineStage;
  deals: EnhancedDeal[];
  stats: ReturnType<typeof DealKanbanBoard.prototype.getStageStats>;
  userRole: UserRole;
  currentUserId: string;
  onDealMove: (dealId: string, fromStageId: string, toStageId: string) => Promise<boolean>;
  onDealClick: (deal: EnhancedDeal) => void;
  onDealEdit?: (deal: EnhancedDeal) => void;
  onDealDelete?: (dealId: string) => void;
  onAddDeal?: (stageId: string) => void;
  isLoading: boolean;
}

function KanbanStage({
  stage,
  deals,
  stats,
  userRole,
  currentUserId,
  onDealMove,
  onDealClick,
  onDealEdit,
  onDealDelete,
  onAddDeal,
  isLoading
}: KanbanStageProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { dealId: string; fromStageId: string }) => {
      if (item.fromStageId !== stage.id) {
        onDealMove(item.dealId, item.fromStageId, stage.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`
        flex-shrink-0 w-80 bg-gray-50 rounded-lg border-2 transition-colors
        ${isOver ? 'border-primary bg-primary/5' : 'border-gray-200'}
        ${isLoading ? 'opacity-50' : ''}
      `}
    >
      {/* Stage header */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold">{stage.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {stats.count}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">
              {stage.probability}%
            </span>
            <RoleGuard userRole={userRole} requiredPermission="create" entityType="deals">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onAddDeal?.(stage.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Stage statistics */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Total Value:</span>
            <span className="font-medium">${stats.totalValue.toLocaleString()}</span>
          </div>
          {stats.count > 0 && (
            <div className="flex justify-between">
              <span>Avg Value:</span>
              <span className="font-medium">${Math.round(stats.avgValue).toLocaleString()}</span>
            </div>
          )}
          {stats.overdueCount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Overdue:</span>
              <span className="font-medium">{stats.overdueCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Deals list */}
      <div className="p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            stageId={stage.id}
            userRole={userRole}
            currentUserId={currentUserId}
            onClick={onDealClick}
            onEdit={onDealEdit}
            onDelete={onDealDelete}
          />
        ))}
        
        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Target className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No deals in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface DealCardProps {
  deal: EnhancedDeal;
  stageId: string;
  userRole: UserRole;
  currentUserId: string;
  onClick: (deal: EnhancedDeal) => void;
  onEdit?: (deal: EnhancedDeal) => void;
  onDelete?: (dealId: string) => void;
}

function DealCard({
  deal,
  stageId,
  userRole,
  currentUserId,
  onClick,
  onEdit,
  onDelete
}: DealCardProps) {
  const permissions = useRolePermissions(userRole);
  const isAssigned = deal.assignedUserId === currentUserId;
  const canEdit = permissions.canUpdate('deals', isAssigned);
  const canDelete = permissions.canDelete('deals', isAssigned);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { dealId: deal.id, fromStageId: stageId },
    canDrag: canEdit, // Only allow dragging if user can edit
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const isOverdue = deal.expectedCloseDate && 
                   deal.expectedCloseDate < new Date() && 
                   deal.status !== DealStatus.WON && 
                   deal.status !== DealStatus.LOST;

  const getDealStatusColor = () => {
    if (isOverdue) return 'border-red-200 bg-red-50';
    if (deal.probability && deal.probability >= 75) return 'border-green-200 bg-green-50';
    if (deal.probability && deal.probability >= 50) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  return (
    <Card
      ref={drag}
      className={`
        cursor-pointer transition-all hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${getDealStatusColor()}
        ${!canEdit ? 'cursor-default' : ''}
      `}
      onClick={() => onClick(deal)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Deal header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{deal.title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              ID: {deal.id.slice(-8)}
            </p>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {isOverdue && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Overdue</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <RoleGuard userRole={userRole} requiredPermission="update" entityType="deals" entityAssignedUserId={deal.assignedUserId} mode="hide">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Show dropdown menu
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Deal value */}
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-green-600" />
          <span className="text-sm font-semibold text-green-700">
            ${deal.value.toLocaleString()}
          </span>
          {deal.probability && (
            <span className="text-xs text-muted-foreground ml-1">
              ({deal.probability}%)
            </span>
          )}
        </div>

        {/* Progress bar */}
        {deal.probability && (
          <Progress 
            value={deal.probability} 
            className="h-1" 
            // color based on probability
          />
        )}

        {/* Deal metadata */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={isOverdue ? 'text-red-600' : ''}>
                {format(new Date(deal.expectedCloseDate), 'MMM dd')}
              </span>
            </div>
          )}
          
          {deal.assignedUserId && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate">
                {deal.assignedUserId === currentUserId ? 'Me' : deal.assignedUserId}
              </span>
            </div>
          )}
        </div>

        {/* Deal source */}
        {deal.dealSource && (
          <Badge variant="outline" className="text-xs">
            {deal.dealSource}
          </Badge>
        )}

        {/* Next action */}
        {deal.nextAction && (
          <div className="text-xs bg-blue-50 rounded p-1 border">
            <span className="font-medium">Next: </span>
            <span className="truncate">{deal.nextAction}</span>
            {deal.nextActionDate && (
              <span className="text-muted-foreground ml-1">
                ({format(new Date(deal.nextActionDate), 'MMM dd')})
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}