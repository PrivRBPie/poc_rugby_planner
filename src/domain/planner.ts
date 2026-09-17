export type AvailabilityStatus = 'available' | 'train-only' | 'unavailable';

type LegacyAvailabilityStatus = 'injured' | 'absent' | 'not-selected';
type StoredAvailabilityStatus = AvailabilityStatus | LegacyAvailabilityStatus | string | null | undefined;

export function normalizeAvailabilityStatus(status: StoredAvailabilityStatus): AvailabilityStatus {
  if (status === 'available') return 'available';
  if (status === 'train-only') return 'train-only';
  return status ? 'unavailable' : 'available';
}

export function availabilityKey(playdayId: number | string, matchId: number | string, half: number | string, playerId: number | string) {
  return `half:${playdayId}:${matchId}:${half}:${playerId}`;
}

export function getAvailabilityStatus(map: Record<string, StoredAvailabilityStatus>, playerId: number | string, playdayId?: number | string, matchId?: number | string, half?: number | string): AvailabilityStatus {
  if (playdayId !== undefined && matchId !== undefined && half !== undefined) {
    const halfStatus = map[availabilityKey(playdayId, matchId, half, playerId)];
    if (halfStatus) return normalizeAvailabilityStatus(halfStatus);
  }
  return normalizeAvailabilityStatus(map[String(playerId)]);
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

export type Suitability = 0 | 1 | 2 | 3 | 10;

export function normalizeSuitability(value: number): Suitability {
  return ([0, 1, 2, 3, 10] as const).includes(value as Suitability) ? value as Suitability : 0;
}

export function preferenceScore(rank: 1 | 2 | 3 | 4 | null | undefined) {
  // Keep the original first/second preference weighting so existing player
  // allocations do not suddenly change when upgrading to four favorites.
  if (rank === 1) return 100;
  if (rank === 2) return 60;
  if (rank === 3) return 35;
  if (rank === 4) return 15;
  return 0;
}

export function validateLineupForPublish(input: {
  positions: Array<number | string>;
  eligiblePlayerIds: Array<number | string>;
  assignments: Record<string, number | string>;
  bench: Array<number | string>;
  mode: 'game' | 'training';
  isTrained: (playerId: number | string, positionId: number | string) => boolean;
  getSuitability: (playerId: number | string, positionId: number | string) => Suitability;
}) {
  const errors: string[] = [];
  const eligible = new Set(input.eligiblePlayerIds.map(String));
  const assignedIds: string[] = [];

  for (const positionId of input.positions) {
    const playerId = input.assignments[String(positionId)] ?? input.assignments[positionId as any];
    if (playerId === undefined || playerId === null || playerId === '') {
      errors.push(`Position #${positionId} is empty.`);
      continue;
    }
    const id = String(playerId);
    assignedIds.push(id);
    if (!eligible.has(id)) errors.push(`Player ${playerId} at #${positionId} is not eligible for this half.`);
    if (input.getSuitability(playerId, positionId) === 10) errors.push(`Player ${playerId} has suitability 10 at #${positionId}.`);
    if (input.mode === 'game' && !input.isTrained(playerId, positionId)) errors.push(`Player ${playerId} is not trained for #${positionId}.`);
  }

  const duplicateAssigned = assignedIds.filter((id, index) => assignedIds.indexOf(id) !== index);
  if (duplicateAssigned.length) errors.push('A player is assigned to more than one field position.');

  const benchIds = input.bench.map(String);
  const duplicateBench = benchIds.filter((id, index) => benchIds.indexOf(id) !== index);
  if (duplicateBench.length) errors.push('A player appears more than once on the bench.');
  if (benchIds.some(id => assignedIds.includes(id))) errors.push('A player appears both on the field and on the bench.');
  if (benchIds.some(id => !eligible.has(id))) errors.push('The bench contains an ineligible player.');

  const expectedBench = Math.max(0, input.eligiblePlayerIds.length - input.positions.length);
  if (input.bench.length !== expectedBench) errors.push(`Bench should contain ${expectedBench} player(s), currently ${input.bench.length}.`);

  const participating = new Set([...assignedIds, ...benchIds]);
  const missingEligible = [...eligible].filter(id => !participating.has(id));
  if (missingEligible.length) errors.push(`${missingEligible.length} eligible player(s) are not assigned to field or bench.`);

  return [...new Set(errors)];
}
