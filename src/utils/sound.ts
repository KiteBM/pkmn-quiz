export function playCry(id: number): void {
  try {
    const audio = new Audio(`/cries/${id}.ogg`);
    void audio.play().catch(() => {
      // ignore playback failures (autoplay restrictions, missing file, etc.)
    });
  } catch {
    // ignore Audio construction failures
  }
}
