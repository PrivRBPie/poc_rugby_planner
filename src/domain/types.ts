export type PositionId = 1 | 2 | 3 | 4 | 5 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type Suitability = 0 | 1 | 2 | 3 | 10;
export type SkillRating = 1 | 2 | 3 | 4 | 5;

export interface PlayerPositionProfile {
  suitability: Suitability;
  trained: boolean;
  skillRating?: SkillRating;
}

export interface PositionPreferences {
  preference1?: PositionId;
  preference2?: PositionId;
}
