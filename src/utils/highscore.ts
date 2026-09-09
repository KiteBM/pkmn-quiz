import type { Mode } from '../types';
import type { Selection } from './generations';
import { selectionKey } from './generations';

export type Outcome = 'completed' | 'timedOut' | 'gaveUp';

export interface HighscoreEntry {
  outcome: Outcome;
  timeMs?: number;
  solvedCount?: number;
  total: number;
  achievedAt: string;
}

export type HighscoreMap = Record<string, HighscoreEntry>;

const STORAGE_KEY = 'pokequiz:highscores';

export function highscoreKey(
  selection: Selection,
  mode: Mode,
  hardmode: boolean,
  fuzzy: boolean
): string {
  return `${selectionKey(selection)}:${mode}:${hardmode ? 'hard' : 'normal'}:${fuzzy ? 'fuzzy' : 'exact'}`;
}

function migrateKey(key: string): string {
  // Pre-fuzzy-mode keys had only 3 segments (selection:mode:hardmode); they were
  // all "exact" matching since fuzzy mode didn't exist yet.
  return key.split(':').length === 3 ? `${key}:exact` : key;
}

function loadAll(): HighscoreMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HighscoreMap;

    let didMigrate = false;
    const migrated: HighscoreMap = {};
    for (const [key, entry] of Object.entries(parsed)) {
      const newKey = migrateKey(key);
      if (newKey !== key) didMigrate = true;
      if (isBetter(entry, migrated[newKey])) {
        migrated[newKey] = entry;
      }
    }

    if (didMigrate) saveAll(migrated);
    return migrated;
  } catch {
    return {};
  }
}

function saveAll(map: HighscoreMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — highscores just won't persist
  }
}

export function getHighscore(key: string): HighscoreEntry | undefined {
  return loadAll()[key];
}

export function isBetter(candidate: HighscoreEntry, current?: HighscoreEntry): boolean {
  if (!current) return true;
  const candidateDone = candidate.outcome === 'completed';
  const currentDone = current.outcome === 'completed';
  if (candidateDone && !currentDone) return true;
  if (!candidateDone && currentDone) return false;
  if (candidateDone) return candidate.timeMs! < current.timeMs!;
  return candidate.solvedCount! > current.solvedCount!;
}

export function saveIfBetter(
  key: string,
  candidate: Omit<HighscoreEntry, 'achievedAt'>
): boolean {
  const all = loadAll();
  const current = all[key];
  const entry: HighscoreEntry = { ...candidate, achievedAt: new Date().toISOString() };
  if (isBetter(entry, current)) {
    all[key] = entry;
    saveAll(all);
    return true;
  }
  return false;
}
