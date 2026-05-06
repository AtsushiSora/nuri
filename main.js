const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");

const img = new Image();
img.src = "images/coloring.png";

img.onload = function () {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
};

// HEX → RGBA
function hexToRgba(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

// スマホ対応（タップ）
canvas.addEventListener("click", handleFill);
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = Math.floor(touch.clientX - rect.left);
  const y = Math.floor(touch.clientY - rect.top);
  handleFill({ x, y });
});

function handleFill(e) {
  let x, y;

  if (e.x !== undefined) {
    x = e.x;
    y = e.y;
  } else {
    const rect = canvas.getBoundingClientRect();
    x = Math.floor(e.clientX - rect.left);
    y = Math.floor(e.clientY - rect.top);
  }

  const fillColor = hexToRgba(colorPicker.value);
  floodFill(x, y, fillColor);
}

function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const targetColor = getColorAtPixel(data, x, y);

  if (colorsMatch(targetColor, fillColor)) return;

  const stack = [[x, y]];
  const tolerance = 50; // ← 調整ポイント

  while (stack.length > 0) {
    const [px, py] = stack.pop();
    const index = (py * canvas.width + px) * 4;

    const current = [
      data[index],
      data[index + 1],
      data[index + 2],
      data[index + 3]
    ];

    // 黒線は塗らない（壁）
    if (isBlack(current)) continue;

    // 色が近くないならスキップ
    if (!colorsClose(current, targetColor, tolerance)) continue;

    // 塗る
    data[index] = fillColor[0];
    data[index + 1] = fillColor[1];
    data[index + 2] = fillColor[2];
    data[index + 3] = fillColor[3];

    // 上下左右
    if (px > 0) stack.push([px - 1, py]);
    if (px < canvas.width - 1) stack.push([px + 1, py]);
    if (py > 0) stack.push([px, py - 1]);
    if (py < canvas.height - 1) stack.push([px, py + 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

function getColorAtPixel(data, x, y) {
  const index = (y * canvas.width + x) * 4;
  return [
    data[index],
    data[index + 1],
    data[index + 2],
    data[index + 3]
  ];
}

// 色の近さ判定
function colorsClose(a, b, tolerance) {
  return (
    Math.abs(a[0] - b[0]) < tolerance &&
    Math.abs(a[1] - b[1]) < tolerance &&
    Math.abs(a[2] - b[2]) < tolerance
  );
}

// 黒判定（線）
function isBlack(color) {
  return color[0] < 50 && color[1] < 50 && color[2] < 50;
}

// 完全一致（初期チェック用）
function colorsMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
}