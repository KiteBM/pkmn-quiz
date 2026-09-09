// Keep a strong reference to in-flight/playing Audio elements — without this,
// a fire-and-forget `new Audio().play()` can be garbage collected mid-load or
// mid-playback, which shows up as "sometimes no sound" or a sound cutting off.
const activeAudios = new Set<HTMLAudioElement>();

export function playCry(id: number): void {
  try {
    const audio = new Audio(`/cries/${id}.ogg`);
    activeAudios.add(audio);

    const cleanup = () => activeAudios.delete(audio);
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', cleanup);

    void audio.play().catch(cleanup);
  } catch {
    // ignore Audio construction failures
  }
}
