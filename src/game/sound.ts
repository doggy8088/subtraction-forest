let context: AudioContext | undefined;
export function playSound(kind: 'tap' | 'exchange' | 'success') {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    const notes =
      kind === 'success'
        ? [523.25, 659.25, 783.99, 1046.5]
        : kind === 'exchange'
          ? [392, 587.33]
          : [523.25];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const time = context!.currentTime + index * 0.12;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.4);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    /* Audio is optional; learning stays available. */
  }
}
