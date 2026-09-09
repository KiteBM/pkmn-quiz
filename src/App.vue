<script setup lang="ts">
import { useQuizStore } from './stores/quiz';
import StartView from './components/StartView.vue';
import QuizView from './components/QuizView.vue';

const store = useQuizStore();
</script>

<template>
  <StartView v-if="store.screen === 'start'" />
  <QuizView v-else />
</template>
