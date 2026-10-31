import type { GridState, PlantType } from '../types/index.ts';
import { PLANT_DATA } from '../game/plants.ts';

const TILE_PADDING = 4;
const CORNER_RADIUS = 8;

export interface RenderConfig {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  tileSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
}

export function setupCanvas(canvas: HTMLCanvasElement, containerWidth: number, containerHeight: number): RenderConfig {
  const dpr = window.devicePixelRatio || 1;
  const width = containerWidth;
  const height = containerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  return { canvas, ctx, width, height, tileSize: 0, gridOffsetX: 0, gridOffsetY: 0 };
}

export function calculateLayout(config: RenderConfig, rows: number, cols: number, reserveBottom: number = 0): RenderConfig {
  const availableWidth = config.width - 32;
  const availableHeight = config.height - reserveBottom - 32;

  const tileSize = Math.min(
    Math.floor(availableWidth / cols),
    Math.floor(availableHeight / rows),
    80
  );

  const gridWidth = tileSize * cols;
  const gridHeight = tileSize * rows;

  return {
    ...config,
    tileSize,
    gridOffsetX: (config.width - gridWidth) / 2,
    gridOffsetY: (config.height - reserveBottom - gridHeight) / 2,
  };
}

export function drawGrid(
  config: RenderConfig,
  grid: GridState,
  time: number,
  selectedAxis: { direction: 'h' | 'v'; index: number } | null = null
): void {
  const { ctx, tileSize, gridOffsetX, gridOffsetY } = config;

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const x = gridOffsetX + c * tileSize;
      const y = gridOffsetY + r * tileSize;
      const stack = grid.layers[r][c];

      drawTileBackground(ctx, x, y, tileSize);

      if (stack.length > 0) {
        const topTile = stack[stack.length - 1];
        drawPlantTile(ctx, x, y, tileSize, topTile.plant, time, stack.length > 1);
      }
    }
  }

  if (selectedAxis) {
    drawFoldAxis(ctx, config, grid, selectedAxis);
  }
}

function drawTileBackground(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const inner = size - TILE_PADDING * 2;
  const ix = x + TILE_PADDING;
  const iy = y + TILE_PADDING;

  ctx.save();
  ctx.fillStyle = '#FFF8F0';
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  roundRect(ctx, ix, iy, inner, inner, CORNER_RADIUS);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#E8DDD0';
  ctx.lineWidth = 1;
  roundRect(ctx, ix, iy, inner, inner, CORNER_RADIUS);
  ctx.stroke();
}

export function drawPlantTile(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  plant: PlantType,
  time: number,
  hasLayers: boolean
): void {
  const info = PLANT_DATA[plant];
  const inner = size - TILE_PADDING * 2;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = inner * 0.35;

  ctx.save();
  roundRect(ctx, x + TILE_PADDING, y + TILE_PADDING, inner, inner, CORNER_RADIUS);
  ctx.clip();

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.5);
  grad.addColorStop(0, info.colors.accent + '40');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  const sway = Math.sin(time * 0.002 + x * 0.1) * 2;
  const breathe = 1 + Math.sin(time * 0.003 + y * 0.1) * 0.03;

  ctx.translate(cx, cy);
  ctx.rotate(sway * Math.PI / 180);
  ctx.scale(breathe, breathe);

  drawPlantIcon(ctx, plant, r, time);

  ctx.restore();

  if (hasLayers) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = info.colors.secondary;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    roundRect(ctx, x + TILE_PADDING + 2, y + TILE_PADDING + 2, inner - 4, inner - 4, CORNER_RADIUS - 1);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPlantIcon(ctx: CanvasRenderingContext2D, plant: PlantType, radius: number, time: number): void {
  const info = PLANT_DATA[plant];

  switch (plant) {
    case 'cherry_blossom':
      drawFlower(ctx, radius, info.colors.primary, info.colors.accent, 5, time);
      break;
    case 'fern':
      drawFern(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'lavender':
      drawLavender(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'sunflower':
      drawFlower(ctx, radius, info.colors.primary, '#8B4513', 12, time);
      break;
    case 'blue_lotus':
      drawLotus(ctx, radius, info.colors.primary, info.colors.accent, time);
      break;
    case 'succulent':
      drawSucculent(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'maple_leaf':
      drawMapleLeaf(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'camellia':
      drawFlower(ctx, radius, info.colors.primary, info.colors.accent, 8, time);
      break;
    case 'daffodil':
      drawFlower(ctx, radius, info.colors.primary, info.colors.secondary, 6, time);
      break;
    case 'clover':
      drawSucculent(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'hibiscus':
      drawFlower(ctx, radius, info.colors.primary, info.colors.accent, 5, time);
      break;
    case 'palm':
      drawFern(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'ginkgo':
      drawMapleLeaf(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'chrysanthemum':
      drawFlower(ctx, radius, info.colors.primary, info.colors.accent, 12, time);
      break;
    case 'pine':
      drawLavender(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'holly':
      drawSucculent(ctx, radius, info.colors.primary, info.colors.accent);
      break;
    case 'bee_balm':
      drawFlower(ctx, radius, info.colors.primary, info.colors.accent, 8, time);
      break;
    case 'honeysuckle':
      drawLavender(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
    case 'caterpillar':
      drawCaterpillar(ctx, radius, info.colors.primary, info.colors.accent, time);
      break;
    case 'leaf':
      drawSimpleLeaf(ctx, radius, info.colors.primary, info.colors.secondary);
      break;
  }
}

function drawCaterpillar(ctx: CanvasRenderingContext2D, r: number, color: string, stripe: string, time: number): void {
  const crawl = Math.sin(time * 0.004) * r * 0.08;
  ctx.save();
  ctx.translate(crawl, r * 0.15);

  for (let i = 0; i < 4; i++) {
    const x = -r * 0.55 + i * r * 0.32;
    ctx.fillStyle = i % 2 === 0 ? color : stripe;
    ctx.beginPath();
    ctx.arc(x, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.05, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3E2A1C';
  ctx.beginPath();
  ctx.arc(r * 0.58, -r * 0.12, r * 0.05, 0, Math.PI * 2);
  ctx.arc(r * 0.7, -r * 0.08, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = stripe;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.62, -r * 0.28);
  ctx.quadraticCurveTo(r * 0.75, -r * 0.55, r * 0.55, -r * 0.62);
  ctx.moveTo(r * 0.75, -r * 0.22);
  ctx.quadraticCurveTo(r * 0.95, -r * 0.45, r * 0.85, -r * 0.62);
  ctx.stroke();
  ctx.restore();
}

function drawSimpleLeaf(ctx: CanvasRenderingContext2D, r: number, color: string, vein: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.75);
  ctx.bezierCurveTo(r * 0.9, r * 0.2, r * 0.7, -r * 0.7, 0, -r * 0.85);
  ctx.bezierCurveTo(-r * 0.7, -r * 0.7, -r * 0.9, r * 0.2, 0, r * 0.75);
  ctx.fill();

  ctx.strokeStyle = vein;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.65);
  ctx.lineTo(0, -r * 0.7);
  ctx.moveTo(0, r * 0.2);
  ctx.lineTo(r * 0.35, -r * 0.05);
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.35, -r * 0.25);
  ctx.stroke();
}

function drawFlower(ctx: CanvasRenderingContext2D, r: number, color: string, centerColor: string, petals: number, time: number): void {
  const petalR = r * 0.5;
  ctx.fillStyle = color;

  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 + time * 0.001;
    const px = Math.cos(angle) * r * 0.4;
    const py = Math.sin(angle) * r * 0.4;

    ctx.beginPath();
    ctx.ellipse(px, py, petalR, petalR * 0.6, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = centerColor;
  ctx.fill();
}

function drawFern(ctx: CanvasRenderingContext2D, r: number, color: string, darkColor: string): void {
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, r * 0.8);
  ctx.quadraticCurveTo(r * 0.1, 0, 0, -r * 0.8);
  ctx.stroke();

  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const t = 0.2 + i * 0.15;
    const y = r * 0.8 - t * r * 1.6;
    const leafLen = r * (0.5 - i * 0.05);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(leafLen * 0.5, y - leafLen * 0.3, leafLen, y - leafLen * 0.1);
    ctx.quadraticCurveTo(leafLen * 0.5, y, 0, y);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(-leafLen * 0.5, y - leafLen * 0.3, -leafLen, y - leafLen * 0.1);
    ctx.quadraticCurveTo(-leafLen * 0.5, y, 0, y);
    ctx.fill();
  }
}

function drawLavender(ctx: CanvasRenderingContext2D, r: number, color: string, darkColor: string): void {
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, r * 0.8);
  ctx.lineTo(0, -r * 0.2);
  ctx.stroke();

  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const y = -r * 0.2 - i * r * 0.1;
    const w = r * (0.15 + (6 - i) * 0.02);

    ctx.beginPath();
    ctx.ellipse(-w * 0.3, y, w * 0.4, r * 0.06, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(w * 0.3, y, w * 0.4, r * 0.06, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLotus(ctx: CanvasRenderingContext2D, r: number, color: string, lightColor: string, time: number): void {
  ctx.fillStyle = '#88AA88';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.3, r * 0.8, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const petals = 7;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI - Math.PI / 2 + Math.sin(time * 0.001) * 0.05;
    const px = Math.cos(angle) * r * 0.3;
    const py = Math.sin(angle) * r * 0.3 - r * 0.1;

    ctx.fillStyle = i % 2 === 0 ? color : lightColor;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.35, r * 0.15, angle + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
}

function drawSucculent(ctx: CanvasRenderingContext2D, r: number, color: string, darkColor: string): void {
  const layers = 3;
  for (let layer = layers - 1; layer >= 0; layer--) {
    const petals = 5 + layer * 2;
    const layerR = r * (0.4 + layer * 0.2);
    const rotation = layer * 0.3;

    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 + rotation;
      const px = Math.cos(angle) * layerR * 0.3;
      const py = Math.sin(angle) * layerR * 0.3;

      ctx.fillStyle = layer === 0 ? darkColor : color;
      ctx.globalAlpha = 0.7 + layer * 0.1;
      ctx.beginPath();
      ctx.ellipse(px, py, layerR * 0.35, layerR * 0.2, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawMapleLeaf(ctx: CanvasRenderingContext2D, r: number, color: string, darkColor: string): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const dist = i % 2 === 0 ? r * 0.8 : r * 0.35;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.8);
  ctx.lineTo(0, -r * 0.6);
  ctx.stroke();
}

function drawFoldAxis(
  ctx: CanvasRenderingContext2D,
  config: RenderConfig,
  grid: GridState,
  axis: { direction: 'h' | 'v'; index: number }
): void {
  const { tileSize, gridOffsetX, gridOffsetY } = config;

  ctx.save();
  ctx.strokeStyle = '#D4788A';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.globalAlpha = 0.8;

  ctx.beginPath();
  if (axis.direction === 'h') {
    const y = gridOffsetY + axis.index * tileSize;
    ctx.moveTo(gridOffsetX - 8, y);
    ctx.lineTo(gridOffsetX + grid.cols * tileSize + 8, y);
  } else {
    const x = gridOffsetX + axis.index * tileSize;
    ctx.moveTo(x, gridOffsetY - 8);
    ctx.lineTo(x, gridOffsetY + grid.rows * tileSize + 8);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawTarget(
  config: RenderConfig,
  target: (PlantType | null)[][],
  yOffset: number,
  time: number,
  label: string = 'Target Pattern'
): void {
  const { ctx, width } = config;
  const rows = target.length;
  const cols = target[0].length;
  const tileSize = Math.min(36, (width - 80) / cols);

  const totalW = cols * tileSize;
  const totalH = rows * tileSize;
  const startX = (width - totalW) / 2;
  const startY = yOffset;

  ctx.fillStyle = '#8B7B6B';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, width / 2, startY - 8);

  ctx.save();
  ctx.fillStyle = '#FFF8F0';
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 6;
  roundRect(ctx, startX - 8, startY - 4, totalW + 16, totalH + 8, 8);
  ctx.fill();
  ctx.restore();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * tileSize;
      const y = startY + r * tileSize;
      if (target[r][c]) {
        drawPlantTile(ctx, x, y, tileSize, target[r][c]!, time, false);
      }
    }
  }
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function clearCanvas(config: RenderConfig, bgColor: string = '#F5F0E8'): void {
  const { ctx, width, height } = config;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
}

export function drawPaperTexture(config: RenderConfig): void {
  const { ctx, width, height } = config;
  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const s = Math.random() * 2 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#8B7B6B';
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}
