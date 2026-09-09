<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  kind: 'countup' | 'countdown';
  elapsedMs: number;
  limitMs: number | null;
}>();

const displayMs = computed(() => {
  if (props.kind === 'countdown') {
    return Math.max(0, (props.limitMs ?? 0) - props.elapsedMs);
  }
  return props.elapsedMs;
});

const formatted = computed(() => {
  const totalSeconds = Math.ceil(displayMs.value / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});

const isWarning = computed(() => props.kind === 'countdown' && displayMs.value <= 30_000);
</script>

<template>
  <div class="timer" :class="{ warning: isWarning }">{{ formatted }}</div>
</template>

<style scoped>
.timer {
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.timer.warning {
  color: #c62828;
}
</style>
