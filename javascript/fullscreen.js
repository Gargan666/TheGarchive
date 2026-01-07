document.addEventListener("DOMContentLoaded", () => {
  // Make sure game state exists and consent is given
  if (!window.__gameState?.immersionConsent) {
    console.log("Fullscreen overlay not created — no consent.");
    return;
  }

  // Create the invisible fullscreen overlay
  const overlay = document.createElement("button");
  overlay.id = "fullscreenOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.border = "none";
  overlay.style.padding = "0";
  overlay.style.margin = "0";
  overlay.style.background = "transparent";
  overlay.style.zIndex = "9999";
  overlay.style.cursor = "pointer";

  // Attach click handler
  overlay.addEventListener("click", async () => {
    try {
      await document.documentElement.requestFullscreen();
      console.log("Fullscreen activated via overlay.");
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }

    // Remove the overlay after use
    overlay.remove();
  });

  // Add to document
  document.body.appendChild(overlay);
});
