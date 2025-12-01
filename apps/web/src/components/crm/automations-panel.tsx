'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  AutomationRun,
  AutomationStepRun,
  ExecutionStatus,
} from '@united-cars/crm-automation';

interface AutomationsPanelProps {
  entityType: 'DEAL' | 'TICKET';
  entityId: string;
}

interface RunWithWorkflow extends AutomationRun {
  workflowName?: string;
  steps?: AutomationStepRun[];
}

export function AutomationsPanel({ entityType, entityId }: AutomationsPanelProps) {
  const [runs, setRuns] = useState<RunWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    loadRuns();
  }, [entityType, entityId]);

  const loadRuns = async () => {
    try {
      const response = await fetch(
        `/api/crm/automations/runs?primaryEntityType=${entityType}&primaryEntityId=${entityId}`
      );
      if (response.ok) {
        const data: AutomationRun[] = await response.json();

        // Load workflow names and steps for each run
        const enrichedRuns = await Promise.all(
          data.map(async (run) => {
            const [workflowRes, stepsRes] = await Promise.all([
              fetch(`/api/crm/automations/workflows/${run.workflowId}`),
              fetch(`/api/crm/automations/runs/${run.id}/steps`),
            ]);
            const workflow = workflowRes.ok ? await workflowRes.json() : null;
            const steps = stepsRes.ok ? await stepsRes.json() : [];
            return {
              ...run,
              workflowName: workflow?.name || 'Unknown Workflow',
              steps,
            };
          })
        );
        setRuns(enrichedRuns);
      }
    } catch (error) {
      console.error('Failed to load automation runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SKIPPED':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'PARTIAL':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: ExecutionStatus): string => {
    const colors: Record<string, string> = {
      SUCCESS: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      SKIPPED: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading automation history...
        </CardContent>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="text-lg font-medium mb-2">No Automations Triggered</h4>
          <p className="text-sm text-muted-foreground">
            When automations run on this {entityType.toLowerCase()}, they&apos;ll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Automation History</h3>
          <p className="text-sm text-muted-foreground">
            {runs.length} automation run{runs.length !== 1 ? 's' : ''} for this {entityType.toLowerCase()}
          </p>
        </div>
      </div>

      {runs.map((run) => (
        <Card key={run.id}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(run.status)}
                <div>
                  <p className="font-medium text-sm">{run.workflowName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(run.triggeredAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeClass(run.status)}>
                  {run.status}
                </Badge>
                {run.steps && run.steps.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    {expandedRun === run.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {expandedRun === run.id && run.steps && run.steps.length > 0 && (
            <CardContent className="pt-0 px-4 pb-4">
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Action Steps</p>
                <div className="space-y-2">
                  {run.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 text-sm p-2 bg-muted/50 rounded"
                    >
                      <span className="text-muted-foreground font-mono text-xs">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">
                            {step.actionType.replace('_', ' ')}
                          </span>
                          <Badge
                            className={`${getStatusBadgeClass(step.status)} text-xs flex-shrink-0`}
                          >
                            {step.status}
                          </Badge>
                        </div>
                        {step.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 truncate">
                            {step.errorMessage}
                          </p>
                        )}
                        {step.output && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Result: {typeof step.output === 'object'
                              ? JSON.stringify(step.output).slice(0, 80)
                              : String(step.output).slice(0, 80)}
                            {JSON.stringify(step.output).length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {run.conditionsMatched === false && (
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  Conditions not matched - workflow was skipped
                </div>
              )}

              {run.errorMessage && (
                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
                  Error: {run.errorMessage}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
