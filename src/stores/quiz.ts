import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { POKEDEX, type PokedexEntry } from '../data/pokedex';
import { GENERATION_RANGES, type Selection } from '../utils/generations';
import { normalizeName } from '../utils/normalize';
import { highscoreKey, saveIfBetter, getHighscore } from '../utils/highscore';
import { isFuzzyMatch, fuzzyDistance } from '../utils/fuzzyMatch';
import { playCry } from '../utils/sound';
import type { Mode, Screen, QuizResult, DisplayMode, LayoutDirection } from '../types';

function getEntriesForSelection(selection: Selection): PokedexEntry[] {
  if (selection === 'all') return POKEDEX;
  const [lo, hi] = GENERATION_RANGES[selection];
  return POKEDEX.filter((e) => e.id >= lo && e.id <= hi);
}

interface TimerState {
  kind: 'countup' | 'countdown';
  startedAt: number | null;
  elapsedMs: number;
  limitMs: number | null;
  isRunning: boolean;
  isExpired: boolean;
  isPaused: boolean;
}

export const useQuizStore = defineStore('quiz', () => {
  const screen = ref<Screen>('start');
  const selection = ref<Selection>(1);
  const mode = ref<Mode>('casual');
  const hardmode = ref(false);
  const displayMode = ref<DisplayMode>('name');
  const layoutDirection = ref<LayoutDirection>('row');
  const soundEnabled = ref(false);
  const hintsEnabled = ref(false);
  const fuzzyEnabled = ref(false);

  const entries = ref<PokedexEntry[]>([]);
  const solvedIds = ref<Set<number>>(new Set());
  const nextExpectedIndex = ref(0);
  const input = ref('');
  const lastSolvedId = ref<number | null>(null);
  const revealedIds = ref<Set<number>>(new Set());

  const timer = reactive<TimerState>({
    kind: 'countup',
    startedAt: null,
    elapsedMs: 0,
    limitMs: null,
    isRunning: false,
    isExpired: false,
    isPaused: false,
  });

  const result = ref<QuizResult | null>(null);

  let lookup: Map<string, number> = new Map();

  const total = computed(() => entries.value.length);
  const solvedCount = computed(() => solvedIds.value.size);
  const currentHighscoreKey = computed(() =>
    highscoreKey(selection.value, mode.value, hardmode.value, fuzzyEnabled.value)
  );
  const currentHighscore = computed(() => getHighscore(currentHighscoreKey.value));

  function buildLookup(list: PokedexEntry[]) {
    const map = new Map<string, number>();
    for (const entry of list) {
      map.set(normalizeName(entry.nameEn), entry.id);
      map.set(normalizeName(entry.nameDe), entry.id);
    }
    return map;
  }

  function selectAndStart(
    sel: Selection,
    m: Mode,
    hard: boolean,
    disp: DisplayMode,
    dir: LayoutDirection,
    sound: boolean,
    hints: boolean,
    fuzzy: boolean
  ) {
    selection.value = sel;
    mode.value = m;
    hardmode.value = hard;
    displayMode.value = disp;
    layoutDirection.value = dir;
    soundEnabled.value = sound;
    hintsEnabled.value = hints;
    fuzzyEnabled.value = fuzzy;

    const list = getEntriesForSelection(sel);
    entries.value = list;
    lookup = buildLookup(list);

    solvedIds.value = new Set();
    revealedIds.value = new Set();
    nextExpectedIndex.value = 0;
    input.value = '';
    lastSolvedId.value = null;
    result.value = null;

    timer.kind = m === 'timeTrial' ? 'countdown' : 'countup';
    timer.limitMs = m === 'timeTrial' ? Math.ceil(list.length / 50) * 5 * 60 * 1000 : null;
    timer.elapsedMs = 0;
    timer.startedAt = null;
    timer.isRunning = false;
    timer.isExpired = false;
    timer.isPaused = false;

    screen.value = 'quiz';
  }

  function solve(id: number) {
    solvedIds.value.add(id);
    lastSolvedId.value = id;
    if (soundEnabled.value) {
      playCry(id);
    }
    checkCompletion();
  }

  function handleInput(raw: string) {
    input.value = raw;
    if (timer.isExpired || timer.isPaused || result.value) return;
    const norm = normalizeName(raw);
    if (norm === '') return;

    if (hardmode.value) {
      const target = entries.value[nextExpectedIndex.value];
      if (!target) return;
      const targetNorms = [normalizeName(target.nameEn), normalizeName(target.nameDe)];
      const matched =
        targetNorms.includes(norm) ||
        (fuzzyEnabled.value && targetNorms.some((t) => isFuzzyMatch(norm, t)));
      if (matched) {
        solve(target.id);
        nextExpectedIndex.value += 1;
        input.value = '';
      }
    } else {
      let id = lookup.get(norm);
      if (id === undefined && fuzzyEnabled.value) {
        id = findFuzzyMatchId(norm);
      }
      if (id !== undefined && !solvedIds.value.has(id)) {
        solve(id);
        input.value = '';
      }
    }
  }

  function findFuzzyMatchId(norm: string): number | undefined {
    let bestId: number | undefined;
    let bestDist = Infinity;
    for (const entry of entries.value) {
      if (solvedIds.value.has(entry.id)) continue;
      for (const name of [normalizeName(entry.nameEn), normalizeName(entry.nameDe)]) {
        if (!isFuzzyMatch(norm, name)) continue;
        const dist = fuzzyDistance(norm, name);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = entry.id;
        }
      }
    }
    return bestId;
  }

  function checkCompletion() {
    if (solvedIds.value.size === entries.value.length && !result.value) {
      timer.isRunning = false;
      const isNewBest = saveIfBetter(currentHighscoreKey.value, {
        outcome: 'completed',
        timeMs: timer.elapsedMs,
        total: total.value,
      });
      result.value = {
        status: 'completed',
        timeMs: timer.elapsedMs,
        solvedCount: solvedIds.value.size,
        total: total.value,
        isNewBest,
      };
    }
  }

  function expireTimeTrial() {
    if (result.value) return;
    timer.isExpired = true;
    timer.isRunning = false;
    const isNewBest = saveIfBetter(currentHighscoreKey.value, {
      outcome: 'timedOut',
      solvedCount: solvedIds.value.size,
      total: total.value,
    });
    result.value = {
      status: 'timedOut',
      solvedCount: solvedIds.value.size,
      total: total.value,
      isNewBest,
    };
  }

  function revealAnswers() {
    for (const entry of entries.value) {
      if (!solvedIds.value.has(entry.id)) {
        revealedIds.value.add(entry.id);
      }
    }
  }

  function giveUp() {
    if (result.value) return;
    timer.isRunning = false;
    timer.isPaused = false;
    for (const entry of entries.value) {
      if (!solvedIds.value.has(entry.id)) {
        revealedIds.value.add(entry.id);
      }
    }
    const isNewBest = saveIfBetter(currentHighscoreKey.value, {
      outcome: 'gaveUp',
      solvedCount: solvedIds.value.size,
      total: total.value,
    });
    result.value = {
      status: 'gaveUp',
      solvedCount: solvedIds.value.size,
      total: total.value,
      isNewBest,
    };
  }

  function resetProgress() {
    solvedIds.value = new Set();
    revealedIds.value = new Set();
    nextExpectedIndex.value = 0;
    input.value = '';
    lastSolvedId.value = null;
    result.value = null;
    timer.elapsedMs = 0;
    timer.startedAt = null;
    timer.isRunning = false;
    timer.isExpired = false;
    timer.isPaused = false;
  }

  function backToStart() {
    timer.isRunning = false;
    screen.value = 'start';
  }

  return {
    screen,
    selection,
    mode,
    hardmode,
    displayMode,
    layoutDirection,
    soundEnabled,
    hintsEnabled,
    fuzzyEnabled,
    entries,
    solvedIds,
    revealedIds,
    nextExpectedIndex,
    input,
    lastSolvedId,
    timer,
    result,
    total,
    solvedCount,
    currentHighscore,
    selectAndStart,
    handleInput,
    resetProgress,
    backToStart,
    expireTimeTrial,
    revealAnswers,
    giveUp,
  };
});
