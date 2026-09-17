import { describe, expect, it } from 'vitest';
import { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, normalizeAvailabilityStatus, normalizeSuitability, preferenceScore, validateAssignment, validateLineupForPublish } from '../planner';

describe('planner domain', () => {
  it('supports per-half availability with legacy fallback', () => {
    const map: any = { '7': 'available', [availabilityKey(1, 2, 1, 7)]: 'absent' };
    expect(getAvailabilityStatus(map, 7, 1, 2, 1)).toBe('unavailable');
    expect(getAvailabilityStatus(map, 7, 1, 2, 2)).toBe('available');
  });
  it('keeps train-only out of games but allows training', () => {
    expect(isEligibleForHalf('train-only', 'game')).toBe(false);
    expect(isEligibleForHalf('train-only', 'training')).toBe(true);
  });
  it('maps removed legacy availability statuses to not available', () => {
    expect(normalizeAvailabilityStatus('injured')).toBe('unavailable');
    expect(normalizeAvailabilityStatus('absent')).toBe('unavailable');
    expect(normalizeAvailabilityStatus('not-selected')).toBe('unavailable');
  });
  it('derives bench size from attendance', () => {
    expect(getDynamicBenchSize(18, 12)).toBe(6);
    expect(getDynamicBenchSize(10, 12)).toBe(0);
  });
  it('cascades lineup cleanup', () => {
    const lineups = { '1-1-1': {}, '1-1-2': {}, '1-2-1': {}, '2-1-1': {} };
    expect(Object.keys(cleanupLineupsForMatch(lineups, 1, 1))).toEqual(['1-2-1', '2-1-1']);
    expect(Object.keys(cleanupLineupsForPlayday(lineups, 1))).toEqual(['2-1-1']);
  });
  it('computes the real history minimum instead of forcing zero', () => {
    expect(getHistoryRange({ 1: 3, 2: 3, 3: 4 })).toEqual({ min: 3, max: 4 });
  });
  it('returns hard-rule violations for game assignments', () => {
    expect(validateAssignment({ status: 'unavailable', mode: 'game', trained: false, duplicate: false })).toHaveLength(2);
  });
  it('supports the formal suitability values and four ranked favorite positions', () => {
    expect(normalizeSuitability(10)).toBe(10);
    expect(normalizeSuitability(7)).toBe(0);
    expect(preferenceScore(1)).toBe(100);
    expect(preferenceScore(2)).toBe(60);
    expect(preferenceScore(3)).toBe(35);
    expect(preferenceScore(4)).toBe(15);
    expect(preferenceScore(null)).toBe(0);
  });

  it('blocks publishing invalid halves', () => {
    const errors = validateLineupForPublish({
      positions: [1, 2],
      eligiblePlayerIds: [10, 11, 12],
      assignments: { 1: 10, 2: 11 },
      bench: [12],
      mode: 'game',
      isTrained: (_player, position) => Number(position) !== 2,
      getSuitability: (_player, position) => Number(position) === 1 ? 10 : 2,
    });
    expect(errors.some(error => error.includes('suitability 10'))).toBe(true);
    expect(errors.some(error => error.includes('not trained'))).toBe(true);
  });

  it('accepts a complete valid published half', () => {
    expect(validateLineupForPublish({
      positions: [1, 2],
      eligiblePlayerIds: [10, 11, 12],
      assignments: { 1: 10, 2: 11 },
      bench: [12],
      mode: 'game',
      isTrained: () => true,
      getSuitability: () => 2,
    })).toEqual([]);
  });
});
