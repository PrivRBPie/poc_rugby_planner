export const BACKUP_SCHEMA_VERSION = 2;

export type TeamBackupState = {
  players: unknown[];
  playdays: unknown[];
  lineups: Record<string, unknown>;
  ratings: Record<string, unknown>;
  training: Record<string, unknown>;
  favoritePositions: Record<string, unknown>;
  suitability: Record<string, unknown>;
  positionPreferences: Record<string, unknown>;
  publishedHalves: Record<string, unknown>;
  keyPositionMultiplier: number;
  allocationRules: Record<string, unknown>;
  availability: Record<string, unknown>;
  learningPlayerConfig: Record<string, unknown>;
  satisfactionWeights: Record<string, unknown>;
  playerNotes: Record<string, unknown>;
  inactivePlayerIds: Array<number | string>;
  seasonStartDate: string | null;
};

export const TEAM_BACKUP_DATA_KEYS: Array<keyof TeamBackupState> = [
  'players',
  'playdays',
  'lineups',
  'ratings',
  'training',
  'favoritePositions',
  'suitability',
  'positionPreferences',
  'publishedHalves',
  'keyPositionMultiplier',
  'allocationRules',
  'availability',
  'learningPlayerConfig',
  'satisfactionWeights',
  'playerNotes',
  'inactivePlayerIds',
  'seasonStartDate',
];

export function buildTeamBackupData(state: TeamBackupState): TeamBackupState {
  return Object.fromEntries(
    TEAM_BACKUP_DATA_KEYS.map((key) => [key, state[key]])
  ) as TeamBackupState;
}

export function isSafeFullBackupDatabase(database: unknown): database is {
  teams: unknown[];
  rugby_data: unknown[];
  players: unknown[];
  team_players: unknown[];
  coach_settings: unknown[];
} {
  if (!database || typeof database !== 'object') return false;
  const candidate = database as Record<string, unknown>;
  return ['teams', 'rugby_data', 'players', 'team_players', 'coach_settings']
    .every((key) => Array.isArray(candidate[key]));
}
