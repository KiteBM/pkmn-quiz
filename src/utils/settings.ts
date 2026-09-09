import type { Mode, DisplayMode, LayoutDirection } from '../types';

export interface SavedSettings {
  mode: Mode;
  hardmode: boolean;
  displayMode: DisplayMode;
  layoutDirection: LayoutDirection;
  soundEnabled: boolean;
  hintsEnabled: boolean;
  fuzzyEnabled: boolean;
}

const STORAGE_KEY = 'pokequiz:settings';

const DEFAULT_SETTINGS: SavedSettings = {
  mode: 'casual',
  hardmode: false,
  displayMode: 'both',
  layoutDirection: 'row',
  soundEnabled: false,
  hintsEnabled: false,
  fuzzyEnabled: false,
};

export function loadSettings(): SavedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SavedSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: SavedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — settings just won't persist
  }
}
