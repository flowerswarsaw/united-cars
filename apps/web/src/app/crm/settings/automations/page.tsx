'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Zap, Lock, Code, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AutomationWorkflow } from '@united-cars/crm-automation';
import {
  DraftWorkflow,
  workflowToDraft,
  draftToPayload,
  createDefaultDraft,
} from '@/components/crm/automations/types';
import { TriggerEditor } from '@/components/crm/automations/TriggerEditor';
import { ConditionsEditor } from '@/components/crm/automations/ConditionsEditor';
import { ActionsEditor } from '@/components/crm/automations/ActionsEditor';

export default function AutomationsSettingsPage() {
  const { user } = useSession();
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [draftWorkflow, setDraftWorkflow] = useState<DraftWorkflow | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/crm/automations/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (workflow: AutomationWorkflow) => {
    try {
      const response = await fetch(`/api/crm/automations/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, isActive: !workflow.isActive }),
      });
      if (response.ok) {
        toast.success(`Workflow ${workflow.isActive ? 'deactivated' : 'activated'}`);
        loadWorkflows();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to toggle workflow');
      }
    } catch (error) {
      toast.error('Failed to toggle workflow');
    }
  };

  const openEditDialog = (workflow?: AutomationWorkflow) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setDraftWorkflow(workflowToDraft(workflow));
    } else {
      setEditingWorkflow(null);
      setDraftWorkflow(createDefaultDraft());
    }
    setShowEditDialog(true);
  };

  const closeDialog = () => {
    setShowEditDialog(false);
    setEditingWorkflow(null);
    setDraftWorkflow(null);
    setShowJsonPreview(false);
  };

  const saveWorkflow = async () => {
    if (!draftWorkflow) return;

    if (!draftWorkflow.name.trim()) {
      toast.error('Workflow name is required');
      return;
    }

    if (draftWorkflow.actions.length === 0) {
      toast.error('At least one action is required');
      return;
    }

    try {
      const payload = {
        ...draftToPayload(draftWorkflow),
        isActive: editingWorkflow?.isActive ?? true,
      };

      const url = editingWorkflow
        ? `/api/crm/automations/workflows/${editingWorkflow.id}`
        : '/api/crm/automations/workflows';
      const method = editingWorkflow ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingWorkflow ? 'Workflow updated' : 'Workflow created');
        closeDialog();
        loadWorkflows();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save workflow');
      }
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  const deleteWorkflow = async (workflow: AutomationWorkflow) => {
    if (workflow.isSystem) {
      toast.error('Cannot delete system workflow');
      return;
    }

    if (!confirm(`Delete workflow "${workflow.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/automations/workflows/${workflow.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Workflow deleted');
        loadWorkflows();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete workflow');
      }
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const getEventTypeBadge = (workflow: AutomationWorkflow) => {
    const eventType = workflow.trigger.config?.eventType as string;
    const colors: Record<string, string> = {
      'deal.won': 'bg-green-100 text-green-800',
      'deal.created': 'bg-blue-100 text-blue-800',
      'deal.updated': 'bg-yellow-100 text-yellow-800',
      'deal.stage_changed': 'bg-purple-100 text-purple-800',
      'ticket.created': 'bg-orange-100 text-orange-800',
      'ticket.updated': 'bg-amber-100 text-amber-800',
    };
    const displayName = eventType?.replace('.', ' ').replace(/_/g, ' ') || 'Unknown';
    return (
      <Badge className={colors[eventType] || 'bg-gray-100 text-gray-800'}>
        {displayName}
      </Badge>
    );
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isSystemWorkflow = editingWorkflow?.isSystem || false;

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Automations"
        description="Manage automation workflows that trigger on CRM events"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings/users' },
          { label: 'Automations' },
        ]}
        actions={
          <Button onClick={() => openEditDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        }
      />

      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Workflows ({workflows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading workflows...
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-lg font-medium mb-2">No Workflows</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first automation workflow to get started.
                </p>
                <Button onClick={() => openEditDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    <TableHead className="text-center">Runs</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {workflow.isSystem && (
                            <span title="System workflow">
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </span>
                          )}
                          <div>
                            <p className="font-medium">{workflow.name}</p>
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getEventTypeBadge(workflow)}</TableCell>
                      <TableCell className="text-center">{workflow.actions.length}</TableCell>
                      <TableCell className="text-center">{workflow.executionCount || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(workflow.lastTriggeredAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={workflow.isActive}
                          onCheckedChange={() => toggleActive(workflow)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(workflow)}
                            title={workflow.isSystem ? 'View workflow' : 'Edit workflow'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!workflow.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWorkflow(workflow)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete workflow"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow
                ? isSystemWorkflow
                  ? 'View System Workflow'
                  : 'Edit Workflow'
                : 'Create Workflow'}
            </DialogTitle>
          </DialogHeader>

          {draftWorkflow && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={draftWorkflow.name}
                    onChange={(e) =>
                      setDraftWorkflow({ ...draftWorkflow, name: e.target.value })
                    }
                    placeholder="Workflow name"
                    disabled={isSystemWorkflow}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={draftWorkflow.description}
                    onChange={(e) =>
                      setDraftWorkflow({ ...draftWorkflow, description: e.target.value })
                    }
                    placeholder="Brief description of what this workflow does"
                    disabled={isSystemWorkflow}
                  />
                </div>
              </div>

              {/* Trigger Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">When to run</h3>
                <TriggerEditor
                  value={draftWorkflow.trigger}
                  onChange={(trigger) =>
                    setDraftWorkflow({ ...draftWorkflow, trigger })
                  }
                  disabled={isSystemWorkflow}
                />
              </div>

              {/* Conditions Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Conditions (optional)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Add conditions to filter when this workflow should run
                </p>
                <ConditionsEditor
                  value={draftWorkflow.conditionGroups}
                  onChange={(conditionGroups) =>
                    setDraftWorkflow({ ...draftWorkflow, conditionGroups })
                  }
                  entityType={draftWorkflow.trigger.entityType}
                  disabled={isSystemWorkflow}
                />
              </div>

              {/* Actions Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Actions to perform</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Define what happens when the workflow runs
                </p>
                <ActionsEditor
                  value={draftWorkflow.actions}
                  onChange={(actions) =>
                    setDraftWorkflow({ ...draftWorkflow, actions })
                  }
                  disabled={isSystemWorkflow}
                />
              </div>

              {/* Advanced JSON Preview (collapsible) */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4" />
                    Advanced: Raw JSON
                  </div>
                  {showJsonPreview ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showJsonPreview && (
                  <div className="px-4 pb-4">
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-60">
                      {JSON.stringify(draftToPayload(draftWorkflow), null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isSystemWorkflow ? (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={closeDialog}>
                    Close
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveWorkflow}
                    disabled={!draftWorkflow.name.trim()}
                  >
                    {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
