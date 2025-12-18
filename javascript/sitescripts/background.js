window.addEventListener('scroll', () => {
  // query all parallax layers
const layers = Array.from(document.querySelectorAll('.siteBG'));

// store the last known scroll position and a rAF id
let latestScrollY = 0;
let ticking = false;

function onScroll() {
  latestScrollY = window.scrollY || window.pageYOffset;
  requestTick();
}

function requestTick() {
  if (!ticking) {
    requestAnimationFrame(updateLayers);
    ticking = true;
  }
}

function updateLayers() {
  // update each layer's --offset directly (in px)
  layers.forEach(layer => {
    const speed = parseFloat(layer.dataset.speed) || 0;
    // compute offset in px; you can invert sign if you want opposite direction
    const offset = Math.round(latestScrollY * speed);
    layer.style.setProperty('--offset', `${offset}px`);
  });

  ticking = false;
}

// listen
window.addEventListener('scroll', onScroll, { passive: true });

});