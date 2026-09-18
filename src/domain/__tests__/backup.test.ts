import { describe, expect, it } from 'vitest';
import {
  BACKUP_SCHEMA_VERSION,
  TEAM_BACKUP_DATA_KEYS,
  buildTeamBackupData,
  isSafeFullBackupDatabase,
} from '../backup';

describe('backup helpers', () => {
  it('keeps every persisted team-data field in a current-team backup', () => {
    const source = {
      players: [],
      playdays: [],
      lineups: {},
      ratings: {},
      training: {},
      favoritePositions: {},
      suitability: {},
      positionPreferences: {},
      publishedHalves: {},
      keyPositionMultiplier: 1.15,
      allocationRules: {},
      availability: {},
      learningPlayerConfig: {},
      satisfactionWeights: {},
      playerNotes: {},
      inactivePlayerIds: [],
      seasonStartDate: null,
    };

    expect(Object.keys(buildTeamBackupData(source)).sort()).toEqual(
      [...TEAM_BACKUP_DATA_KEYS].sort()
    );
  });

  it('requires all recoverable tables for a full backup', () => {
    expect(BACKUP_SCHEMA_VERSION).toBe(2);
    expect(isSafeFullBackupDatabase({
      teams: [],
      rugby_data: [],
      players: [],
      team_players: [],
      coach_settings: [],
    })).toBe(true);

    expect(isSafeFullBackupDatabase({
      teams: [],
      rugby_data: [],
    })).toBe(false);
  });
});
