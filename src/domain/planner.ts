export type AvailabilityStatus = 'available' | 'train-only' | 'injured' | 'absent' | 'not-selected' | 'unavailable';

export function availabilityKey(playdayId: number | string, matchId: number | string, half: number | string, playerId: number | string) {
  return `half:${playdayId}:${matchId}:${half}:${playerId}`;
}

export function getAvailabilityStatus(map: Record<string, AvailabilityStatus>, playerId: number | string, playdayId?: number | string, matchId?: number | string, half?: number | string): AvailabilityStatus {
  if (playdayId !== undefined && matchId !== undefined && half !== undefined) {
    const halfStatus = map[availabilityKey(playdayId, matchId, half, playerId)];
    if (halfStatus) return halfStatus;
  }
  return map[String(playerId)] || 'available';
}

export function isEligibleForHalf(status: AvailabilityStatus, mode: 'game' | 'training' = 'game') {
  return status === 'available' || (mode === 'training' && status === 'train-only');
}

export function getDynamicBenchSize(eligiblePlayers: number, fieldSlots: number) {
  return Math.max(0, eligiblePlayers - fieldSlots);
}

export function cleanupLineupsForPlayday<T>(lineups: Record<string, T>, playdayId: number | string) {
  const prefix = `${playdayId}-`;
  return Object.fromEntries(Object.entries(lineups).filter(([key]) => !key.startsWith(prefix)));
}

export function cleanupLineupsForMatch<T>(lineups: Record<string, T>, playdayId: number | string, matchId: number | string) {
  const prefix = `${playdayId}-${matchId}-`;
  return Object.fromEntries(Object.entries(lineups).filter(([key]) => !key.startsWith(prefix)));
}

export function getHistoryRange(history: Record<string | number, number>) {
  const values = Object.values(history);
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max: max === min ? min + 1 : max };
}

export function validateAssignment(input: { status: AvailabilityStatus; mode: 'game' | 'training'; trained: boolean; duplicate: boolean }) {
  const issues: string[] = [];
  if (input.duplicate) issues.push('Player is already assigned in this half.');
  if (!isEligibleForHalf(input.status, input.mode)) issues.push(`Player is not eligible for this half (${input.status}).`);
  if (input.mode === 'game' && !input.trained) issues.push('Player is not trained for this position.');
  return issues;
}
