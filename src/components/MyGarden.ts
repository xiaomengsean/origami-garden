import { useAppStore } from '../store/app-store.ts';
import { useProgressStore } from '../store/progress-store.ts';
import { WORLDS, PLANT_DATA, ALL_PLANTS, getPlantEmoji } from '../game/plants.ts';
import type { GrowthPhase, PlantType } from '../types/index.ts';

export class MyGarden {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    const progress = useProgressStore.getState();

    const totalPlants = ALL_PLANTS.length;
    const collectedPlants = ALL_PLANTS.filter(p => progress.plantGrowth[p]).length;
    const fruitingPlants = ALL_PLANTS.filter(p => progress.plantGrowth[p] === 'fruiting').length;

    const gardenZones = WORLDS.map(world => {
      const plants = world.plants.map(plant => {
        const growth = progress.getPlantGrowth(plant);
        const info = PLANT_DATA[plant];
        return this.renderPlantCard(plant, info.displayName, growth);
      }).join('');

      const zoneComplete = world.plants.every(p => progress.plantGrowth[p] === 'fruiting');

      return `
        <div class="garden-zone" style="--zone-color: ${world.color}">
          <div class="zone-header">
            <h3 class="zone-name">${world.name}</h3>
            ${zoneComplete ? '<span class="zone-complete">✨ Complete</span>' : ''}
          </div>
          <div class="zone-plants">
            ${plants}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen garden-screen">
        <div class="screen-header">
          <button class="back-btn" data-action="back">←</button>
          <h2 class="screen-title">My Garden</h2>
          <div class="header-info">🌱 ${collectedPlants}/${totalPlants}</div>
        </div>

        <div class="garden-progress">
          <div class="garden-progress-bar">
            <div class="garden-progress-fill" style="width: ${(fruitingPlants / totalPlants) * 100}%"></div>
          </div>
          <span class="garden-progress-text">${fruitingPlants}/${totalPlants} plants at full bloom</span>
        </div>

        <div class="garden-zones">
          ${gardenZones}
        </div>
      </div>
    `;

    this.container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      useAppStore.getState().navigateTo('main_menu');
    });
  }

  private renderPlantCard(plant: PlantType, name: string, growth: GrowthPhase | null): string {
    const info = PLANT_DATA[plant];
    const phaseIcons: Record<GrowthPhase, string> = {
      seedling: '🌱',
      flowering: '🌸',
      fruiting: '🍒',
    };

    const plantEmoji = getPlantEmoji(plant);

    if (!growth) {
      return `
        <div class="plant-card plant-locked">
          <div class="plant-icon-area">
            <span class="plant-silhouette">❓</span>
          </div>
          <span class="plant-name">???</span>
          <span class="plant-phase">Not discovered</span>
        </div>
      `;
    }

    const phases: GrowthPhase[] = ['seedling', 'flowering', 'fruiting'];
    const phaseIndex = phases.indexOf(growth);
    const phaseDots = phases.map((p, i) => {
      if (i <= phaseIndex) return `<span class="phase-dot active" title="${p}">●</span>`;
      return `<span class="phase-dot" title="${p}">○</span>`;
    }).join('');

    return `
      <div class="plant-card plant-${growth}" style="--plant-color: ${info.colors.primary}">
        <div class="plant-icon-area">
          <span class="plant-emoji">${plantEmoji}</span>
          ${growth === 'fruiting' ? '<span class="plant-sparkle">✨</span>' : ''}
        </div>
        <span class="plant-name">${name}</span>
        <span class="plant-phase">${phaseIcons[growth]} ${growth}</span>
        <div class="phase-dots">${phaseDots}</div>
      </div>
    `;
  }
}
