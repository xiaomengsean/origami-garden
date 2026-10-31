import { useAppStore } from '../store/app-store.ts';
import { useProgressStore } from '../store/progress-store.ts';
import { WORLDS, getPlantEmoji } from '../game/plants.ts';
import { getLevelsForWorld } from '../levels/definitions.ts';

export class WorldSelect {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const progress = useProgressStore.getState();

    const worldCards = WORLDS.map(world => {
      const unlocked = progress.isWorldUnlocked(world.id);
      const stars = progress.getWorldStars(world.id);
      const maxStars = getLevelsForWorld(world.id).length * 3;
      const plantEmojis = world.plants.map(p => getPlantEmoji(p)).join(' ');

      return `
        <button class="world-card ${unlocked ? '' : 'locked'}"
                data-world="${world.id}"
                ${unlocked ? '' : 'disabled'}
                style="--world-color: ${world.color}; --world-bg1: ${world.bgGradient[0]}; --world-bg2: ${world.bgGradient[1]}">
          <div class="world-card-inner">
            <div class="world-plants">${plantEmojis}</div>
            <h3 class="world-name">${world.name}</h3>
            <p class="world-subtitle">${world.subtitle}</p>
            <div class="world-progress">
              <span class="world-stars">⭐ ${stars}/${maxStars}</span>
            </div>
            ${!unlocked ? `<div class="world-lock">🔒 ${world.unlockStars} stars</div>` : ''}
          </div>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen world-select-screen">
        <div class="screen-header">
          <button class="back-btn" data-action="back">←</button>
          <h2 class="screen-title">Worlds</h2>
          <div class="header-stars">⭐ ${progress.totalStars}</div>
        </div>
        <div class="world-grid">
          ${worldCards}
        </div>
      </div>
    `;

    this.container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      useAppStore.getState().navigateTo('main_menu');
    });

    this.container.querySelectorAll('[data-world]').forEach(card => {
      card.addEventListener('click', () => {
        const worldId = card.getAttribute('data-world')!;
        const store = useAppStore.getState();
        store.selectWorld(worldId);
        store.navigateTo('level_select');
      });
    });
  }
}
