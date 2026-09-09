import { onMounted, onUnmounted } from 'vue';
import type { useQuizStore } from '../stores/quiz';

export function useTimer(store: ReturnType<typeof useQuizStore>) {
  let intervalId: number | undefined;

  function recompute() {
    if (!store.timer.isRunning || store.timer.startedAt === null) return;
    const elapsed = Date.now() - store.timer.startedAt;
    if (store.timer.kind === 'countdown') {
      const remaining = Math.max(0, (store.timer.limitMs ?? 0) - elapsed);
      store.timer.elapsedMs = elapsed;
      if (remaining <= 0 && !store.timer.isExpired) {
        store.expireTimeTrial();
      }
    } else {
      store.timer.elapsedMs = elapsed;
    }
  }

  function start() {
    store.timer.startedAt = Date.now() - store.timer.elapsedMs;
    store.timer.isRunning = true;
    intervalId = window.setInterval(recompute, 250);
  }

  function stop() {
    store.timer.isRunning = false;
    if (intervalId) clearInterval(intervalId);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') recompute();
  }

  onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange));
  onUnmounted(() => {
    stop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return { start, stop };
}
