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
    run: Array.from({ length: 8 }, (_, i) => `/images/dino/player/Run${i + 1}.png`),
    jumpStart: ["/images/dino/player/Jump1.png", "/images/dino/player/Jump2.png"],
    jumpLand: ["/images/dino/player/Jump3.png", "/images/dino/player/Jump3.png", "/images/dino/player/Jump4.png"]
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
let currentSpeed = 300;
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
const chargeBar = document.getElementById('charge');

let obstacles = [];
const obstaclePool = []; // recycled obstacles
let parallaxLayers = Array.from(document.querySelectorAll(".parallax")).map(layer => ({
  el: layer,
  scroll: 0,
  speedMultiplier: parseFloat(layer.dataset.speed),
  width: layer.offsetWidth,
  _lastScroll: 0
}));

let _lastCutAmount = -1;
let obstacleSpawnTimer = 0;
let nextObstacleTime = Math.random() * 5 + 1; // spawn 1–6 seconds

/* ================================
   INPUT (single-instance safe)
================================ */
if (!window.gameInputAttached) {
  window.gameInputAttached = true;

  document.addEventListener("mousedown", () => { if (!jumping) charging = true; });
  document.addEventListener("mouseup", () => {
    if (jumping) return;
    vel = 300 + 100 * jumpForce;
    jumpForce = 0;
    chargeTime = 1;
    charging = false;
    animator.play("jumpStart", false);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") paused = !paused;
    if (paused) return;
    if (e.key === "+") { e.preventDefault(); currentSpeed += 50; }
  });
}

/* ================================
   OBSTACLE SPAWNING (reworked)
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

/* ================================
   MAIN UPDATE LOOP
================================ */
if (!window.gameLoopStarted) {
  window.gameLoopStarted = true;

  function update() {
    let dt = timer.delta(); if (paused) { dt = 0; return; }

    animator.update(dt);

    // --- PLAYER PHYSICS ---
    vel += gravity * dt;
    y += vel * dt;

    if (y < groundLevel) {
      y = groundLevel;
      vel = 0;
      if (jumping) animator.play("jumpLand", false, () => animator.play("run", true));
      jumping = false;
    } else jumping = true;

    if (!jumping) animator.setFPS(12 * (currentSpeed / 300));
    if (charging && jumpForce <= 1.75) { jumpForce += 0.5 / chargeTime; chargeTime++; }

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

    // --- OBSTACLE SPAWNING (time-based) ---
    obstacleSpawnTimer += dt;
    if (obstacleSpawnTimer >= nextObstacleTime) {
      spawnObstacle();
      obstacleSpawnTimer = 0;
      nextObstacleTime = Math.random() * 5 + 1; // 1–6 sec
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

      if (o.x < 90 && o.x > 20 && y < 40) console.log("COLLISION!");
    }

    // --- CHARGE BAR ---
    const cutAmount = 180 - (102.857142857 * jumpForce);
    if (Math.abs(cutAmount - _lastCutAmount) >= 0.5) {
      chargeBar.style.clipPath = `inset(${cutAmount}px 0 0 0)`;
      _lastCutAmount = cutAmount;
    }
  }

  function loop() {
    update();
    requestAnimationFrame(loop);
  }

  loop();
}