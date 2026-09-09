<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuizStore } from '../stores/quiz';
import { useTimer } from '../composables/useTimer';
import PokedexSlot from './PokedexSlot.vue';
import IconButton from './IconButton.vue';
import TimerDisplay from './TimerDisplay.vue';
import ResultsOverlay from './ResultsOverlay.vue';
import { playCry } from '../utils/sound';

const store = useQuizStore();
const timer = useTimer(store);
const inputEl = ref<HTMLInputElement | null>(null);
const gridEl = ref<HTMLElement | null>(null);
const columnCount = ref(1);
let resizeObserver: ResizeObserver | null = null;

const padWidth = computed(() => {
  const maxId = Math.max(...store.entries.map((e) => e.id));
  return String(maxId).length;
});

const columnModeRows = computed(() => Math.max(1, Math.ceil(store.entries.length / columnCount.value)));

function gridPosition(index: number) {
  if (store.layoutDirection !== 'column') return undefined;
  const rows = columnModeRows.value;
  const col = Math.floor(index / rows);
  const row = index % rows;
  return { gridColumn: String(col + 1), gridRow: String(row + 1) };
}

function updateColumnCount() {
  if (!gridEl.value) return;
  const cols = getComputedStyle(gridEl.value)
    .gridTemplateColumns.trim()
    .split(/\s+/)
    .filter(Boolean).length;
  columnCount.value = cols || 1;
}

async function focusInput() {
  await nextTick();
  inputEl.value?.focus();
}

onMounted(() => {
  timer.start();
  focusInput();
  updateColumnCount();
  resizeObserver = new ResizeObserver(() => updateColumnCount());
  if (gridEl.value) resizeObserver.observe(gridEl.value);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

watch(
  () => store.displayMode,
  () => nextTick(updateColumnCount)
);

watch(
  () => store.lastSolvedId,
  (id) => {
    if (id === null) return;
    nextTick(() => {
      const el = document.getElementById(`pokedex-slot-${id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 900);
    });
  }
);

function onInput(event: Event) {
  store.handleInput((event.target as HTMLInputElement).value);
}

function handleReset() {
  store.resetProgress();
  timer.start();
  focusInput();
}

function handleBack() {
  store.backToStart();
}

function handleRetry() {
  handleReset();
}

function togglePause() {
  if (store.result) return;
  if (store.timer.isPaused) {
    store.timer.isPaused = false;
    timer.start();
    focusInput();
  } else {
    store.timer.isPaused = true;
    timer.stop();
  }
}

function handleGiveUp() {
  store.giveUp();
}

function handleHint(id: number) {
  playCry(id);
}
</script>

<template>
  <div class="quiz">
    <div class="header">
      <div class="toolbar">
        <IconButton label="Zurück" @click="handleBack">←</IconButton>
        <IconButton label="Zurücksetzen" @click="handleReset">⟳</IconButton>
        <IconButton
          :label="store.timer.isPaused ? 'Fortsetzen' : 'Pausieren'"
          :disabled="!!store.result"
          @click="togglePause"
        >{{ store.timer.isPaused ? '▶' : '⏸' }}</IconButton>
        <IconButton
          label="Aufgeben"
          variant="danger"
          :disabled="!!store.result"
          @click="handleGiveUp"
        >🏳️</IconButton>
        <div class="spacer" />
        <span class="progress">{{ store.solvedCount }} / {{ store.total }}</span>
        <TimerDisplay :kind="store.timer.kind" :elapsed-ms="store.timer.elapsedMs" :limit-ms="store.timer.limitMs" />
      </div>

      <input
        ref="inputEl"
        class="guess-input"
        type="text"
        :value="store.result?.status === 'gaveUp' ? 'Aufgegeben' : store.input"
        :readonly="store.result?.status === 'gaveUp'"
        :disabled="store.timer.isExpired || store.timer.isPaused || (!!store.result && store.result.status !== 'gaveUp')"
        :placeholder="store.timer.isPaused ? 'Pausiert…' : 'Pokémon eingeben…'"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        @input="onInput"
      />
    </div>

    <div class="grid-scroll">
      <div ref="gridEl" class="grid" :class="`mode-${store.displayMode}`">
        <PokedexSlot
          v-for="(entry, index) in store.entries"
          :key="entry.id"
          :id="entry.id"
          :style="gridPosition(index)"
          :solved="store.solvedIds.has(entry.id)"
          :revealed="store.revealedIds.has(entry.id)"
          :name-en="entry.nameEn"
          :name-de="entry.nameDe"
          :pad-width="padWidth"
          :display-mode="store.displayMode"
          :hints-enabled="store.hintsEnabled"
          @hint="handleHint"
        />
      </div>
    </div>

    <ResultsOverlay
      v-if="store.result && store.result.status !== 'gaveUp'"
      :result="store.result"
      @retry="handleRetry"
      @back="handleBack"
      @reveal="store.revealAnswers"
    />
  </div>
</template>

<style scoped>
.quiz {
  height: 100vh;
  max-width: 1800px;
  margin: 0 auto;
  padding: 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spacer {
  flex: 1;
}

.progress {
  color: #666;
  font-variant-numeric: tabular-nums;
}

.guess-input {
  width: 100%;
  max-width: 32rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #d0d0d8;
  font-size: 1.1rem;
  box-sizing: border-box;
}

.guess-input:read-only {
  color: #a15c00;
  font-style: italic;
  background: #fff4e5;
  border-color: #ffcc80;
}

.grid-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.5rem;
  padding-bottom: 1rem;
}

.grid.mode-image {
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
}

.grid.mode-both {
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
}
</style>
