"use client";

import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, GitBranch, Settings, Eye, Edit2, Trash2, Move, Save, X, GripVertical } from 'lucide-react';
import { Pipeline, Stage, createStageSchema } from '@united-cars/crm-core';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InlineColorPicker, ColorSelector, STAGE_COLORS } from '@/components/ui/color-palette';

export default function PipelinesPage() {
  const { user, loading: sessionLoading } = useSession();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [managePipelineData, setManagePipelineData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [stageFormData, setStageFormData] = useState({
    name: '',
    color: '#6B7280',
    isClosing: false,
    isLost: false,
    wipLimit: '',
    slaTarget: '',
    slaUnit: 'hours'
  });
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingColorStageId, setEditingColorStageId] = useState<string | null>(null);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [editStageFormData, setEditStageFormData] = useState({
    name: '',
    color: '#6B7280',
    isClosing: false,
    isLost: false,
    wipLimit: '',
    slaTarget: '',
    slaUnit: 'hours'
  });
  const [localStages, setLocalStages] = useState<Stage[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    // Auto-open creation dialog if create parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setIsCreateOpen(true);
      // Remove the parameter from URL without refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const loadPipelines = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/pipelines');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn('Invalid pipelines data format:', data);
        setPipelines([]);
      } else {
        setPipelines(data);
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      if (retryCount < 2) {
        console.log(`Retrying pipelines load (attempt ${retryCount + 2}/3)...`);
        setTimeout(() => loadPipelines(retryCount + 1), 2000);
        return;
      }
      toast.error('Failed to load pipelines. Please refresh the page.');
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  const openPipelineManagement = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setLocalStages([...(pipeline.stages || [])]);
    setManagePipelineData({
      name: pipeline.name || '',
      description: pipeline.description || '',
      color: pipeline.color || '#3B82F6'
    });
    setIsManageOpen(true);
  };

  const handleStageReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = localStages.findIndex(stage => stage.id === active.id);
    const newIndex = localStages.findIndex(stage => stage.id === over.id);
    
    const reorderedStages = arrayMove(localStages, oldIndex, newIndex);
    setLocalStages(reorderedStages);
  };

  const saveStageOrder = async () => {
    if (!selectedPipeline?.id) return;

    try {
      const stageIds = localStages.map(stage => stage.id);
      const response = await fetch(`/api/crm/pipelines/${selectedPipeline.id}/stages/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageIds })
      });

      if (response.ok) {
        // Reload pipeline data to get updated stages
        const updatedPipeline = await fetch(`/api/crm/pipelines/${selectedPipeline.id}`).then(r => r.json());
        if (updatedPipeline?.id) {
          setSelectedPipeline(updatedPipeline);
        }
        setPipelines(prev => prev.map(p => p.id === selectedPipeline.id ? updatedPipeline : p));
        setLocalStages([...updatedPipeline.stages]);
        toast.success('Stage order updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reorder stages');
        // Reset local stages on error
        setLocalStages([...(selectedPipeline.stages || [])]);
      }
    } catch (error) {
      console.error('Failed to reorder stages:', error);
      toast.error('Failed to reorder stages');
      setLocalStages([...(selectedPipeline.stages || [])]);
    }
  };

  const handleCreatePipeline = async () => {
    if (!formData.name) return;

    try {
      const response = await fetch('/api/crm/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          order: pipelines.length
        })
      });

      if (response.ok) {
        const newPipeline = await response.json();
        setPipelines(prev => [...prev, newPipeline]);
        setIsCreateOpen(false);
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6'
        });
        toast.success(`Pipeline Created: ${newPipeline.name} has been created successfully.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create pipeline');
      }
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      toast.error('Failed to create pipeline');
    }
  };

  const handleUpdatePipeline = async () => {
    if (!selectedPipeline?.id || !managePipelineData.name) return;

    try {
      const response = await fetch(`/api/crm/pipelines/${selectedPipeline.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: managePipelineData.name,
          description: managePipelineData.description || undefined,
          color: managePipelineData.color
        })
      });

      if (response.ok) {
        const updatedPipeline = await response.json();
        if (updatedPipeline?.id) {
          setSelectedPipeline(updatedPipeline);
        }
        setPipelines(prev => prev.map(p => p.id === updatedPipeline.id ? updatedPipeline : p));
        toast.success(`Pipeline Updated: ${updatedPipeline.name} has been updated successfully.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update pipeline');
      }
    } catch (error) {
      console.error('Failed to update pipeline:', error);
      toast.error('Failed to update pipeline');
    }
  };

  const handleDeletePipeline = async (pipeline: Pipeline) => {
    if (!confirm(`Are you sure you want to delete "${pipeline.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/pipelines/${pipeline.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPipelines(prev => prev.filter(p => p.id !== pipeline.id));
        toast.success(`Pipeline Deleted: ${pipeline.name} has been deleted.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete pipeline');
      }
    } catch (error) {
      console.error('Failed to delete pipeline:', error);
      toast.error('Failed to delete pipeline');
    }
  };

  const handleAddStage = async (pipelineId: string) => {
    if (!stageFormData.name) return;

    try {
      const response = await fetch(`/api/crm/pipelines/${pipelineId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stageFormData.name,
          color: stageFormData.color,
          isClosing: stageFormData.isClosing,
          isLost: stageFormData.isLost,
          wipLimit: stageFormData.wipLimit ? parseInt(stageFormData.wipLimit) : undefined,
          slaTarget: stageFormData.slaTarget ? parseInt(stageFormData.slaTarget) : undefined,
          slaUnit: stageFormData.slaUnit,
          order: localStages.length
        })
      });

      if (response.ok) {
        const newStage = await response.json();
        // Reload pipeline data to get updated stages
        const updatedPipeline = await fetch(`/api/crm/pipelines/${pipelineId}`).then(r => r.json());
        if (updatedPipeline?.id) {
          setSelectedPipeline(updatedPipeline);
        }
        setLocalStages([...updatedPipeline.stages]);
        setPipelines(prev => prev.map(p => p.id === pipelineId ? updatedPipeline : p));
        setIsAddingStage(false);
        setStageFormData({
          name: '',
          color: '#6B7280',
          isClosing: false,
          isLost: false,
          wipLimit: '',
          slaTarget: '',
          slaUnit: 'hours'
        });
        toast.success(`Stage Added: ${newStage.name} has been added to the pipeline.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add stage');
      }
    } catch (error) {
      console.error('Failed to add stage:', error);
      toast.error('Failed to add stage');
    }
  };

  const handleUpdateStage = async (stage: Stage, updatedData: Partial<Stage>) => {
    try {
      const response = await fetch(`/api/crm/stages/${stage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const updatedStage = await response.json();
        // Update local stages
        setLocalStages(prev => prev.map(s => s.id === stage.id ? updatedStage : s));
        // Reload pipeline data to get updated stages
        if (selectedPipeline) {
          const updatedPipeline = await fetch(`/api/crm/pipelines/${selectedPipeline.id}`).then(r => r.json());
          if (updatedPipeline?.id) {
            setSelectedPipeline(updatedPipeline);
          }
          setPipelines(prev => prev.map(p => p.id === selectedPipeline.id ? updatedPipeline : p));
        }
        setEditingStageId(null);
        setEditingColorStageId(null);
        toast.success(`Stage Updated: ${updatedStage.name} has been updated.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update stage');
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
      toast.error('Failed to update stage');
    }
  };

  const handleOpenStageEdit = (stage: Stage) => {
    setEditStageFormData({
      name: stage.name,
      color: stage.color || '#6B7280',
      isClosing: stage.isClosing || false,
      isLost: stage.isLost || false,
      wipLimit: stage.wipLimit?.toString() || '',
      slaTarget: stage.slaTarget?.toString() || '',
      slaUnit: (stage as any).slaUnit || 'hours' // Use stored unit or default to hours
    });
    setEditingStageId(stage.id);
    setIsEditingStage(true);
  };

  const handleSaveStageEdit = async () => {
    if (!editingStageId || !editStageFormData.name) return;

    const stage = localStages.find(s => s.id === editingStageId);
    if (!stage) return;

    const updatedData = {
      name: editStageFormData.name,
      color: editStageFormData.color,
      isClosing: editStageFormData.isClosing,
      isLost: editStageFormData.isLost,
      wipLimit: editStageFormData.wipLimit ? parseInt(editStageFormData.wipLimit) : undefined,
      slaTarget: editStageFormData.slaTarget ? parseInt(editStageFormData.slaTarget) : undefined,
      slaUnit: editStageFormData.slaUnit
    };

    await handleUpdateStage(stage, updatedData);
    setIsEditingStage(false);
    setEditingStageId(null);
  };

  const handleDeleteStage = async (stage: Stage) => {
    if (!confirm(`Are you sure you want to delete the "${stage.name}" stage? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/stages/${stage.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local stages
        setLocalStages(prev => prev.filter(s => s.id !== stage.id));
        // Reload pipeline data to get updated stages
        if (selectedPipeline) {
          const updatedPipeline = await fetch(`/api/crm/pipelines/${selectedPipeline.id}`).then(r => r.json());
          if (updatedPipeline?.id) {
            setSelectedPipeline(updatedPipeline);
          }
          setPipelines(prev => prev.map(p => p.id === selectedPipeline.id ? updatedPipeline : p));
        }
        toast.success(`Stage Deleted: ${stage.name} has been deleted.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete stage');
      }
    } catch (error) {
      console.error('Failed to delete stage:', error);
      toast.error('Failed to delete stage');
    }
  };

  // Sortable Stage Component
  function SortableStage({ stage, index, onEdit, onDelete }: { 
    stage: Stage; 
    index: number; 
    onEdit: (stage: Stage) => void;
    onDelete: (stage: Stage) => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: stage.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors ${
          isDragging ? 'shadow-lg z-10' : ''
        }`}
      >
        <div className="flex items-center flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 mr-2 text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 mr-3">
            {index + 1}
          </div>
          {editingStageId === stage.id ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                defaultValue={stage.name}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateStage(stage, { name: e.currentTarget.value });
                  } else if (e.key === 'Escape') {
                    setEditingStageId(null);
                  }
                }}
                className="h-8"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const input = document.querySelector(`input[defaultValue="${stage.name}"]`) as HTMLInputElement;
                  if (input) {
                    handleUpdateStage(stage, { name: input.value });
                  }
                }}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingStageId(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="font-medium">{stage.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {stage.isClosing && <Badge variant="secondary" className="text-xs">Closing</Badge>}
                {stage.isLost && <Badge variant="destructive" className="text-xs">Lost</Badge>}
                {stage.wipLimit && <span className="text-xs">WIP: {stage.wipLimit}</span>}
                {stage.slaTarget && <span className="text-xs">SLA: {stage.slaTarget}{(stage as any).slaUnit === 'days' ? 'd' : 'h'}</span>}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editingColorStageId === stage.id ? (
            <div className="relative">
              <InlineColorPicker
                value={stage.color || '#6B7280'}
                onChange={(color) => {
                  handleUpdateStage(stage, { color });
                  setEditingColorStageId(null);
                }}
                onClose={() => setEditingColorStageId(null)}
                className="right-0 top-0"
              />
            </div>
          ) : (
            <div
              className="w-4 h-4 rounded-full cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all"
              style={{ backgroundColor: stage.color || '#6B7280' }}
              onClick={() => setEditingColorStageId(stage.id)}
              title="Click to change color"
            />
          )}
          {editingStageId !== stage.id && editingColorStageId !== stage.id && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(stage)}
                title="Edit Stage"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(stage)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Delete Stage"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="Pipelines"
          description="Manage your sales workflows and stages"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Pipelines' }]}
        />
        <LoadingState text="Loading pipelines..." />
      </AppLayout>
    );
  }

  const newPipelineButton = (
    <Button onClick={() => setIsCreateOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      New Pipeline
    </Button>
  );

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Pipelines"
        description="Manage your sales workflows and stages"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Pipelines' }]}
        actions={newPipelineButton}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6">
          {pipelines.map((pipeline) => (
            <div key={`pipeline-${pipeline.id}`} className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: pipeline.color || '#6B7280' }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{pipeline.name}</h3>
                    {pipeline.description && (
                      <p className="text-sm text-text-secondary">{pipeline.description}</p>
                    )}
                  </div>
                  {pipeline.isDefault && (
                    <Badge variant="secondary" className="ml-3">Default</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openPipelineManagement(pipeline)} title="Manage Pipeline">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeletePipeline(pipeline)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/5"
                    title="Delete Pipeline"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {pipeline.stages?.map((stage, index) => (
                  <div key={`${pipeline.id}-stage-${stage.id}`} className="flex items-center">
                    <div 
                      className="px-3 py-1 rounded-full text-sm font-medium text-primary-foreground"
                      style={{ backgroundColor: stage.color || '#6B7280' }}
                    >
                      {stage.name}
                    </div>
                    {index < (pipeline.stages?.length || 0) - 1 && (
                      <div className="w-4 h-px bg-surface-300 mx-1" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center text-sm text-text-secondary">
                <GitBranch className="h-4 w-4 mr-2" />
                {pipeline.stages?.length || 0} stages
              </div>
            </div>
          ))}
        </div>

        {pipelines.length === 0 && !loading && (
          <div className="bg-card rounded-lg shadow-sm border border-border text-center py-12">
            <GitBranch className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <div className="text-text-secondary mb-4">No pipelines found</div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                Create Your First Pipeline
              </Button>
              <Button variant="ghost" onClick={() => loadPipelines()}>
                Refresh
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: managePipelineData.color || '#6B7280' }}
              />
              Manage Pipeline
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Pipeline Details</h3>
              
              <div>
                <Label htmlFor="manageName">Pipeline Name *</Label>
                <Input
                  id="manageName"
                  value={managePipelineData.name}
                  onChange={(e) => setManagePipelineData({ ...managePipelineData, name: e.target.value })}
                  placeholder="Enter pipeline name"
                />
              </div>
              
              <div>
                <Label htmlFor="manageDescription">Description</Label>
                <Textarea
                  id="manageDescription"
                  value={managePipelineData.description}
                  onChange={(e) => setManagePipelineData({ ...managePipelineData, description: e.target.value })}
                  placeholder="Pipeline description (optional)"
                  rows={3}
                />
              </div>
              
              <div>
                <ColorSelector
                  value={managePipelineData.color}
                  onChange={(color) => setManagePipelineData({ ...managePipelineData, color })}
                  label="Pipeline Color"
                />
              </div>
              
              <Button onClick={handleUpdatePipeline} disabled={!managePipelineData.name} className="w-full">
                Update Pipeline Details
              </Button>
            </div>
            
            {/* Stages Management Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-gray-900">Stages Management</h3>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={saveStageOrder}
                    variant="outline"
                    title="Save current stage order"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save Order
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingStage(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Stage
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <strong>💡 Tip:</strong> Drag the grip handles (⋮⋮) to reorder stages. Click "Save Order" to persist changes.
              </div>
              
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter}
                onDragEnd={handleStageReorder}
              >
                <SortableContext items={localStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {localStages.map((stage, index) => (
                      <SortableStage
                        key={`sortable-${stage.id}`}
                        stage={stage}
                        index={index}
                        onEdit={handleOpenStageEdit}
                        onDelete={handleDeleteStage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {/* Add Stage Form */}
              {isAddingStage && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Stage</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="stageName" className="text-sm">Stage Name *</Label>
                        <Input
                          id="stageName"
                          value={stageFormData.name}
                          onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                          placeholder="Enter stage name"
                        />
                      </div>
                      <div>
                        <ColorSelector
                          value={stageFormData.color}
                          onChange={(color) => setStageFormData({ ...stageFormData, color })}
                          label="Stage Color"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="wipLimit" className="text-sm">WIP Limit</Label>
                        <Input
                          id="wipLimit"
                          type="number"
                          value={stageFormData.wipLimit}
                          onChange={(e) => setStageFormData({ ...stageFormData, wipLimit: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slaTarget" className="text-sm">SLA Target</Label>
                        <div className="flex gap-2">
                          <Input
                            id="slaTarget"
                            type="number"
                            value={stageFormData.slaTarget}
                            onChange={(e) => setStageFormData({ ...stageFormData, slaTarget: e.target.value })}
                            placeholder="Optional"
                            className="flex-1"
                          />
                          <select
                            value={stageFormData.slaUnit}
                            onChange={(e) => setStageFormData({ ...stageFormData, slaUnit: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                          >
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={stageFormData.isClosing}
                          onChange={(e) => setStageFormData({ ...stageFormData, isClosing: e.target.checked })}
                        />
                        Closing Stage
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={stageFormData.isLost}
                          onChange={(e) => setStageFormData({ ...stageFormData, isLost: e.target.checked })}
                        />
                        Lost Stage
                      </label>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingStage(false);
                          setStageFormData({
                            name: '',
                            color: '#6B7280',
                            isClosing: false,
                            isLost: false,
                            wipLimit: '',
                            slaTarget: '',
                            slaUnit: 'hours'
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => selectedPipeline?.id && handleAddStage(selectedPipeline.id)}
                        disabled={!stageFormData.name || !selectedPipeline?.id}
                      >
                        Add Stage
                      </Button>
                    </div>
                  </div>
                </div>
              )}


              {localStages.length === 0 && !isAddingStage && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">No stages in this pipeline</div>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingStage(true)}
                  >
                    Add Your First Stage
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {localStages.length} stage{localStages.length !== 1 ? 's' : ''} configured
            </div>
            <Button variant="outline" onClick={() => setIsManageOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Pipeline Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter pipeline name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Pipeline description (optional)"
                rows={3}
              />
            </div>
            <div>
              <ColorSelector
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
                label="Pipeline Color"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePipeline} disabled={!formData.name}>
                Create Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={isEditingStage} onOpenChange={setIsEditingStage}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editStageName" className="text-sm">Stage Name *</Label>
                <Input
                  id="editStageName"
                  value={editStageFormData.name}
                  onChange={(e) => setEditStageFormData({ ...editStageFormData, name: e.target.value })}
                  placeholder="Enter stage name"
                />
              </div>
              <div>
                <ColorSelector
                  value={editStageFormData.color}
                  onChange={(color) => setEditStageFormData({ ...editStageFormData, color })}
                  label="Stage Color"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editWipLimit" className="text-sm">WIP Limit</Label>
                <Input
                  id="editWipLimit"
                  type="number"
                  value={editStageFormData.wipLimit}
                  onChange={(e) => setEditStageFormData({ ...editStageFormData, wipLimit: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="editSlaTarget" className="text-sm">SLA Target</Label>
                <div className="flex gap-2">
                  <Input
                    id="editSlaTarget"
                    type="number"
                    value={editStageFormData.slaTarget}
                    onChange={(e) => setEditStageFormData({ ...editStageFormData, slaTarget: e.target.value })}
                    placeholder="Optional"
                    className="flex-1"
                  />
                  <select
                    value={editStageFormData.slaUnit}
                    onChange={(e) => setEditStageFormData({ ...editStageFormData, slaUnit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editStageFormData.isClosing}
                  onChange={(e) => setEditStageFormData({ ...editStageFormData, isClosing: e.target.checked })}
                />
                Closing Stage
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editStageFormData.isLost}
                  onChange={(e) => setEditStageFormData({ ...editStageFormData, isLost: e.target.checked })}
                />
                Lost Stage
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingStage(false);
                  setEditingStageId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveStageEdit}
                disabled={!editStageFormData.name}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}