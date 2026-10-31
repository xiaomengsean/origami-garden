import { useAppStore } from '../store/app-store.ts';
import { MainMenu } from './MainMenu.ts';
import { WorldSelect } from './WorldSelect.ts';
import { LevelSelect } from './LevelSelect.ts';
import { GameScreen } from './GameScreen.ts';
import { MyGarden } from './MyGarden.ts';
import { SettingsScreen } from './SettingsScreen.ts';
import { LevelComplete } from './LevelComplete.ts';
import '../style.css';

export class App {
  private root: HTMLElement;
  private currentScreen: string = '';
  private unsubscribe: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount(): void {
    this.unsubscribe = useAppStore.subscribe(() => this.render());
    this.render();
  }

  destroy(): void {
    this.unsubscribe?.();
  }

  private render(): void {
    const { screen, showLevelComplete, transition } = useAppStore.getState();

    if (this.currentScreen !== screen) {
      this.currentScreen = screen;
      this.root.innerHTML = '';
      this.root.className = `app-container transition-${transition}`;

      const container = document.createElement('div');
      container.className = 'screen-container';
      this.root.appendChild(container);

      switch (screen) {
        case 'main_menu':
          new MainMenu(container).render();
          break;
        case 'world_select':
          new WorldSelect(container).render();
          break;
        case 'level_select':
          new LevelSelect(container).render();
          break;
        case 'gameplay':
          new GameScreen(container).render();
          break;
        case 'my_garden':
          new MyGarden(container).render();
          break;
        case 'settings':
          new SettingsScreen(container).render();
          break;
      }
    }

    if (showLevelComplete) {
      let overlay = document.getElementById('level-complete-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'level-complete-overlay';
        this.root.appendChild(overlay);
        new LevelComplete(overlay).render();
      }
    } else {
      document.getElementById('level-complete-overlay')?.remove();
    }
  }
}
