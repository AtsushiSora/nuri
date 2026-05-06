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

// カラー取得
function hexToRgba(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(e.clientX - rect.left);
  const y = Math.floor(e.clientY - rect.top);

  const color = hexToRgba(colorPicker.value);
  floodFill(x, y, color);
});

function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const targetColor = getColorAtPixel(data, x, y);

  if (colorsMatch(targetColor, fillColor)) return;

  const stack = [[x, y]];

  while (stack.length > 0) {
    const [px, py] = stack.pop();
    const index = (py * canvas.width + px) * 4;

    const current = [
      data[index],
      data[index + 1],
      data[index + 2],
      data[index + 3]
    ];

    if (!colorsMatch(current, targetColor)) continue;

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

function colorsMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
}
