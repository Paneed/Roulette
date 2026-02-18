const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const result = document.getElementById("result");
const pointer = document.getElementById("pointer");
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerName = document.getElementById("winnerName");

const STATIC_NAMES = ["Ariane Mayer", "Alexandre Piana"];
const DISPLAY_SLOTS = 12;
const WHEEL_BG_SRC = "assets/DSC_0578.jpg";

const palette = ["#99d8d0", "#ffd8a8", "#f2a8c6", "#b9d8ff", "#c8c3f6", "#b7e7c0"];
const TAU = Math.PI * 2;
const center = canvas.width / 2;
const radius = center - 16;
const wheelBgImage = new Image();
let wheelBgReady = false;

let rotation = 0;
let spinning = false;
let tickTimer = null;
let overlayTimer = null;
let guideTimer = null;
let nextWinnerIndex = 0;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSlotOwners() {
  const owners = [];
  const namesCount = STATIC_NAMES.length;

  for (let i = 0; i < DISPLAY_SLOTS; i += 1) {
    owners.push(i % namesCount);
  }

  return shuffleArray(owners);
}

function pickWinningSlotForOwner(slotOwners, ownerIndex) {
  const matchingSlots = [];

  for (let i = 0; i < slotOwners.length; i += 1) {
    if (slotOwners[i] === ownerIndex) {
      matchingSlots.push(i);
    }
  }

  return matchingSlots[Math.floor(Math.random() * matchingSlots.length)];
}

function drawWheelBackground() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, TAU);
  ctx.closePath();
  ctx.clip();

  if (wheelBgReady) {
    const srcW = wheelBgImage.naturalWidth;
    const srcH = wheelBgImage.naturalHeight;
    const srcSize = Math.min(srcW, srcH);
    const sx = (srcW - srcSize) / 2;
    const sy = (srcH - srcSize) / 2;
    ctx.drawImage(wheelBgImage, sx, sy, srcSize, srcSize, center - radius, center - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = "#ecf2ff";
    ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);
  }

  ctx.restore();
}

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWheelBackground();
  const step = TAU / DISPLAY_SLOTS;

  for (let i = 0; i < DISPLAY_SLOTS; i += 1) {
    const start = rotation + i * step - Math.PI / 2;
    const end = start + step;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = `${palette[i % palette.length]}b8`;
    ctx.fill();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + step / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fffdf9";
    const size = Math.max(13, Math.min(22, 300 / DISPLAY_SLOTS));
    ctx.font = `800 ${size}px Manrope`;
    ctx.fillText("???", radius - 22, 6);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(center, center, 34, 0, TAU);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#134744";
  ctx.stroke();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function createSparkBurst() {
  const burst = document.createElement("div");
  burst.className = "spark";

  for (let i = 0; i < 16; i += 1) {
    const dot = document.createElement("span");
    const angle = (TAU * i) / 16;
    const distance = 46 + Math.random() * 44;
    dot.style.setProperty("--sx", "0px");
    dot.style.setProperty("--sy", "0px");
    dot.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    dot.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    dot.style.left = "50%";
    dot.style.top = "42%";
    dot.style.background = palette[Math.floor(Math.random() * palette.length)];
    dot.style.animationDelay = `${Math.random() * 120}ms`;
    burst.appendChild(dot);
  }

  result.appendChild(burst);
  setTimeout(() => burst.remove(), 1000);
}

function createConfettiRain() {
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  const pieces = 120;

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.color = palette[Math.floor(Math.random() * palette.length)];
    piece.style.setProperty("--drift", `${Math.floor(-90 + Math.random() * 180)}px`);
    piece.style.width = `${7 + Math.random() * 7}px`;
    piece.style.height = `${10 + Math.random() * 12}px`;
    piece.style.animationDuration = `${1800 + Math.random() * 1300}ms`;
    piece.style.animationDelay = `${Math.random() * 500}ms`;
    piece.style.opacity = "0";
    if (Math.random() > 0.5) {
      piece.style.borderRadius = "999px";
    }
    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3800);
}

function showWinnerOverlay(name) {
  clearTimeout(overlayTimer);
  winnerName.textContent = name;
  winnerOverlay.classList.add("show");

  overlayTimer = setTimeout(() => {
    winnerOverlay.classList.remove("show");
  }, 2400);
}

function announceWinner(name) {
  result.textContent = `Gagnant: ${name}`;
  result.classList.remove("win");
  void result.offsetWidth;
  result.classList.add("win");
  showWinnerOverlay(name);
  createSparkBurst();
  createConfettiRain();
}

function startTickMotion() {
  let speed = 45;
  let elapsed = 0;

  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    pointer.classList.remove("tick");
    void pointer.offsetWidth;
    pointer.classList.add("tick");

    elapsed += speed;
    speed = Math.min(speed + 18, 220);
    if (elapsed > 4200) {
      clearInterval(tickTimer);
    }
  }, speed);
}

function stopTickMotion() {
  clearInterval(tickTimer);
  pointer.classList.remove("tick");
}

function spin() {
  if (spinning) {
    return;
  }

  clearTimeout(guideTimer);

  const currentNames = STATIC_NAMES;
  if (currentNames.length < 2) {
    result.textContent = "Il faut au moins 2 noms dans le code.";
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  result.textContent = "La roue tourne...";

  const slotOwners = buildSlotOwners();
  const step = TAU / DISPLAY_SLOTS;
  const winnerIndex = nextWinnerIndex;
  const winningSlot = pickWinningSlotForOwner(slotOwners, winnerIndex);
  nextWinnerIndex = (nextWinnerIndex + 1) % STATIC_NAMES.length;
  const desired = -(winningSlot + 0.5) * step;
  const fullSpins = 6 + Math.floor(Math.random() * 3);

  const delta = ((desired - rotation) % TAU + TAU) % TAU;
  const finalRotation = rotation + fullSpins * TAU + delta;

  const startRotation = rotation;
  const duration = 5200;
  const startTime = performance.now();

  startTickMotion();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);
    rotation = startRotation + (finalRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation = finalRotation % TAU;
    drawWheel();
    stopTickMotion();
    announceWinner(currentNames[winnerIndex]);
    spinBtn.disabled = false;
    spinning = false;
  }

  requestAnimationFrame(animate);
}

spinBtn.addEventListener("click", spin);

wheelBgImage.addEventListener("load", () => {
  wheelBgReady = true;
  drawWheel();
});

wheelBgImage.addEventListener("error", () => {
  wheelBgReady = false;
});

wheelBgImage.src = WHEEL_BG_SRC;

guideTimer = setTimeout(() => {
  if (!spinning && result.textContent === "Clique sur Lancer.") {
    result.textContent = "";
  }
}, 2600);

drawWheel();
