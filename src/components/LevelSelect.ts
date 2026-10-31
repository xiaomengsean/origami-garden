import { useAppStore } from '../store/app-store.ts';
import { useProgressStore } from '../store/progress-store.ts';
import { useGameStore } from '../store/game-store.ts';
import { WORLDS } from '../game/plants.ts';
import { getLevelsForWorld } from '../levels/definitions.ts';

export class LevelSelect {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const { selectedWorldId } = useAppStore.getState();
    const progress = useProgressStore.getState();

    const world = WORLDS.find(w => w.id === selectedWorldId);
    if (!world) return;

    const levels = getLevelsForWorld(world.id);

    const levelButtons = levels.map((level, index) => {
      const stars = progress.levelStars[level.id] || 0;
      const prevLevelId = index > 0 ? levels[index - 1].id : null;
      const prevStars = prevLevelId ? (progress.levelStars[prevLevelId] || 0) : 1;
      const unlocked = index === 0 || prevStars > 0;

      const starDisplay = stars > 0
        ? '★'.repeat(stars) + '☆'.repeat(3 - stars)
        : '☆☆☆';

      return `
        <button class="level-btn ${unlocked ? '' : 'locked'} ${stars === 3 ? 'perfect' : ''}"
                data-level="${level.id}"
                ${unlocked ? '' : 'disabled'}>
          <span class="level-number">${level.levelNumber}</span>
          <span class="level-stars">${starDisplay}</span>
          ${!unlocked ? '<span class="level-lock">🔒</span>' : ''}
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen level-select-screen" style="--world-color: ${world.color}; --world-bg1: ${world.bgGradient[0]}; --world-bg2: ${world.bgGradient[1]}">
        <div class="screen-header">
          <button class="back-btn" data-action="back">←</button>
          <h2 class="screen-title">${world.name}</h2>
          <div class="header-stars">⭐ ${progress.getWorldStars(world.id)}</div>
        </div>
        <p class="world-subtitle-text">${world.subtitle}</p>
        <div class="level-grid">
          ${levelButtons}
        </div>
      </div>
    `;

    this.container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      useAppStore.getState().navigateTo('world_select');
    });

    this.container.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', () => {
        const levelId = btn.getAttribute('data-level')!;
        const level = levels.find(l => l.id === levelId);
        if (!level) return;

        useGameStore.getState().loadLevel(level);
        const store = useAppStore.getState();
        store.selectLevel(levelId);
        store.navigateTo('gameplay');
      });
    });
  }
}
