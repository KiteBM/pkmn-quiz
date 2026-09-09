<script setup lang="ts">
import { computed } from 'vue';
import type { QuizResult } from '../types';

const props = defineProps<{
  result: QuizResult;
}>();

const emit = defineEmits<{
  retry: [];
  back: [];
  reveal: [];
}>();

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const title = computed(() => {
  if (props.result.status === 'completed') return 'Geschafft!';
  if (props.result.status === 'gaveUp') return 'Aufgegeben';
  return 'Zeit abgelaufen';
});
</script>

<template>
  <div class="overlay">
    <div class="card">
      <h2>{{ title }}</h2>
      <p class="score">{{ result.solvedCount }} von {{ result.total }} richtig</p>
      <p v-if="result.status === 'completed' && result.timeMs !== undefined" class="time">
        Zeit: {{ formatTime(result.timeMs) }}
      </p>
      <p v-if="result.isNewBest" class="best">Neuer Rekord!</p>

      <div class="actions">
        <button v-if="result.status === 'timedOut' && result.solvedCount < result.total" type="button" @click="emit('reveal')">
          Antworten anzeigen
        </button>
        <button type="button" @click="emit('retry')">Nochmal versuchen</button>
        <button type="button" @click="emit('back')">Zurück zum Start</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  min-width: 280px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.score {
  font-size: 1.1rem;
}

.time {
  font-variant-numeric: tabular-nums;
}

.best {
  color: #2e7d32;
  font-weight: 600;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.actions button {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid #d0d0d8;
  background: #f4f4f7;
  cursor: pointer;
}

.actions button:hover {
  background: #e8e8ee;
}
</style>
