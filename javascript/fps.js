let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS() {
  const now = performance.now();
  frameCount++;

  // update FPS every 0.5 seconds
  if (now - lastTime >= 500) {
    fps = Math.round((frameCount * 1000) / (now - lastTime));
    frameCount = 0;
    lastTime = now;

    // display in console or on screen
    console.log(fps + " FPS");
  }

  requestAnimationFrame(updateFPS);
}

updateFPS();