import confetti from 'canvas-confetti';

// Sophisticated artistic watercolor palette
const WATERCOLOR_COLORS = [
  '#5A5A40', // Deep olive/sage
  '#D9A066', // Warm amber/ochre
  '#87A987', // Soft leaf green
  '#E07A5F', // Terracotta rose
  '#F4A261', // Peach gold
  '#3D5A80', // Cobalt water
  '#98C1D9', // Sky wash
  '#EE6C4D', // Coral flame
];

/**
 * Triggers a multi-stage celebration confetti animation with warm watercolor tones
 */
export function fireWatercolorConfetti(isGrandFinale = false) {
  try {
    if (typeof window === 'undefined') return;

    if (isGrandFinale) {
      // Grand Finale Multi-Burst (For Course Graduation or 3-Lesson Milestone)
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 35,
        spread: 360,
        ticks: 80,
        zIndex: 9999,
        colors: WATERCOLOR_COLORS,
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Burst from both corners
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
      return;
    }

    // Standard Lesson Pass Celebration
    // 1. Center Burst
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: WATERCOLOR_COLORS,
      ticks: 200,
      gravity: 1.1,
      scalar: 1.1,
      zIndex: 9999,
    });

    // 2. Left side sparkle stream
    setTimeout(() => {
      confetti({
        particleCount: 35,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: 0.7 },
        colors: WATERCOLOR_COLORS,
        ticks: 180,
        zIndex: 9999,
      });
    }, 150);

    // 3. Right side sparkle stream
    setTimeout(() => {
      confetti({
        particleCount: 35,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.7 },
        colors: WATERCOLOR_COLORS,
        ticks: 180,
        zIndex: 9999,
      });
    }, 300);
  } catch (err) {
    console.error('Confetti animation error:', err);
  }
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
