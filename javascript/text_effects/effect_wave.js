// --- Wave Y-Axis JS ---
(() => {
  const WAVE_INTERVAL = 50;   // ms between updates
  const WAVE_AMPLITUDE = 5;   // max vertical movement in pixels
  const WAVE_SPEED = 0.1;    // how fast the wave moves

  let t = 0; // time counter

  function updateWave() {
    const letters = document.querySelectorAll('.effect-wave');
    letters.forEach((el, index) => {
      // Create a wave along the y-axis using sine
      const y = Math.sin(t + index * 0.3) * WAVE_AMPLITUDE;
      el.style.transform = `translateY(${y}px)`; // only move vertically
    });
    t += WAVE_SPEED;
  }

  setInterval(updateWave, WAVE_INTERVAL);
})();