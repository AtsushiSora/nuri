const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");

// =====================
// ステージ自動生成
// =====================
const images = [];
const maxImages = 20;

for (let i = 1; i <= maxImages; i++) {
  images.push(`images/coloring${i}.png`);
}

let currentIndex = 0;

// =====================
// 画像読み込み
// =====================
function loadImage() {
  const img = new Image();
  img.src = images[currentIndex];

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    history = [];
    updateStageText();
  };

  img.onerror = function () {
    nextImage();
  };
}

// =====================
// ステージ操作
// =====================
function nextImage() {
  currentIndex++;
  if (currentIndex >= images.length) currentIndex = 0;
  loadImage();
}

function prevImage() {
  currentIndex--;
  if (currentIndex < 0) currentIndex = images.length - 1;
  loadImage();
}

function updateStageText() {
  document.getElementById("stageText").textContent =
    "ステージ " + (currentIndex + 1);
}

// =====================
// Undo
// =====================
let history = [];

function saveState() {
  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (history.length > 20) history.shift();
}

function undo() {
  if (history.length === 0) return;
  ctx.putImageData(history.pop(), 0, 0);
}

// =====================
// 保存
// =====================
function saveImage() {
  const link = document.createElement("a");
  link.download = "coloring.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// =====================
// シェア（スマホ）
// =====================
async function shareImage() {
  const dataUrl = canvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], "nuri.png", { type: "image/png" });

  if (navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: "塗り絵できた！",
        text: "塗り絵アプリで作ったよ 🎨",
      });
    } catch (e) {}
  } else {
    alert("シェア未対応です");
  }
}

// =====================
// 色変換
// =====================
function hexToRgba(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

// =====================
// パレット
// =====================
document.querySelectorAll(".color").forEach(el => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".color").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
    colorPicker.value = el.dataset.color;
  });
});

// =====================
// イベント（ズレ修正済）
// =====================
canvas.addEventListener("click", handleFill);

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const t = e.touches[0];

  handleFill({
    clientX: t.clientX,
    clientY: t.clientY
  });
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });

// =====================
// 塗り
// =====================
function handleFill(e) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  saveState();

  const fillColor = hexToRgba(colorPicker.value);
  floodFill(x, y, fillColor);
}

// =====================
// FloodFill
// =====================
function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const targetColor = getColorAtPixel(data, x, y);
  if (colorsMatch(targetColor, fillColor)) return;

  const stack = [[x, y]];
  const visited = new Uint8Array(canvas.width * canvas.height);

  const tolerance = 45;
  const blackThreshold = 80;

  while (stack.length > 0) {
    const [px, py] = stack.pop();

    if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;

    const idx = py * canvas.width + px;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const i = idx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < blackThreshold && g < blackThreshold && b < blackThreshold) continue;

    if (!colorsClose([r, g, b], targetColor, tolerance)) continue;

    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];
    data[i + 3] = fillColor[3];

    stack.push([px - 1, py]);
    stack.push([px + 1, py]);
    stack.push([px, py - 1]);
    stack.push([px, py + 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

// =====================
// 補助
// =====================
function getColorAtPixel(data, x, y) {
  const i = (y * canvas.width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function colorsClose(a, b, t) {
  return (
    Math.abs(a[0] - b[0]) < t &&
    Math.abs(a[1] - b[1]) < t &&
    Math.abs(a[2] - b[2]) < t
  );
}

function colorsMatch(a, b) {
  return a.every((v, i) => v === b[i]);
}

// 初期ロード
loadImage();
