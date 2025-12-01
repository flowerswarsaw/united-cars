'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DraftTrigger,
  ENTITY_EVENTS,
  EVENT_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
  TriggerType,
  EventType,
  EntityType,
} from './types';

interface TriggerEditorProps {
  value: DraftTrigger;
  onChange: (trigger: DraftTrigger) => void;
  disabled?: boolean;
}

// Entity types that have events defined
const SUPPORTED_ENTITY_TYPES: EntityType[] = [
  EntityType.DEAL,
  EntityType.TICKET,
  EntityType.ORGANISATION,
  EntityType.CONTACT,
  EntityType.LEAD,
  EntityType.TASK,
];

export function TriggerEditor({ value, onChange, disabled }: TriggerEditorProps) {
  const handleEntityTypeChange = (entityType: EntityType) => {
    // Get the first event for this entity type as default
    const events = ENTITY_EVENTS[entityType] || [];
    const defaultEvent = events[0] || EventType.DEAL_CREATED;

    onChange({
      ...value,
      entityType,
      eventType: defaultEvent,
    });
  };

  const handleEventTypeChange = (eventType: string) => {
    onChange({
      ...value,
      eventType: eventType as EventType,
    });
  };

  // Get available events for the selected entity type
  const availableEvents = value.entityType
    ? ENTITY_EVENTS[value.entityType] || []
    : [];

  return (
    <div className="space-y-4">
      {/* Trigger Type - only EVENT for now */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Trigger Type</Label>
        <Select value={value.type} disabled>
          <SelectTrigger className="w-full" disabled={disabled}>
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TriggerType.EVENT}>Event-based</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Workflow runs when a specific event occurs
        </p>
      </div>

      {/* Entity Type */}
      <div className="space-y-2">
        <Label>Entity Type</Label>
        <Select
          value={value.entityType || ''}
          onValueChange={(v) => handleEntityTypeChange(v as EntityType)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select entity type" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_ENTITY_TYPES.map((entityType) => (
              <SelectItem key={entityType} value={entityType}>
                {ENTITY_TYPE_LABELS[entityType] || entityType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Event Type */}
      <div className="space-y-2">
        <Label>Event</Label>
        <Select
          value={value.eventType as string}
          onValueChange={handleEventTypeChange}
          disabled={disabled || !value.entityType}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {availableEvents.map((eventType) => (
              <SelectItem key={eventType} value={eventType}>
                {EVENT_TYPE_LABELS[eventType] || eventType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!value.entityType && (
          <p className="text-xs text-muted-foreground">
            Select an entity type first
          </p>
        )}
      </div>
    </div>
  );
}
