// --- Simple Auto-Shake JS ---
(() => {
  const SHAKE_INTERVAL = 50;   // ms between updates
  const SHAKE_INTENSITY = 1;   // max pixels offset

  function updateShakes() {
    // Select all current letters with the shake effect
    const shakes = document.querySelectorAll('.effect-shake');
    shakes.forEach(el => {
      const x = (Math.random() * 2 - 1) * SHAKE_INTENSITY;
      const y = (Math.random() * 2 - 1) * SHAKE_INTENSITY;
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.rotate = `${x * 2}deg`
    });
  }

  setInterval(updateShakes, SHAKE_INTERVAL);
})();