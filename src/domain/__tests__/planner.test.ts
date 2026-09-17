import { describe, expect, it } from 'vitest';
import { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, validateAssignment } from '../planner';

describe('planner domain', () => {
  it('supports per-half availability with legacy fallback', () => {
    const map: any = { '7': 'available', [availabilityKey(1, 2, 1, 7)]: 'absent' };
    expect(getAvailabilityStatus(map, 7, 1, 2, 1)).toBe('absent');
    expect(getAvailabilityStatus(map, 7, 1, 2, 2)).toBe('available');
  });
  it('keeps train-only out of games but allows training', () => {
    expect(isEligibleForHalf('train-only', 'game')).toBe(false);
    expect(isEligibleForHalf('train-only', 'training')).toBe(true);
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
    expect(validateAssignment({ status: 'injured', mode: 'game', trained: false, duplicate: false })).toHaveLength(2);
  });
});
