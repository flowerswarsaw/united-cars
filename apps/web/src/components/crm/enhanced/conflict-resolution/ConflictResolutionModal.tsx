'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UniquenessConflict, 
  ConflictResolution, 
  ConflictResolutionManager,
  ConflictResolutionResult 
} from '@united-cars/crm-core/src/conflict-resolution';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { AlertTriangle, Eye, UserPlus, Edit, X, CheckCircle } from 'lucide-react';

export interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflicts: UniquenessConflict[];
  entityType: string;
  proposedData: Record<string, any>;
  userRole: UserRole;
  suggestedResolutions?: Record<string, string[]>;
  onClose: () => void;
  onResolve: (resolution: ConflictResolution) => Promise<ConflictResolutionResult>;
}

export function ConflictResolutionModal({
  isOpen,
  conflicts,
  entityType,
  proposedData,
  userRole,
  suggestedResolutions,
  onClose,
  onResolve
}: ConflictResolutionModalProps) {
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);
  const [modifiedData, setModifiedData] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('conflicts');

  // Generate resolution options based on user role and conflicts
  const resolutionOptions = ConflictResolutionManager.generateResolutionOptions(
    conflicts,
    userRole,
    entityType
  );

  // Generate conflict summary for display
  const conflictSummary = ConflictResolutionManager.generateConflictSummary(conflicts);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedResolution(null);
      setModifiedData({});
      setIsProcessing(false);
      setActiveTab('conflicts');
    }
  }, [isOpen]);

  const handleResolutionSelect = (resolutionType: ConflictResolution['action']) => {
    const resolution: ConflictResolution = {
      action: resolutionType,
      fieldUpdates: resolutionType === 'keep_both' ? modifiedData : undefined
    };
    setSelectedResolution(resolution);
    
    if (resolutionType === 'keep_both') {
      setActiveTab('modify');
    }
  };

  const handleFieldModification = (field: string, value: string) => {
    setModifiedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applySuggestion = (field: string, suggestion: string) => {
    handleFieldModification(field, suggestion);
  };

  const handleResolve = async () => {
    if (!selectedResolution) return;

    setIsProcessing(true);
    try {
      // Validate resolution before applying
      const validation = ConflictResolutionManager.validateResolution(
        selectedResolution,
        conflicts,
        userRole
      );

      if (!validation.isValid) {
        alert(`Resolution invalid: ${validation.errors.join(', ')}`);
        return;
      }

      const result = await onResolve(selectedResolution);
      
      if (result.success) {
        onClose();
      } else {
        alert(`Resolution failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error applying resolution:', error);
      alert('Failed to apply resolution');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Uniqueness Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            The data you're trying to save conflicts with existing records. 
            Please choose how to resolve these conflicts.
          </DialogDescription>
        </DialogHeader>

        {/* Conflict Summary */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {conflictSummary.totalConflicts} conflicts found affecting {conflictSummary.affectedEntities} entities
              </span>
              <Badge variant={getRiskLevelColor(conflictSummary.riskLevel)}>
                {conflictSummary.riskLevel} RISK
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="conflicts">View Conflicts</TabsTrigger>
            <TabsTrigger value="resolve">Choose Resolution</TabsTrigger>
            <TabsTrigger value="modify" disabled={selectedResolution?.action !== 'keep_both'}>
              Modify Fields
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conflicts" className="space-y-4">
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <Card key={index} className="border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-700">
                      Field: {conflict.field}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Conflicting Value</Label>
                      <div className="font-mono text-sm bg-red-50 p-2 rounded border">
                        {conflict.value}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Existing Records ({conflict.conflictingEntities.length})
                      </Label>
                      {conflict.conflictingEntities.map((entity, entityIndex) => (
                        <div key={entityIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{entity.entityType}</Badge>
                            <span className="font-mono text-sm">{entity.entityName || entity.entityId}</span>
                            {entity.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resolve" className="space-y-4">
            <div className="grid gap-3">
              {resolutionOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-colors ${
                    selectedResolution?.action === option.type 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleResolutionSelect(option.type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{option.icon}</div>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {option.requiresAdminRole && (
                          <Badge variant="destructive" className="text-xs">Admin Only</Badge>
                        )}
                        {option.isDestructive && (
                          <Badge variant="outline" className="text-xs">Destructive</Badge>
                        )}
                        {selectedResolution?.action === option.type && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modify" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Modify the conflicting field values below to avoid conflicts while keeping both records.
                </AlertDescription>
              </Alert>

              {conflicts.map((conflict) => (
                <Card key={conflict.field}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Field: {conflict.field}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm">Current Value</Label>
                      <Input
                        value={modifiedData[conflict.field] || conflict.value}
                        onChange={(e) => handleFieldModification(conflict.field, e.target.value)}
                        className="font-mono"
                      />
                    </div>

                    {suggestedResolutions?.[conflict.field] && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Suggestions</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {suggestedResolutions[conflict.field].map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => applySuggestion(conflict.field, suggestion)}
                              className="text-xs"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {selectedResolution && selectedResolution.action !== 'cancel' && (
              <Button 
                onClick={handleResolve}
                disabled={isProcessing || !selectedResolution}
                variant={selectedResolution.action === 'merge' ? 'destructive' : 'default'}
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    Apply {selectedResolution.action.replace('_', ' ')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}