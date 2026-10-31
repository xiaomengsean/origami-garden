import { useAppStore } from '../store/app-store.ts';
import { useProgressStore } from '../store/progress-store.ts';

export class MainMenu {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const { totalStars } = useProgressStore.getState();

    this.container.innerHTML = `
      <div class="main-menu">
        <div class="menu-bg">
          <div class="floating-petal petal-1"></div>
          <div class="floating-petal petal-2"></div>
          <div class="floating-petal petal-3"></div>
          <div class="floating-petal petal-4"></div>
          <div class="floating-petal petal-5"></div>
        </div>

        <div class="menu-content">
          <div class="menu-title-area">
            <div class="menu-icon">🌸</div>
            <h1 class="menu-title">Origami<br>Garden</h1>
            <p class="menu-subtitle">Fold. Grow. Find peace.</p>
          </div>

          <div class="menu-stars">
            <span class="star-icon">⭐</span>
            <span class="star-count">${totalStars}</span>
          </div>

          <div class="menu-buttons">
            <button class="menu-btn menu-btn-primary" data-action="play">
              <span class="btn-icon">🌿</span>
              <span class="btn-text">Play</span>
            </button>
            <button class="menu-btn" data-action="daily">
              <span class="btn-icon">🌅</span>
              <span class="btn-text">Daily Garden</span>
            </button>
            <button class="menu-btn" data-action="garden">
              <span class="btn-icon">🏡</span>
              <span class="btn-text">My Garden</span>
            </button>
            <button class="menu-btn" data-action="settings">
              <span class="btn-icon">⚙️</span>
              <span class="btn-text">Settings</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const store = useAppStore.getState();
        switch (action) {
          case 'play':
            store.navigateTo('world_select');
            break;
          case 'garden':
            store.navigateTo('my_garden');
            break;
          case 'settings':
            store.navigateTo('settings');
            break;
          case 'daily':
            store.navigateTo('world_select');
            break;
        }
      });
    });
  }
}
