<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    variant?: 'default' | 'danger';
    disabled?: boolean;
  }>(),
  {
    variant: 'default',
    disabled: false,
  }
);

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :class="variant"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #d0d0d8;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
}

.icon-button:hover {
  background: #eee;
}

.icon-button.danger {
  border-color: #f5b5b5;
  background: #fdecec;
}

.icon-button.danger:hover {
  background: #fbd5d5;
}

.icon-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-button:disabled:hover {
  background: #fff;
}

.icon-button.danger:disabled:hover {
  background: #fdecec;
}
</style>
