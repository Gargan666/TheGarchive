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

const gravity = -500;   // downward acceleration
let y = 0;              // vertical position
let vel = 0;            // vertical velocity
const timer = new Timer();

const game = document.getElementById("game");
const dino = document.getElementById("dino");
let dinoY = 0;
let jumping = false;

// Button press adds upward velocity
document.addEventListener("click", () => {
  if (jumping) return;
  vel += 300; // add 10 m/s upward
});

function update() {
  const dt = timer.delta();
  dinoY = y;
  dino.style.bottom = dinoY + "px";

  // Apply gravity
  vel += gravity * dt;

  // Update position
  y += vel * dt;

  // Prevent going below the ground
  if (y < 0) {
    y = 0;
    vel = 0; // stop motion when on ground
    jumping = false;
  } else {
    jumping = true;
  }

  requestAnimationFrame(update); 
}
update();

function createObstacle() {
  let x = 600;

  const o = document.createElement("div");
  o.className = "obstacle";
  o.style.left = x + "px";
  game.appendChild(o);


  let move = setInterval(() => {
    x -= 3;
    o.style.left = x + "px";

    // Collision check
    if (x < 90 && x > 20 && dinoY < 40) {
    }

    if (x < -40) {
      x = 600;
      clearInterval(move);
      game.removeChild(o);
    }
  }, 1);

  // Make more obstacles later
  setTimeout(createObstacle, Math.random() * 3000 + 2000);
}

createObstacle();