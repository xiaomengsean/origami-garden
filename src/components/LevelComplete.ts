import { useAppStore } from '../store/app-store.ts';
import { useGameStore } from '../store/game-store.ts';
import { WORLDS, getPlantEmoji } from '../game/plants.ts';
import { getLevelsForWorld } from '../levels/definitions.ts';

export class LevelComplete {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const { stars, foldCount, currentLevel } = useGameStore.getState();
    if (!currentLevel) return;

    const world = WORLDS.find(w => w.id === currentLevel.worldId);
    const plant = world?.plants[0];
    const plantEmoji = plant ? getPlantEmoji(plant) : '🌱';

    const growthLabel = stars >= 3 ? 'Fruiting' : stars >= 2 ? 'Flowering' : 'Seedling';
    const growthEmoji = stars >= 3 ? '🍒' : stars >= 2 ? '🌸' : '🌱';

    const titles = ['', 'Nice Fold!', 'Beautiful!', 'Perfect Fold!'];
    const title = titles[stars] || 'Complete!';

    const starDisplay = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    this.container.innerHTML = `
      <div class="level-complete-overlay">
        <div class="level-complete-card">
          <div class="complete-petals">
            <div class="complete-petal cp-1">🌸</div>
            <div class="complete-petal cp-2">🌿</div>
            <div class="complete-petal cp-3">🌸</div>
            <div class="complete-petal cp-4">🍃</div>
          </div>

          <h2 class="complete-title">${title}</h2>
          <div class="complete-stars">${starDisplay}</div>

          <div class="complete-info">
            <div class="info-item">
              <span class="info-label">Folds used</span>
              <span class="info-value">${foldCount}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Minimum</span>
              <span class="info-value">${currentLevel.minFolds}</span>
            </div>
          </div>

          <div class="plant-reward">
            <div class="reward-icon">${plantEmoji}</div>
            <div class="reward-text">
              <span class="reward-label">Plant Growth</span>
              <span class="reward-phase">${growthEmoji} ${growthLabel}</span>
            </div>
          </div>

          <div class="complete-buttons">
            <button class="complete-btn" data-action="retry">
              🔄 Retry
            </button>
            <button class="complete-btn complete-btn-primary" data-action="next">
              Next Level →
            </button>
          </div>

          <button class="complete-btn-secondary" data-action="levels">
            Back to Levels
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      useAppStore.getState().setShowLevelComplete(false);
      useGameStore.getState().reset();
    });

    this.container.querySelector('[data-action="next"]')?.addEventListener('click', () => {
      const level = currentLevel;
      const levels = getLevelsForWorld(level.worldId);
      const currentIndex = levels.findIndex(l => l.id === level.id);
      const nextLevel = levels[currentIndex + 1];

      useAppStore.getState().setShowLevelComplete(false);

      if (nextLevel) {
        useGameStore.getState().loadLevel(nextLevel);
        useAppStore.getState().selectLevel(nextLevel.id);
      } else {
        useAppStore.getState().navigateTo('world_select');
      }
    });

    this.container.querySelector('[data-action="levels"]')?.addEventListener('click', () => {
      useAppStore.getState().setShowLevelComplete(false);
      useAppStore.getState().navigateTo('level_select');
    });
  }
}
