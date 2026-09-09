<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuizStore } from '../stores/quiz';
import type { Selection } from '../utils/generations';
import type { Mode, DisplayMode, LayoutDirection } from '../types';
import { highscoreKey, getHighscore } from '../utils/highscore';
import IconButton from './IconButton.vue';

const store = useQuizStore();

const mode = ref<Mode>('casual');
const hardmode = ref(false);
const displayMode = ref<DisplayMode>('both');
const layoutDirection = ref<LayoutDirection>('row');
const soundEnabled = ref(false);
const hintsEnabled = ref(false);

const displayModes: { value: DisplayMode; label: string }[] = [
  { value: 'both', label: 'Bild + Name' },
  { value: 'name', label: 'Nur Name' },
  { value: 'image', label: 'Nur Bild' },
];

const generations: { sel: Selection; label: string }[] = [
  { sel: 1, label: 'Gen 1' },
  { sel: 2, label: 'Gen 2' },
  { sel: 3, label: 'Gen 3' },
  { sel: 4, label: 'Gen 4' },
  { sel: 5, label: 'Gen 5' },
  { sel: 6, label: 'Gen 6' },
  { sel: 7, label: 'Gen 7' },
  { sel: 8, label: 'Gen 8' },
  { sel: 9, label: 'Gen 9' },
  { sel: 'all', label: 'Alle' },
];

function bestFor(sel: Selection) {
  return getHighscore(highscoreKey(sel, mode.value, hardmode.value));
}

function formatBest(sel: Selection): string | null {
  const best = bestFor(sel);
  if (!best) return null;
  if (best.outcome === 'completed' && best.timeMs !== undefined) {
    const totalSeconds = Math.floor(best.timeMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `Beste Zeit: ${m}:${String(s).padStart(2, '0')}`;
  }
  return `Beste: ${best.solvedCount}/${best.total}`;
}

const selections = computed(() => generations);

function start(sel: Selection) {
  store.selectAndStart(
    sel,
    mode.value,
    hardmode.value,
    displayMode.value,
    layoutDirection.value,
    soundEnabled.value,
    hintsEnabled.value
  );
}
</script>

<template>
  <div class="start">
    <h1>Pokémon Quiz</h1>

    <div class="options">
      <label class="switch">
        <span :class="{ active: mode === 'casual' }">Casual</span>
        <input
          type="checkbox"
          :checked="mode === 'timeTrial'"
          @change="mode = ($event.target as HTMLInputElement).checked ? 'timeTrial' : 'casual'"
        />
        <span :class="{ active: mode === 'timeTrial' }">Time Trial</span>
      </label>

      <label class="checkbox-option">
        <input type="checkbox" v-model="hardmode" />
        Hardmode
      </label>

      <label class="checkbox-option">
        <input type="checkbox" v-model="soundEnabled" />
        Sound
      </label>

      <label class="checkbox-option">
        <input type="checkbox" v-model="hintsEnabled" />
        Hints
      </label>
    </div>

    <div class="display-modes">
      <button
        v-for="dm in displayModes"
        :key="dm.value"
        type="button"
        class="display-mode-button"
        :class="{ active: displayMode === dm.value }"
        @click="displayMode = dm.value"
      >
        {{ dm.label }}
      </button>
    </div>

    <div class="layout-toggle">
      <span>Reihenfolge:</span>
      <IconButton
        :label="layoutDirection === 'row' ? 'Links nach rechts (zu Oben nach unten wechseln)' : 'Oben nach unten (zu Links nach rechts wechseln)'"
        @click="layoutDirection = layoutDirection === 'row' ? 'column' : 'row'"
      >{{ layoutDirection === 'row' ? '→' : '↓' }}</IconButton>
    </div>

    <div class="generations">
      <button
        v-for="g in selections"
        :key="g.sel"
        type="button"
        class="gen-button"
        @click="start(g.sel)"
      >
        <span class="gen-label">{{ g.label }}</span>
        <span v-if="formatBest(g.sel)" class="gen-best">{{ formatBest(g.sel) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.start {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

h1 {
  text-align: center;
}

.options {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.switch span {
  color: #999;
}

.switch span.active {
  color: #1a1a1a;
  font-weight: 600;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.display-modes {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.display-mode-button {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #d0d0d8;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  color: #666;
}

.display-mode-button.active {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
  font-weight: 600;
}

.layout-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.85rem;
}

.generations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.gen-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #d0d0d8;
  background: #fff;
  cursor: pointer;
}

.gen-button:hover {
  background: #eee;
}

.gen-label {
  font-weight: 600;
}

.gen-best {
  font-size: 0.75rem;
  color: #888;
}
</style>
