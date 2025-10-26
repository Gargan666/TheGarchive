(() => {
  // 🔁 Load saved gameState from localStorage (if it exists)
  const savedState = JSON.parse(localStorage.getItem('gameState') || '{}');

  // 🧱 Initialize the global game state
  if (!window.__gameState) window.__gameState = {};

  window.__gameState.clickCount = savedState.clickCount ?? 0;

  window.__gameState.flags = savedState.flags || {
    seenIntro: false,
    talkReveal: false,
    seenTalkReveal: false
  };

  window.__gameState.startTime = savedState.startTime || Date.now();

  window.__gameState.inputBuffer =
    typeof savedState.inputBuffer === 'string'
      ? savedState.inputBuffer
      : '';

  // 🎮 Add immersionConsent (whether the user agreed or not)
  // - If savedState has it, reuse it
  // - Otherwise default to null (no choice yet)
  window.__gameState.immersionConsent =
    typeof savedState.immersionConsent === 'boolean'
      ? savedState.immersionConsent
      : null;

  // 💾 Helper to save current state to localStorage
  window.__saveGameState = function () {
    localStorage.setItem('gameState', JSON.stringify(window.__gameState));
  };

  // 🔄 Reset all saved progress (for testing or starting over)
  window.__resetGameState = function () {
    // Clear localStorage entry
    localStorage.removeItem('gameState');

    // Restore default in-memory game state
    window.__gameState = {
      clickCount: 0,
      flags: {
        seenIntro: false,
        talkReveal: false
      },
      startTime: Date.now(),
      inputBuffer: '',
      immersionConsent: null
    };

    console.log("Game state reset!");
  };

  // 🛟 Optional: auto-save on page exit
  window.addEventListener('beforeunload', () => {
    window.__saveGameState();
  });
})();
document.addEventListener('keydown', (e) => {
if (e.key === 'Backspace') __resetGameState();
});
// 👂 Listen for updates from other tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'gameState') {
    const newState = JSON.parse(event.newValue || '{}');
    window.__gameState = newState;
    console.log('[Sync] Game state updated from another tab:', newState);
  }
});
