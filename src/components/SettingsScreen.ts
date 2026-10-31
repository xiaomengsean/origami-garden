import { useAppStore } from '../store/app-store.ts';
import { useSettingsStore } from '../store/settings-store.ts';

export class SettingsScreen {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const settings = useSettingsStore.getState();

    this.container.innerHTML = `
      <div class="screen settings-screen">
        <div class="screen-header">
          <button class="back-btn" data-action="back">←</button>
          <h2 class="screen-title">Settings</h2>
          <div></div>
        </div>

        <div class="settings-list">
          <div class="settings-group">
            <h3 class="settings-group-title">Audio</h3>

            <div class="setting-item">
              <label class="setting-label">🎵 Music</label>
              <input type="range" class="setting-slider" id="music-vol"
                     min="0" max="100" value="${Math.round(settings.musicVolume * 100)}">
            </div>

            <div class="setting-item">
              <label class="setting-label">🔔 Sound Effects</label>
              <input type="range" class="setting-slider" id="sfx-vol"
                     min="0" max="100" value="${Math.round(settings.sfxVolume * 100)}">
            </div>

            <div class="setting-item">
              <label class="setting-label">🌊 Ambient</label>
              <input type="range" class="setting-slider" id="ambient-vol"
                     min="0" max="100" value="${Math.round(settings.ambientVolume * 100)}">
            </div>
          </div>

          <div class="settings-group">
            <h3 class="settings-group-title">Gameplay</h3>

            <div class="setting-item">
              <label class="setting-label">📳 Haptic Feedback</label>
              <button class="setting-toggle ${settings.hapticEnabled ? 'active' : ''}" id="haptic-toggle">
                ${settings.hapticEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div class="setting-item">
              <label class="setting-label">⏱️ Show Timer</label>
              <button class="setting-toggle ${settings.showTimer ? 'active' : ''}" id="timer-toggle">
                ${settings.showTimer ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="settings-group-title">About</h3>
            <div class="about-info">
              <p>Origami Garden v1.0.0</p>
              <p class="about-subtitle">Fold. Grow. Find peace.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      useAppStore.getState().navigateTo('main_menu');
    });

    document.getElementById('music-vol')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value) / 100;
      useSettingsStore.getState().setMusicVolume(val);
    });

    document.getElementById('sfx-vol')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value) / 100;
      useSettingsStore.getState().setSfxVolume(val);
    });

    document.getElementById('ambient-vol')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value) / 100;
      useSettingsStore.getState().setAmbientVolume(val);
    });

    document.getElementById('haptic-toggle')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const current = useSettingsStore.getState().hapticEnabled;
      useSettingsStore.getState().setHapticEnabled(!current);
      btn.textContent = !current ? 'ON' : 'OFF';
      btn.classList.toggle('active');
    });

    document.getElementById('timer-toggle')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const current = useSettingsStore.getState().showTimer;
      useSettingsStore.getState().setShowTimer(!current);
      btn.textContent = !current ? 'ON' : 'OFF';
      btn.classList.toggle('active');
    });
  }
}
