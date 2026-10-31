export type PlantType =
  | 'cherry_blossom'
  | 'fern'
  | 'lavender'
  | 'sunflower'
  | 'blue_lotus'
  | 'succulent'
  | 'maple_leaf'
  | 'camellia'
  | 'daffodil'
  | 'clover'
  | 'hibiscus'
  | 'palm'
  | 'ginkgo'
  | 'chrysanthemum'
  | 'pine'
  | 'holly'
  | 'bee_balm'
  | 'honeysuckle'
  | 'caterpillar'
  | 'leaf';

export type GrowthPhase = 'seedling' | 'flowering' | 'fruiting';

export type SpecialTileType =
  | 'transparent'
  | 'sticky'
  | 'wildcard'
  | 'magnetic'
  | 'mirror';

export interface Tile {
  plant: PlantType;
  special?: SpecialTileType;
  locked?: boolean;
}

export type FoldDirection = 'up' | 'down' | 'left' | 'right';

export interface FoldAction {
  direction: FoldDirection;
  axisIndex: number;
}

export interface GridState {
  rows: number;
  cols: number;
  layers: Tile[][][]; // layers[row][col] = stack of tiles (top = last)
}

export interface LevelDefinition {
  id: string;
  worldId: string;
  levelNumber: number;
  gridRows: number;
  gridCols: number;
  tiles: (PlantType | null)[][];
  target: (PlantType | null)[][];
  targetRows: number;
  targetCols: number;
  maxFolds: number;
  minFolds: number;
  specialTiles?: { row: number; col: number; type: SpecialTileType }[];
  tutorial?: TutorialStep[];
}

export interface TutorialStep {
  message: string;
  highlightDirection?: FoldDirection;
  highlightAxis?: number;
}

export interface WorldDefinition {
  id: string;
  name: string;
  subtitle: string;
  plants: PlantType[];
  musicTrack: string;
  ambientTrack: string;
  color: string;
  bgGradient: [string, string];
  levelCount: number;
  unlockStars: number;
}

export interface PlayerProgress {
  levelStars: Record<string, number>; // levelId -> stars (0-3)
  totalStars: number;
  plantGrowth: Record<PlantType, GrowthPhase>;
  unlockedWorlds: string[];
  achievements: string[];
  gardenDecorations: string[];
  currentWorld: string;
  hintsRemaining: number;
  dailyChallengeDate?: string;
  dailyChallengeStars?: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  hapticEnabled: boolean;
  showTimer: boolean;
  selectedPaperTexture: string;
}

export type Screen =
  | 'main_menu'
  | 'world_select'
  | 'level_select'
  | 'gameplay'
  | 'my_garden'
  | 'collection'
  | 'settings'
  | 'level_complete';

export interface PlantInfo {
  type: PlantType;
  displayName: string;
  family: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animations: {
    seedling: string;
    flowering: string;
    fruiting: string;
  };
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}
