/* ================================
   TIMER
================================ */
class Timer {
  constructor() {
    this.last = performance.now();
  }
  delta() {
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;
    return dt;
  }
}

/* ================================
   SMOOTH VALUE (speed smoothing)
================================ */
class SmoothValue {
  constructor(initial, response = 8) {
    this.value = initial;
    this.target = initial;
    this.response = response;
  }

  setTarget(v) {
    this.target = v;
  }

  setInstant(v) {
    this.value = v;
    this.target = v;
  }

  update(dt) {
    const diff = this.target - this.value;
    if (Math.abs(diff) < 0.001) {
      this.value = this.target;
    } else {
      this.value += diff * Math.min(1, dt * this.response);
    }
    return this.value;
  }
}

/* ================================
   SPRITE ANIMATOR
================================ */
class SpriteAnimator {
  constructor(img, animations, fps = 10) {
    this.img = img;
    this.animations = animations;
    this.fps = fps;
    this.currentAnim = null;
    this.frameIndex = 0;
    this.loop = true;
    this.onFinish = null;
    this.frameTimer = 0;
    this.secondsPerFrame = 1 / fps;
    this._lastFrameIndex = -1;
  }

  play(name, loop = true, onFinish = null) {
    const anim = this.animations[name];
    if (!anim) return;
    this.currentAnim = anim;
    this.loop = loop;
    this.onFinish = onFinish;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this._lastFrameIndex = -1;
    this.img.src = anim[0];
  }

  setFPS(fps) {
    this.fps = fps;
    this.secondsPerFrame = 1 / fps;
  }

  update(dt) {
    if (!this.currentAnim) return;
    this.frameTimer += dt;
    while (this.frameTimer >= this.secondsPerFrame) {
      this.frameTimer -= this.secondsPerFrame;
      this.frameIndex++;
      if (this.frameIndex >= this.currentAnim.length) {
        if (this.loop) this.frameIndex = 0;
        else {
          this.frameIndex = this.currentAnim.length - 1;
          this.onFinish?.();
          return;
        }
      }
      if (this._lastFrameIndex !== this.frameIndex) {
        this.img.src = this.currentAnim[this.frameIndex];
        this._lastFrameIndex = this.frameIndex;
      }
    }
  }
}

/* ================================
   INIT ANIMATOR
================================ */
const playerImg = document.getElementById("player");
const animator = new SpriteAnimator(
  playerImg,
  {
    run: Array.from({ length: 8 }, (_, i) => `./images/dino/player/Run${i + 1}.png`),
    jumpStart: ["./images/dino/player/Jump1.png", "./images/dino/player/Jump2.png"],
    jumpLand: ["./images/dino/player/Jump3.png", "./images/dino/player/Jump3.png", "./images/dino/player/Jump4.png"]
  },
  12
);

// Preload all sprite images
const preloadedImages = [];
for (const anim of Object.values(animator.animations)) {
  for (const src of anim) {
    const img = new Image();
    img.src = src;
    preloadedImages.push(img);
  }
}

animator.play("run", true);

/* ================================
   GLOBAL GAME STATE
================================ */

// Base gameplay speed (the real speed)
let gameplaySpeed = 300;

// The smooth animated speed that everything uses
let smoothSpeed = new SmoothValue(gameplaySpeed, 8);

const gravity = -1000;
const groundLevel = 10;

let y = groundLevel;
let vel = 0;
let jumping = false;
let charging = false;
let paused = false;

let jumpForce = 0;
let chargeTime = 1;

const timer = new Timer();

const dino = document.getElementById("dino");
const dinoStyle = dino.style;
const oContainer = document.getElementById("oBox");
const chargeBar = document.getElementById("charge");
const pauseOverlay = document.getElementById("pause");
const gameBox = document.getElementById("game");

let obstacles = [];
const obstaclePool = []; 

let parallaxLayers = Array.from(document.querySelectorAll(".parallax")).map(layer => ({
  el: layer,
  scroll: 0,
  speedMultiplier: parseFloat(layer.dataset.speed),
  width: layer.offsetWidth,
  _lastScroll: 0
}));

let _lastCutAmount = -1;
let obstacleSpawnTimer = 0;
let nextObstacleTime = Math.random() * 5 + 1;

let TRUTH = false;
let corruptionLevel = 0;
let corruptionBlocks = [];

/* ================================
   INPUT (single-instance safe)
================================ */
if (!window.gameInputAttached) {
  window.gameInputAttached = true;

  document.addEventListener("mousedown", () => { 
    if (paused) return;
    if (!jumping) {
      charging = true; 
      playerImg.classList.add("charging");
    }
  });

  document.addEventListener("mouseup", () => {
    if (paused) return;
    if (jumping) return;
    vel = 300 + 100 * jumpForce;
    jumpForce = 0;
    chargeTime = 1;
    charging = false;
    animator.play("jumpStart", false);
    playerImg.classList.remove("charging");

    // smooth jump speed boost
    smoothSpeed.setInstant(gameplaySpeed * 1.2)
    smoothSpeed.setTarget(gameplaySpeed);
  });

  const combo = ["ArrowUp", "ArrowDown", "ArrowRight", "ArrowRight", "ArrowRight"];
  let buffer = [];

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") paused = !paused;
    if (paused) return;

    if (e.key === "+") {
      e.preventDefault();
      gameplaySpeed += 50;
      smoothSpeed.setTarget(gameplaySpeed); // update target speed
    }
    if (e.key === "-") {
      e.preventDefault();
      if (gameplaySpeed <= 50) return;
      gameplaySpeed -= 50;
      smoothSpeed.setTarget(gameplaySpeed); // update target speed
    }

    buffer.push(e.key);

  // Limit buffer length
  if (buffer.length > combo.length) {
    buffer.shift();
  }

  // Check match
  if (buffer.join(",") === combo.join(",")) {
    TRUTH = true;
    buffer = []; // optional reset
  }
  });

}

/* ================================
   OBSTACLE RECYCLING
================================ */
function spawnObstacle() {
  let o;
  if (obstaclePool.length > 0) {
    o = obstaclePool.pop();
    o.x = 600;
    o.style.display = "block";
  } else {
    o = document.createElement("div");
    o.className = "obstacle";
    o.x = 600;
    oContainer.appendChild(o);
  }
  obstacles.push(o);
}

function recycleObstacle(o) {
  o.style.display = "none";
  obstaclePool.push(o);
}

function spawnCorruptionBlock() {
  const block = document.createElement("div");
  block.className = "corrupt-block";

  const size = Math.random() * 200 + 40;
  block.style.width = size + "px";
  block.style.height = size + "px";

  block.style.left = Math.random() * window.innerWidth + "px";
  block.style.top = Math.random() * window.innerHeight + "px";

  block.style.opacity = 1; // always instant

  document.getElementById("corruptionLayer").appendChild(block);
  corruptionBlocks.push(block);
}

/* ================================
   MAIN UPDATE LOOP
================================ */
if (!window.gameLoopStarted) {
  window.gameLoopStarted = true;

  function update() {
    let dt = timer.delta(); 
    if (paused) { 
      pauseOverlay.classList.remove('disabled');
      dt = 0; 
      return; 
    }
    pauseOverlay.classList.add('disabled');

    // Update smooth speed
    const currentSpeed = smoothSpeed.update(dt);

    animator.update(dt);

    // --- PLAYER PHYSICS ---
    vel += gravity * dt;
    y += vel * dt;

    if (y < groundLevel) {
      y = groundLevel;
      vel = 0;
      if (jumping) {
        animator.play("jumpLand", false, () => animator.play("run", true));

        // Return to normal speed smoothly
        smoothSpeed.setInstant(gameplaySpeed * 0.5);
        smoothSpeed.setTarget(gameplaySpeed);
      }
      jumping = false;
    } else {
      jumping = true;
    }

    if (!jumping) animator.setFPS(12 * (currentSpeed / 300));

    if (charging && jumpForce <= 1.75) { 
      jumpForce += 0.5 / chargeTime; 
      chargeTime++; 
    }

    dinoStyle.bottom = y + "px";

    // --- PARALLAX ---
    for (const layer of parallaxLayers) {
      layer.scroll -= currentSpeed * layer.speedMultiplier * dt;
      if (layer.scroll <= -layer.width) layer.scroll = 0;
      if (Math.abs(layer.scroll - layer._lastScroll) >= 1) {
        layer.el.style.backgroundPosition = `${layer.scroll}px 0`;
        layer._lastScroll = layer.scroll;
      }
    }

    // --- OBSTACLE SPAWNING ---
    obstacleSpawnTimer += dt;
    if (obstacleSpawnTimer >= nextObstacleTime) {
      spawnObstacle();
      obstacleSpawnTimer = 0;
      nextObstacleTime = Math.random() * 5 + 1;
    }

    // --- OBSTACLES ---
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= currentSpeed * dt;
      o.style.left = o.x + "px";
      o.style.bottom = groundLevel + "px";

      if (o.x < -100) {
        recycleObstacle(o);
        obstacles.splice(i, 1);
        continue;
      }

      if (o.x < 90 && o.x > 20 && y < 40) {
        console.log("COLLISION!");
      }
    }

    // --- CHARGE BAR ---
    const cutAmount = 190 - (106.5 * jumpForce);
    if (Math.abs(cutAmount - _lastCutAmount) >= 0.5) {
      chargeBar.style.clipPath = `inset(${cutAmount}px 0 0 0)`;
      _lastCutAmount = cutAmount;
    }

// ========================
//    CORRUPTION EFFECT
// ========================
if (TRUTH) {

  corruptionLevel += dt * 0.15; // slow buildup
  corruptionLevel = Math.min(1, corruptionLevel);

  const c = corruptionLevel;

  // ---- Spawn black blocks under the whole game ----
  if (Math.random() < c * 1) {
    spawnCorruptionBlock();
  }

  gameBox.style.background = `rgb(${255 - c * 255}, ${255 - c * 255}, ${255 - c * 255}) `;
  // ---- Distort parallax layers ----
  for (const layer of parallaxLayers) {
    if (Math.random() < c * 0.03) {
      const ox = (Math.random() - 0.5) * 250 * c;
      const oy = (Math.random() - 0.5) * 140 * c;

      layer.el.style.transform = `translate(${ox}px, ${oy}px)`;
      layer.el.style.overflow = "hidden";
      layer.el.style.filter = `brightness(${1 - c}) saturate(${1 - c}) contrast(${1 + c})`;
      layer.el.style.opacity = `${1-c}`;
      
    }
  }

  // ---- Distort obstacles ----
  for (const o of obstacles) {
    if (Math.random() < c * 0.05) {
      const ox = (Math.random() - 0.5) * 180 * c;
      const oy = (Math.random() - 0.5) * 100 * c;

      o.style.transform = `translate(${ox}px, ${oy}px)`;
      o.style.overflow = "hidden";
      o.style.filter = `brightness(${1 - c}) saturate(${1 - c}) contrast(${1 + c})`;
    }
  }

} else {

  // reset if TRUTH turns off (optional)
  corruptionLevel = 0;

  for (const layer of parallaxLayers) {
    layer.el.style.transform = "";
    layer.el.style.filter = "";
  }
  
  for (const o of obstacles) {
    o.style.transform = "";
    o.style.filter = "";
  }

  for (const b of corruptionBlocks) b.remove();
  corruptionBlocks = [];
}


  }

  function loop() {
    update();
    requestAnimationFrame(loop);
  }

  loop();
}