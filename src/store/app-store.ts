import { create } from 'zustand';
import type { Screen } from '../types/index.ts';

interface AppState {
  screen: Screen;
  selectedWorldId: string | null;
  selectedLevelId: string | null;
  showLevelComplete: boolean;
  transition: 'none' | 'fade-in' | 'fade-out';

  setScreen: (screen: Screen) => void;
  selectWorld: (worldId: string) => void;
  selectLevel: (levelId: string) => void;
  setShowLevelComplete: (show: boolean) => void;
  setTransition: (t: 'none' | 'fade-in' | 'fade-out') => void;
  navigateTo: (screen: Screen) => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'main_menu',
  selectedWorldId: null,
  selectedLevelId: null,
  showLevelComplete: false,
  transition: 'none',

  setScreen: (screen) => set({ screen }),
  selectWorld: (worldId) => set({ selectedWorldId: worldId }),
  selectLevel: (levelId) => set({ selectedLevelId: levelId }),
  setShowLevelComplete: (show) => set({ showLevelComplete: show }),
  setTransition: (t) => set({ transition: t }),

  navigateTo: (screen) => {
    set({ transition: 'fade-out' });
    setTimeout(() => {
      set({ screen, transition: 'fade-in' });
      setTimeout(() => {
        set({ transition: 'none' });
      }, 300);
    }, 200);
  },
}));
