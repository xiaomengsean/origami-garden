import { create } from 'zustand';
import type { GameSettings } from '../types/index.ts';

const STORAGE_KEY = 'origami-garden-settings';

function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* use defaults */ }

  return {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    ambientVolume: 0.4,
    hapticEnabled: true,
    showTimer: false,
    selectedPaperTexture: 'classic',
  };
}

interface SettingsState extends GameSettings {
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setAmbientVolume: (v: number) => void;
  setHapticEnabled: (v: boolean) => void;
  setShowTimer: (v: boolean) => void;
  setPaperTexture: (t: string) => void;
}

function save(s: GameSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* */ }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  setMusicVolume: (v) => { set({ musicVolume: v }); save({ ...get(), musicVolume: v }); },
  setSfxVolume: (v) => { set({ sfxVolume: v }); save({ ...get(), sfxVolume: v }); },
  setAmbientVolume: (v) => { set({ ambientVolume: v }); save({ ...get(), ambientVolume: v }); },
  setHapticEnabled: (v) => { set({ hapticEnabled: v }); save({ ...get(), hapticEnabled: v }); },
  setShowTimer: (v) => { set({ showTimer: v }); save({ ...get(), showTimer: v }); },
  setPaperTexture: (t) => { set({ selectedPaperTexture: t }); save({ ...get(), selectedPaperTexture: t }); },
}));
