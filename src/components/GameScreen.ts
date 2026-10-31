import { useAppStore } from '../store/app-store.ts';
import { useGameStore } from '../store/game-store.ts';
import { useProgressStore } from '../store/progress-store.ts';
import { WORLDS } from '../game/plants.ts';
import {
  setupCanvas, calculateLayout, drawGrid, drawTarget,
  clearCanvas, drawPaperTexture,
  type RenderConfig,
} from '../engine/renderer.ts';
import { createInputHandler, calculateFoldFromSwipe } from '../engine/input.ts';
import { playFoldSound, playCompleteSound, playUndoSound, resumeAudio, startAmbientMusic } from '../audio/zen-audio.ts';
import { findNextFold } from '../game/grid.ts';
import type { FoldAction } from '../types/index.ts';

export class GameScreen {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private config: RenderConfig | null = null;
  private animFrameId: number = 0;
  private destroyInput: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;
  private hintFold: FoldAction | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const gameState = useGameStore.getState();
    const level = gameState.currentLevel;
    if (!level) return;

    const world = WORLDS.find(w => w.id === level.worldId);
    const worldColor = world?.color || '#F4A7B9';

    this.container.innerHTML = `
      <div class="screen game-screen">
        <div class="game-header">
          <button class="back-btn" data-action="back">←</button>
          <div class="game-info">
            <span class="level-label">Level ${level.levelNumber}</span>
            <span class="fold-counter" style="color: ${worldColor}">
              Folds: <span id="fold-count">0</span>${level.maxFolds > 0 ? `/${level.maxFolds}` : ''}
            </span>
          </div>
          <button class="hint-btn" data-action="hint">💡</button>
        </div>

        <div class="game-canvas-area">
          <canvas id="game-canvas"></canvas>
          <div id="hint-banner" class="hint-banner" hidden></div>
        </div>

        <div class="game-controls">
          <button class="control-btn" data-action="undo">
            <span class="control-icon">↩️</span>
            <span class="control-label">Undo</span>
          </button>
          <button class="control-btn" data-action="reset">
            <span class="control-icon">🔄</span>
            <span class="control-label">Reset</span>
          </button>
        </div>
      </div>
    `;

    this.setupCanvas();
    this.setupInput();
    this.setupControls();
    this.startGameLoop();
    resumeAudio();
    startAmbientMusic();

    this.unsubscribe = useGameStore.subscribe(() => {
      const state = useGameStore.getState();
      const foldEl = document.getElementById('fold-count');
      if (foldEl) foldEl.textContent = String(state.foldCount);

      if (state.isComplete && !useAppStore.getState().showLevelComplete) {
        playCompleteSound();
        setTimeout(() => {
          const lvl = state.currentLevel;
          if (lvl) {
            const plant = WORLDS.find(w => w.id === lvl.worldId)?.plants[0];
            if (plant) {
              useProgressStore.getState().completeLevel(lvl.id, state.stars, plant);
            }
          }
          useAppStore.getState().setShowLevelComplete(true);
        }, 600);
      }
    });
  }

  private setupCanvas(): void {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;

    const area = this.canvas.parentElement!;
    const rect = area.getBoundingClientRect();
    this.config = setupCanvas(this.canvas, rect.width, rect.height);
  }

  private setupInput(): void {
    if (!this.canvas) return;

    this.destroyInput = createInputHandler(
      this.canvas,
      (direction, position) => {
        const gameState = useGameStore.getState();
        if (!gameState.grid || !this.config || gameState.isAnimating || gameState.isComplete) return;

        const layout = calculateLayout(this.config, gameState.grid.rows, gameState.grid.cols, 100);
        const fold = calculateFoldFromSwipe(
          direction, position,
          layout.gridOffsetX, layout.gridOffsetY,
          layout.tileSize,
          gameState.grid.rows, gameState.grid.cols
        );

        if (fold) {
          this.clearHint();
          playFoldSound();
          useGameStore.getState().executeFold(fold);
          setTimeout(() => {
            useGameStore.getState().completeFoldAnimation();
          }, 300);
        }
      },
      () => { /* tap handler - could show fold hints */ }
    );
  }

  private setupControls(): void {
    this.container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.cleanup();
      useAppStore.getState().navigateTo('level_select');
    });

    this.container.querySelector('[data-action="undo"]')?.addEventListener('click', () => {
      this.clearHint();
      playUndoSound();
      useGameStore.getState().undo();
    });

    this.container.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      this.clearHint();
      useGameStore.getState().reset();
    });

    this.container.querySelector('[data-action="hint"]')?.addEventListener('click', () => {
      this.showHint();
    });
  }

  private startGameLoop(): void {
    const loop = (time: number) => {
      this.renderFrame(time);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private renderFrame(time: number): void {
    const state = useGameStore.getState();
    if (!this.config || !state.grid || !state.target) return;

    const layout = calculateLayout(this.config, state.grid.rows, state.grid.cols, 100);

    clearCanvas(layout);
    drawPaperTexture(layout);

    const hintFold = this.hintFold;

    drawGrid(layout, state.grid, time, hintFold ? foldAxis(hintFold) : null);
    if (hintFold) this.drawHintArrow(layout, hintFold, time);

    const targetY = layout.gridOffsetY + state.grid.rows * layout.tileSize + 20;
    drawTarget(layout, state.target, targetY, time);

    if (state.isComplete) {
      this.drawCompletionEffect(layout, time);
    }
  }

  private showHint(): void {
    const { grid, target, isComplete } = useGameStore.getState();
    const banner = document.getElementById('hint-banner');
    if (!banner) return;

    if (!grid || !target || isComplete) {
      banner.hidden = true;
      return;
    }

    const fold = findNextFold(grid, target);
    banner.hidden = false;
    if (!fold) {
      this.hintFold = null;
      banner.textContent = 'This fold cannot reach the target. Tap Undo.';
      return;
    }

    const arrows: Record<FoldAction['direction'], string> = {
      down: '↓',
      up: '↑',
      left: '←',
      right: '→',
    };
    banner.textContent = `Swipe ${fold.direction} ${arrows[fold.direction]}`;
    this.hintFold = fold;
  }

  private clearHint(): void {
    this.hintFold = null;
    const banner = document.getElementById('hint-banner');
    if (banner) banner.hidden = true;
  }

  private drawHintArrow(config: RenderConfig, fold: FoldAction, time: number): void {
    const { ctx, tileSize, gridOffsetX, gridOffsetY } = config;
    const state = useGameStore.getState();
    if (!state.grid) return;

    const pulse = 0.55 + Math.sin(time * 0.008) * 0.35;
    const cx = gridOffsetX + (state.grid.cols * tileSize) / 2;
    const cy = gridOffsetY + (state.grid.rows * tileSize) / 2;
    const reach = tileSize * 0.55;

    let x2 = cx;
    let y2 = cy;
    if (fold.direction === 'down') y2 += reach;
    if (fold.direction === 'up') y2 -= reach;
    if (fold.direction === 'left') x2 -= reach;
    if (fold.direction === 'right') x2 += reach;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#E07830';
    ctx.fillStyle = '#E07830';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - cy, x2 - cx);
    ctx.translate(x2, y2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-14, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawCompletionEffect(config: RenderConfig, time: number): void {
    const { ctx, width, height } = config;
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.sin(time * 0.003) * 0.05;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private cleanup(): void {
    cancelAnimationFrame(this.animFrameId);
    this.destroyInput?.();
    this.unsubscribe?.();
  }
}

function foldAxis(fold: FoldAction): { direction: 'h' | 'v'; index: number } {
  if (fold.direction === 'up' || fold.direction === 'down') {
    return { direction: 'h', index: fold.axisIndex };
  }
  return { direction: 'v', index: fold.axisIndex };
}
