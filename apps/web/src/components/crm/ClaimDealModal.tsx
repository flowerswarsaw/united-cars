'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Deal } from '@united-cars/crm-core';

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface ClaimDealModalProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClaimDealModal({ deal, open, onClose, onSuccess }: ClaimDealModalProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  // Load pipelines on mount
  useEffect(() => {
    if (open) {
      loadPipelines();
    }
  }, [open]);

  // Load default selections when deal changes
  useEffect(() => {
    if (deal && pipelines.length > 0) {
      // Try to default to the deal's last pipeline/stage
      const lastPipelineId = deal.currentStages?.[0]?.pipelineId
        || (deal.stageHistory && deal.stageHistory.length > 0
          ? [...deal.stageHistory].sort((a, b) =>
              new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()
            )[0].pipelineId
          : null);

      if (lastPipelineId && pipelines.find(p => p.id === lastPipelineId)) {
        setSelectedPipelineId(lastPipelineId);

        const lastStageId = deal.currentStages?.[0]?.stageId
          || (deal.stageHistory && deal.stageHistory.length > 0
            ? [...deal.stageHistory].sort((a, b) =>
                new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()
              )[0].toStageId
            : null);

        if (lastStageId) {
          setSelectedStageId(lastStageId);
        }
      } else {
        // Default to first pipeline
        setSelectedPipelineId(pipelines[0].id);
      }
    }
  }, [deal, pipelines]);

  const loadPipelines = async () => {
    try {
      setLoadingPipelines(true);
      const res = await fetch('/api/crm/pipelines');
      if (!res.ok) throw new Error('Failed to load pipelines');
      const data = await res.json();
      setPipelines(data.data || []);
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      toast.error('Failed to load pipelines');
    } finally {
      setLoadingPipelines(false);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setSelectedStageId(''); // Reset stage selection
  };

  const handleClaim = async () => {
    if (!deal || !selectedPipelineId || !selectedStageId) {
      toast.error('Please select a pipeline and stage');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/crm/deals/${deal.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: selectedPipelineId,
          stageId: selectedStageId,
          note: note.trim() || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.error || 'Failed to claim deal');
      }

      const result = await res.json();

      toast.success(`Successfully claimed "${deal.title}"`);

      // Reset form
      setSelectedPipelineId('');
      setSelectedStageId('');
      setNote('');

      // Call success callback
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to claim deal:', error);
      toast.error(`Failed to claim deal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const availableStages = selectedPipeline?.stages || [];

  // Auto-select first stage when pipeline changes (if no stage selected)
  useEffect(() => {
    if (selectedPipelineId && !selectedStageId && availableStages.length > 0) {
      setSelectedStageId(availableStages[0].id);
    }
  }, [selectedPipelineId, availableStages, selectedStageId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim Deal</DialogTitle>
          <DialogDescription>
            Select a pipeline and stage to assign <strong>{deal?.title}</strong> to your workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingPipelines ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Pipeline Selection */}
              <div className="space-y-2">
                <Label htmlFor="pipeline">Pipeline</Label>
                <Select
                  value={selectedPipelineId}
                  onValueChange={handlePipelineChange}
                  disabled={loading}
                >
                  <SelectTrigger id="pipeline">
                    <SelectValue placeholder="Select a pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage Selection */}
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={selectedStageId}
                  onValueChange={setSelectedStageId}
                  disabled={!selectedPipelineId || loading}
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add a note about claiming this deal..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            disabled={!selectedPipelineId || !selectedStageId || loading || loadingPipelines}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              'Claim Deal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
