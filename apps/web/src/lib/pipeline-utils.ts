// Client-safe pipeline utilities
// These functions can be used in both client and server components

export function calculateSlaBreachDays(enteredStageAt: string, slaDays?: number): number | null {
  if (!slaDays) return null;

  const enteredDate = new Date(enteredStageAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - enteredDate.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysDiff - slaDays);
}

export function isStageTerminal(stageId: string, stages: Array<{ id: string; isTerminal?: boolean }>): boolean {
  const stage = stages.find(s => s.id === stageId);
  return stage?.isTerminal || false;
}

export function isDeadlocked(outcome: string | null, isFrozen: boolean): boolean {
  return outcome === 'won' && isFrozen;
}