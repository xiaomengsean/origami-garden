import { create } from 'zustand';
import type { FoldAction, GridState, LevelDefinition, PlantType } from '../types/index.ts';
import { applyFold, checkWin, createGrid } from '../game/grid.ts';

interface GameState {
  currentLevel: LevelDefinition | null;
  grid: GridState | null;
  target: (PlantType | null)[][] | null;
  foldHistory: GridState[];
  foldCount: number;
  isComplete: boolean;
  stars: number;
  isAnimating: boolean;
  elapsedMs: number;
  timerStart: number | null;
  pendingFold: FoldAction | null;

  loadLevel: (level: LevelDefinition) => void;
  executeFold: (fold: FoldAction) => void;
  undo: () => void;
  reset: () => void;
  setAnimating: (animating: boolean) => void;
  completeFoldAnimation: () => void;
  tick: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentLevel: null,
  grid: null,
  target: null,
  foldHistory: [],
  foldCount: 0,
  isComplete: false,
  stars: 0,
  isAnimating: false,
  elapsedMs: 0,
  timerStart: null,
  pendingFold: null,

  loadLevel: (level) => {
    const grid = createGrid(level.tiles);
    set({
      currentLevel: level,
      grid,
      target: level.target,
      foldHistory: [],
      foldCount: 0,
      isComplete: false,
      stars: 0,
      isAnimating: false,
      elapsedMs: 0,
      timerStart: Date.now(),
      pendingFold: null,
    });
  },

  executeFold: (fold) => {
    const { grid, isAnimating, isComplete, currentLevel, foldCount } = get();
    if (!grid || isAnimating || isComplete || !currentLevel) return;
    if (currentLevel.maxFolds > 0 && foldCount >= currentLevel.maxFolds) return;

    set({
      pendingFold: fold,
      isAnimating: true,
    });
  },

  completeFoldAnimation: () => {
    const { grid, pendingFold, foldHistory, foldCount, currentLevel, target } = get();
    if (!grid || !pendingFold || !currentLevel || !target) return;

    const newGrid = applyFold(grid, pendingFold);
    const newFoldCount = foldCount + 1;
    const won = checkWin(newGrid, target);

    let stars = 0;
    if (won) {
      stars = 1;
      if (currentLevel.maxFolds > 0 && newFoldCount <= currentLevel.maxFolds) {
        stars = 2;
      }
      if (newFoldCount <= currentLevel.minFolds) {
        stars = 3;
      }
    }

    set({
      grid: newGrid,
      foldHistory: [...foldHistory, grid],
      foldCount: newFoldCount,
      isComplete: won,
      stars,
      isAnimating: false,
      pendingFold: null,
    });
  },

  undo: () => {
    const { foldHistory, isAnimating, isComplete } = get();
    if (isAnimating || isComplete || foldHistory.length === 0) return;

    const previousGrid = foldHistory[foldHistory.length - 1];
    set({
      grid: previousGrid,
      foldHistory: foldHistory.slice(0, -1),
      foldCount: foldHistory.length - 1,
    });
  },

  reset: () => {
    const { currentLevel } = get();
    if (currentLevel) {
      const grid = createGrid(currentLevel.tiles);
      set({
        grid,
        foldHistory: [],
        foldCount: 0,
        isComplete: false,
        stars: 0,
        isAnimating: false,
        elapsedMs: 0,
        timerStart: Date.now(),
        pendingFold: null,
      });
    }
  },

  setAnimating: (animating) => set({ isAnimating: animating }),

  tick: () => {
    const { timerStart, isComplete } = get();
    if (timerStart && !isComplete) {
      set({ elapsedMs: Date.now() - timerStart });
    }
  },
}));
