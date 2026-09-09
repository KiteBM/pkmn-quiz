<script setup lang="ts">
import { computed } from 'vue';
import type { DisplayMode } from '../types';

const props = defineProps<{
  id: number;
  solved: boolean;
  revealed: boolean;
  nameEn: string;
  nameDe: string;
  padWidth: number;
  displayMode: DisplayMode;
  hintsEnabled: boolean;
}>();

const emit = defineEmits<{
  hint: [id: number];
}>();

const paddedId = String(props.id).padStart(props.padWidth, '0');
const spriteUrl = computed(() => `/sprites/${props.id}.png`);

function onClick() {
  if (props.solved || props.revealed || !props.hintsEnabled) return;
  emit('hint', props.id);
}
</script>

<template>
  <div
    :id="`pokedex-slot-${id}`"
    class="slot"
    :class="[`mode-${displayMode}`, { solved, revealed, hintable: hintsEnabled && !solved && !revealed }]"
    @click="onClick"
  >
    <span class="number">{{ paddedId }}</span>
    <div v-if="solved || revealed" class="content">
      <img
        v-if="displayMode !== 'name'"
        class="sprite"
        :src="spriteUrl"
        :alt="nameEn"
        loading="lazy"
      />
      <div v-if="displayMode !== 'image'" class="names">
        <span class="name-de">{{ nameDe }}</span>
        <span class="name-en">{{ nameEn }}</span>
      </div>
    </div>
    <span v-else class="placeholder">?</span>
  </div>
</template>

<style scoped>
.slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
  min-height: 3rem;
  box-sizing: border-box;
}

.slot.mode-image {
  min-height: 3.5rem;
}

.slot.solved {
  background: #eefbf0;
  border-color: #b6e6c1;
}

.slot.revealed {
  background: #fff4e5;
  border-color: #ffcc80;
}

.slot.revealed .name-de {
  color: #a15c00;
}

.slot.hintable {
  cursor: pointer;
}

.slot.hintable:hover {
  border-color: #b0b0c0;
}

.slot.flash {
  animation: flash-highlight 0.9s ease;
}

@keyframes flash-highlight {
  0% {
    background: #fff3b0;
    border-color: #f5c518;
  }
}

.number {
  font-variant-numeric: tabular-nums;
  color: #888;
  flex-shrink: 0;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  min-width: 0;
}

.slot.mode-both .content {
  flex-direction: row;
  align-items: center;
}

.sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.slot.mode-both .sprite {
  width: 32px;
  height: 32px;
}

.names {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  overflow-wrap: anywhere;
  min-width: 0;
}

.name-de {
  font-weight: 600;
}

.name-en {
  font-size: 0.75rem;
  color: #888;
}

.placeholder {
  color: #ccc;
}
</style>
