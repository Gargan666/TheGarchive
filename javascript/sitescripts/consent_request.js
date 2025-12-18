async function immersionConsent() {

  const box = document.getElementById("immersion-box");
  const textbox = document.getElementById("immersion-query");
  const boxbg = document.getElementById("immersion-bg");

  if (__gameState == null) {
      // Global state object (create it if it doesn't exist)
  window.__gameState = window.__gameState || {};
  __gameState.immersionConsent = null; // default: no choice yet
  }
  if (__gameState.immersionConsent == null) {

  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");

  if (!box || !yesBtn || !noBtn) {
    console.warn("Immersion elements not found on page.");
    return;
  }

  yesBtn.addEventListener("click", () => {
  __gameState.immersionConsent = true;
  __saveGameState();
  textbox.innerHTML = "<p>Thanks! Immersion mode enabled.</p>";
  textbox.className = 'popup-fade';
  boxbg.className = 'disabled';
  setTimeout(() => { textbox.className = 'disabled'; }, 2000);
});

noBtn.addEventListener("click", () => {
  __gameState.immersionConsent = false;
  __saveGameState();
  textbox.innerHTML = "<p>Immersion mode canceled.</p>";
  textbox.className = 'popup-fade';
  boxbg.className = 'disabled';
  setTimeout(() => { textbox.className = 'disabled'; }, 2000);
});

} else {
  box.className = 'disabled';
}

};
