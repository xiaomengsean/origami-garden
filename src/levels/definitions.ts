import type { FoldAction, FoldDirection, LevelDefinition, PlantType } from '../types/index.ts';
import { WORLDS } from '../game/plants.ts';

type Grid = PlantType[][];

interface Blueprint {
  tiles: Grid;
  target: Grid;
  minFolds: number;
  solution: FoldAction[];
}

const PREFIX: Record<string, string> = {
  paper_playground: 'pp',
  moss_path: 'mp',
  lotus_lake: 'll',
  maple_temple: 'mt',
  spring_sprout: 'sp',
  summer_sunset: 'sm',
  autumn_leaves: 'au',
  winter_wonder: 'ww',
  buzzing_bees: 'bb',
  crawling_caterpillars: 'cc',
};

function crease(direction: FoldDirection): FoldAction {
  return { direction, axisIndex: 1 };
}

function pairGrid(rows: [PlantType, PlantType][]): Grid {
  return rows.map(([left, right]) => [left, right]);
}

function buildBlueprints(a: PlantType, b: PlantType): Blueprint[] {
  return [
    { tiles: [[a, a], [b, b]], target: [[a, a]], minFolds: 1, solution: [crease('down')] },
    { tiles: [[a, a], [b, b]], target: [[b, b]], minFolds: 1, solution: [crease('up')] },
    { tiles: [[b, a], [b, a]], target: [[a], [a]], minFolds: 1, solution: [crease('left')] },
    { tiles: [[a, b], [a, b]], target: [[a], [a]], minFolds: 1, solution: [crease('right')] },
    { tiles: [[a, b], [b, a]], target: [[a, b]], minFolds: 1, solution: [crease('down')] },
    { tiles: [[a, b], [b, a]], target: [[b, a]], minFolds: 1, solution: [crease('up')] },
    { tiles: [[a, b, a], [b, a, b]], target: [[a, b, a]], minFolds: 1, solution: [crease('down')] },
    { tiles: [[a, b, a], [b, a, b]], target: [[b, a, b]], minFolds: 1, solution: [crease('up')] },
    { tiles: [[b, a], [b, a], [b, a]], target: [[a], [a], [a]], minFolds: 1, solution: [crease('left')] },
    { tiles: [[a, b], [a, b], [a, b]], target: [[a], [a], [a]], minFolds: 1, solution: [crease('right')] },
    { tiles: [[a, a, b, b], [b, b, a, a]], target: [[a, a, b, b]], minFolds: 1, solution: [crease('down')] },
    { tiles: [[a, a, b, b], [b, b, a, a]], target: [[b, b, a, a]], minFolds: 1, solution: [crease('up')] },
    {
      tiles: pairGrid([[b, a], [a, b], [b, a], [a, b]]),
      target: [[a], [b], [a], [b]],
      minFolds: 1,
      solution: [crease('left')],
    },
    {
      tiles: pairGrid([[a, b], [b, a], [b, a], [a, b]]),
      target: [[a], [b], [b], [a]],
      minFolds: 1,
      solution: [crease('right')],
    },
    { tiles: [[a, b, a, b, a], [b, a, b, a, b]], target: [[a, b, a, b, a]], minFolds: 1, solution: [crease('down')] },
    { tiles: [[a, b, a, b, a], [b, a, b, a, b]], target: [[b, a, b, a, b]], minFolds: 1, solution: [crease('up')] },
    {
      tiles: pairGrid([[b, a], [b, a], [a, b], [a, b], [b, a]]),
      target: [[a], [a], [b], [b], [a]],
      minFolds: 1,
      solution: [crease('left')],
    },
    {
      tiles: pairGrid([[b, a], [a, b], [a, b], [b, a], [b, a]]),
      target: [[b], [a], [a], [b], [b]],
      minFolds: 1,
      solution: [crease('right')],
    },
    { tiles: [[a, b, b, a, a, b], [b, a, a, b, b, a]], target: [[a, b, b, a, a, b]], minFolds: 1, solution: [crease('down')] },
    {
      tiles: pairGrid([[a, b], [a, b], [b, a], [b, a], [a, b], [b, a]]),
      target: [[b], [b], [a], [a], [b], [a]],
      minFolds: 1,
      solution: [crease('left')],
    },
    { tiles: [[a, b], [b, a]], target: [[a]], minFolds: 2, solution: [crease('down'), crease('right')] },
    { tiles: [[a, b], [b, a]], target: [[b]], minFolds: 2, solution: [crease('down'), crease('left')] },
    { tiles: [[a, b], [b, a]], target: [[b]], minFolds: 2, solution: [crease('up'), crease('right')] },
    { tiles: [[a, b], [b, a]], target: [[a]], minFolds: 2, solution: [crease('up'), crease('left')] },
    { tiles: [[b, a], [a, b]], target: [[b]], minFolds: 2, solution: [crease('down'), crease('right')] },
    { tiles: [[b, a], [a, b]], target: [[a]], minFolds: 2, solution: [crease('down'), crease('left')] },
    { tiles: [[a, a, b], [b, b, a]], target: [[a, a, b]], minFolds: 1, solution: [crease('down')] },
    {
      tiles: pairGrid([[a, b], [b, a], [a, b]]),
      target: [[a], [b], [a]],
      minFolds: 1,
      solution: [crease('right')],
    },
    { tiles: [[b, a, a, b], [a, b, b, a]], target: [[b, a, a, b]], minFolds: 1, solution: [crease('down')] },
    {
      tiles: pairGrid([[a, b], [a, b], [b, a], [b, a]]),
      target: [[b], [b], [a], [a]],
      minFolds: 1,
      solution: [crease('left')],
    },
  ];
}

function toLevel(
  worldId: string,
  prefix: string,
  number: number,
  blueprint: Blueprint,
): LevelDefinition {
  const level: LevelDefinition = {
    id: `${prefix}_${number}`,
    worldId,
    levelNumber: number,
    gridRows: blueprint.tiles.length,
    gridCols: blueprint.tiles[0].length,
    tiles: blueprint.tiles,
    target: blueprint.target,
    targetRows: blueprint.target.length,
    targetCols: blueprint.target[0].length,
    maxFolds: blueprint.minFolds + 2,
    minFolds: blueprint.minFolds,
  };

  if (worldId === 'paper_playground' && number === 1) {
    level.tutorial = [{
      message: 'Swipe down to fold the top onto the bottom',
      highlightDirection: 'down',
      highlightAxis: 1,
    }];
  }

  return level;
}

export const LEVEL_SOLUTIONS: Record<string, FoldAction[]> = {};

export const LEVELS: LevelDefinition[] = WORLDS.flatMap(world => {
  const prefix = PREFIX[world.id];
  const [primary, secondary] = world.plants;
  return buildBlueprints(primary, secondary).map((blueprint, index) => {
    const level = toLevel(world.id, prefix, index + 1, blueprint);
    LEVEL_SOLUTIONS[level.id] = blueprint.solution;
    return level;
  });
});

export function getLevelsForWorld(worldId: string): LevelDefinition[] {
  return LEVELS.filter(l => l.worldId === worldId).sort((a, b) => a.levelNumber - b.levelNumber);
}

export function getLevelById(id: string): LevelDefinition | undefined {
  return LEVELS.find(l => l.id === id);
}
