// Gentle Web Audio API sound synthesizer for soothing feedback
export const playZenBell = (frequency = 528, duration = 1.8) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    // Subtle vibrato
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.995, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Graceful fallback if audio is blocked
  }
};

export const playPassSound = () => {
  playZenBell(587.33, 1.2); // D5
  setTimeout(() => playZenBell(880, 1.8), 200); // A5
};

export const playWarmChime = () => {
  playZenBell(440, 1.0); // A4
};
