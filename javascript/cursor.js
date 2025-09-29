const cursor = document.getElementById('custom-cursor');

// Constants
const CURSOR_WIDTH = 32;
const CURSOR_HEIGHT = 32;
const CURSOR_SCALE = 1;
const FRAME_DURATION = 25; // ms per frame
const MAX_TRANSITION_SPEED = 1; // px/ms
const MIN_TRANSITION_INTERVAL = 100; // ms between transitions


// Cursor states with transitions
const cursors = {
  default: {
    src: './images/cursors/default.ico',
    offsetX: 0,
    offsetY: 0,
    transitions: {
      toPointer: [
        { src: './images/cursors/default_pointer.ico', offsetX: 6.5, offsetY: 2 }
      ],
      toText: [
        { src: './images/cursors/default_text.ico', offsetX: 0, offsetY: 6.5 }
      ]
    }
  },
  pointer: {
    src: './images/cursors/pointer.ico',
    offsetX: 13,
    offsetY: 4,
    transitions: {
      toDefault: [
        { src: './images/cursors/default_pointer.ico', offsetX: 6.5, offsetY: 2 }
      ]
    }
  },
  text: {
    src: './images/cursors/text.ico',
    offsetX: 0,
    offsetY: 13,
    transitions: {
      toDefault: [
        { src: './images/cursors/default_text.ico', offsetX: 0, offsetY: 6.5 }
      ]
    }
  },
  wait: {
    src: null,
    offsetX: 0,
    offsetY: 0
  },
  move: {
    src: './images/cursors/mover.ico',
    offsetX: 13,
    offsetY: 4
  }
};

let currentCursor = 'default';
let currentOffsetX = cursors[currentCursor].offsetX;
let currentOffsetY = cursors[currentCursor].offsetY;

// Track mouse position
let mouseX = 0;
let mouseY = 0;
let isTransitioning = false;

let prevMouseX = 0;
let prevMouseY = 0;
let prevTime = Date.now();
let cursorSpeed = 0; // pixels/ms

let pendingState = null;
let stateChangeTimeout = null;
const STATE_HOLD_DELAY = 100; // ms, adjust to taste


document.addEventListener('mousemove', e => {
  const now = Date.now();
  const dx = e.clientX - prevMouseX;
  const dy = e.clientY - prevMouseY;
  const dt = now - prevTime;

  cursorSpeed = dt > 0 ? Math.sqrt(dx*dx + dy*dy) / dt : 0;

  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  prevTime = now;

  mouseX = e.clientX;
  mouseY = e.clientY;
  updateCursorPosition();
});
document.addEventListener("DOMContentLoaded", () => {
  // Set up one-time positioning on the very first mousemove
  function positionOnFirstMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateCursorPosition();
    cursor.style.display = "block"; // show once placed

    // Remove this special listener so it only runs once
    document.removeEventListener("mousemove", positionOnFirstMove);
  }

  document.addEventListener("mousemove", positionOnFirstMove);
});


function updateCursorPosition() {
  cursor.style.left = mouseX - currentOffsetX * CURSOR_SCALE + 'px';
  cursor.style.top  = mouseY - currentOffsetY * CURSOR_SCALE + 'px';
}

// Play a flipbook animation for transition
function playTransition(frames, finalState) {
  if (isTransitioning) return;
  isTransitioning = true;
  let i = 0;

  function showFrame() {
    if (i < frames.length) {
      const frame = frames[i];
      cursor.style.backgroundImage = `url(${frame.src})`;
      cursor.style.width  = `${CURSOR_WIDTH * CURSOR_SCALE}px`;
      cursor.style.height = `${CURSOR_HEIGHT * CURSOR_SCALE}px`;

      currentOffsetX = frame.offsetX;
      currentOffsetY = frame.offsetY;
      updateCursorPosition();

      i++;
      setTimeout(showFrame, FRAME_DURATION); // wait, then show next
    } else {
      // when all frames are done, land on final cursor
      const final = cursors[finalState];
      cursor.style.backgroundImage = `url(${final.src})`;
      cursor.style.width  = `${CURSOR_WIDTH * CURSOR_SCALE}px`;
      cursor.style.height = `${CURSOR_HEIGHT * CURSOR_SCALE}px`;

      currentOffsetX = final.offsetX;
      currentOffsetY = final.offsetY;
      currentCursor = finalState;
      updateCursorPosition();

      isTransitioning = false;
    }
  }

  showFrame();
}

let lastTransitionTime = 0;

function switchCursor(newState, ignoreSpeedAndInterval = false) {
  if (newState === currentCursor || isTransitioning) return;

  const now = Date.now();

  if (!ignoreSpeedAndInterval) {
    if (cursorSpeed > MAX_TRANSITION_SPEED || (now - lastTransitionTime) < MIN_TRANSITION_INTERVAL) {
      // Skip transition, jump directly
      const { src, offsetX, offsetY } = cursors[newState];
      cursor.style.backgroundImage = `url(${src})`;
      currentOffsetX = offsetX;
      currentOffsetY = offsetY;
      currentCursor = newState;
      updateCursorPosition();
      lastTransitionTime = now;
      return;
    }
  }

  lastTransitionTime = now;

  const from = cursors[currentCursor];
  const transitionKey = `to${newState[0].toUpperCase() + newState.slice(1)}`;
  if (from.transitions && from.transitions[transitionKey]) {
    playTransition(from.transitions[transitionKey], newState);
  } else {
    // fallback
    const { src, offsetX, offsetY } = cursors[newState];
    cursor.style.backgroundImage = `url(${src})`;
    currentOffsetX = offsetX;
    currentOffsetY = offsetY;
    currentCursor = newState;
    updateCursorPosition();
  }
}

function updateCursorState() {
  if (isTransitioning) return; // skip if animating

  const elem = document.elementFromPoint(mouseX, mouseY);
  if (!elem) return;

  let newState = 'default';

  if (elem.tagName === 'A' || elem.tagName === 'BUTTON') {
    newState = 'pointer';
  } else if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA' || elem.isContentEditable) {
    newState = 'text';
  } else if (elem.classList.contains('wait-area')) {
    newState = 'wait';
  } else if (elem.classList.contains('move-area')) {
    newState = 'move';
  }

  // Only schedule a state change if different from pending
  if (newState !== pendingState) {
    if (stateChangeTimeout) clearTimeout(stateChangeTimeout);

    pendingState = newState;

    // Schedule the transition after STATE_HOLD_DELAY
    // Schedule the transition after STATE_HOLD_DELAY
    stateChangeTimeout = setTimeout(() => {
    // Pass true to ignore speed/interval checks because debounce already filtered it
    switchCursor(pendingState, true);
    pendingState = null;
    }, STATE_HOLD_DELAY);

  }
}

function pollCursorState() {
  updateCursorState();
  requestAnimationFrame(pollCursorState);
}

// Detect state
document.addEventListener('mouseover', e => {
  if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
    switchCursor('pointer');
  } else if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    switchCursor('text');
  } else if (e.target.classList.contains('wait-area')) {
    switchCursor('wait');
  } else if (e.target.classList.contains('move-area')) {
    switchCursor('move');
  } else {
    switchCursor('default');
  }
});

// Collect all image sources from cursors and transitions
function collectAllSources(cursors) {
  const sources = new Set();

  for (const key in cursors) {
    if (cursors[key].src) {
      sources.add(cursors[key].src);
    }
    if (cursors[key].transitions) {
      for (const transKey in cursors[key].transitions) {
        cursors[key].transitions[transKey].forEach(frame => {
          sources.add(frame.src);
        });
      }
    }
  }

  return Array.from(sources);
}

// Preload images
function preloadImages(sources, callback) {
  let loaded = 0;
  sources.forEach(src => {
    const img = new Image();
    img.onload = () => {
      loaded++;
      if (loaded === sources.length) callback();
    };
    img.onerror = () => {
      console.warn(`Failed to load cursor image: ${src}`);
      loaded++;
      if (loaded === sources.length) callback();
    };
    img.src = src;
  });
}
// Usage:
const sources = collectAllSources(cursors);
preloadImages(sources, () => {
  console.log("All cursor images preloaded!");

  const { src, offsetX, offsetY } = cursors[currentCursor];
  cursor.style.backgroundImage = `url(${src})`;
  cursor.style.width  = `${CURSOR_WIDTH * CURSOR_SCALE}px`;
  cursor.style.height = `${CURSOR_HEIGHT * CURSOR_SCALE}px`;
  currentOffsetX = offsetX;
  currentOffsetY = offsetY;
  updateCursorPosition();
  cursor.style.display = "block";

  // Start automatic state polling
  pollCursorState();
});

// Hide cursor until everything is ready
cursor.style.display = "none";