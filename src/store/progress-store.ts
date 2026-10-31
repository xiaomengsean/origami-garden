import { create } from 'zustand';
import type { GrowthPhase, PlantType, PlayerProgress } from '../types/index.ts';
import { WORLDS } from '../game/plants.ts';
import { getLevelsForWorld } from '../levels/definitions.ts';

const STORAGE_KEY = 'origami-garden-progress';

function unlockWorldsForStars(progress: PlayerProgress): PlayerProgress {
  const unlockedWorlds = [...progress.unlockedWorlds];
  let changed = false;
  for (const world of WORLDS) {
    if (!unlockedWorlds.includes(world.id) && progress.totalStars >= world.unlockStars) {
      unlockedWorlds.push(world.id);
      changed = true;
    }
  }
  if (!changed) return progress;
  const next = { ...progress, unlockedWorlds };
  saveProgress(next);
  return next;
}

function loadProgress(): PlayerProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return unlockWorldsForStars(JSON.parse(saved));
  } catch { /* use defaults */ }

  return {
    levelStars: {},
    totalStars: 0,
    plantGrowth: {} as Record<PlantType, GrowthPhase>,
    unlockedWorlds: ['paper_playground'],
    achievements: [],
    gardenDecorations: [],
    currentWorld: 'paper_playground',
    hintsRemaining: 5,
  };
}

function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch { /* storage full or unavailable */ }
}

function getGrowthForStars(stars: number): GrowthPhase {
  if (stars >= 3) return 'fruiting';
  if (stars >= 2) return 'flowering';
  return 'seedling';
}

interface ProgressState extends PlayerProgress {
  completeLevel: (levelId: string, stars: number, plant: PlantType) => void;
  setCurrentWorld: (worldId: string) => void;
  useHint: () => boolean;
  addAchievement: (id: string) => void;
  getWorldStars: (worldId: string) => number;
  isWorldUnlocked: (worldId: string) => boolean;
  getPlantGrowth: (plant: PlantType) => GrowthPhase | null;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...loadProgress(),

  completeLevel: (levelId, stars, plant) => {
    const state = get();
    const existingStars = state.levelStars[levelId] || 0;
    if (stars <= existingStars) return;

    const newLevelStars = { ...state.levelStars, [levelId]: stars };
    const totalStars = Object.values(newLevelStars).reduce((a, b) => a + b, 0);

    const currentGrowth = state.plantGrowth[plant];
    const newGrowth = getGrowthForStars(stars);
    const growthOrder: GrowthPhase[] = ['seedling', 'flowering', 'fruiting'];
    const shouldUpgrade = !currentGrowth ||
      growthOrder.indexOf(newGrowth) > growthOrder.indexOf(currentGrowth);

    const newPlantGrowth = shouldUpgrade
      ? { ...state.plantGrowth, [plant]: newGrowth }
      : state.plantGrowth;

    const unlockedWorlds = [...state.unlockedWorlds];
    for (const world of WORLDS) {
      if (!unlockedWorlds.includes(world.id) && totalStars >= world.unlockStars) {
        unlockedWorlds.push(world.id);
      }
    }

    const newState: PlayerProgress = {
      levelStars: newLevelStars,
      totalStars,
      plantGrowth: newPlantGrowth,
      unlockedWorlds,
      achievements: state.achievements,
      gardenDecorations: state.gardenDecorations,
      currentWorld: state.currentWorld,
      hintsRemaining: state.hintsRemaining,
      dailyChallengeDate: state.dailyChallengeDate,
      dailyChallengeStars: state.dailyChallengeStars,
    };

    saveProgress(newState);
    set(newState);
  },

  setCurrentWorld: (worldId) => {
    set({ currentWorld: worldId });
    const state = get();
    saveProgress({
      levelStars: state.levelStars,
      totalStars: state.totalStars,
      plantGrowth: state.plantGrowth,
      unlockedWorlds: state.unlockedWorlds,
      achievements: state.achievements,
      gardenDecorations: state.gardenDecorations,
      currentWorld: worldId,
      hintsRemaining: state.hintsRemaining,
      dailyChallengeDate: state.dailyChallengeDate,
      dailyChallengeStars: state.dailyChallengeStars,
    });
  },

  useHint: () => {
    const { hintsRemaining } = get();
    if (hintsRemaining <= 0) return false;
    set({ hintsRemaining: hintsRemaining - 1 });
    return true;
  },

  addAchievement: (id) => {
    const { achievements } = get();
    if (achievements.includes(id)) return;
    set({ achievements: [...achievements, id] });
  },

  getWorldStars: (worldId) => {
    const { levelStars } = get();
    return getLevelsForWorld(worldId)
      .reduce((sum, level) => sum + (levelStars[level.id] || 0), 0);
  },

  isWorldUnlocked: (worldId) => {
    return get().unlockedWorlds.includes(worldId);
  },

  getPlantGrowth: (plant) => {
    return get().plantGrowth[plant] || null;
  },
}));
