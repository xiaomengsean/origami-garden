import { LEVELS, LEVEL_SOLUTIONS } from '../src/levels/definitions.ts';
import { WORLDS } from '../src/game/plants.ts';
import { applyFold, checkWin, createGrid } from '../src/game/grid.ts';

let failed = 0;

for (const world of WORLDS) {
  const levels = LEVELS.filter(level => level.worldId === world.id);
  if (levels.length !== 30) {
    console.error(`${world.id} has ${levels.length} levels`);
    failed++;
  }
  const maxStarsBefore = WORLDS
    .filter(earlier => WORLDS.indexOf(earlier) < WORLDS.indexOf(world))
    .reduce((sum, earlier) => sum + earlier.levelCount * 3, 0);
  if (world.unlockStars > maxStarsBefore) {
    console.error(`${world.id} unlock ${world.unlockStars} exceeds ${maxStarsBefore} available stars`);
    failed++;
  }
}

for (const level of LEVELS) {
  const solution = LEVEL_SOLUTIONS[level.id];
  if (!solution || solution.length !== level.minFolds) {
    console.error(`${level.id} solution length mismatch`);
    failed++;
    continue;
  }
  let grid = createGrid(level.tiles);
  for (const fold of solution) {
    grid = applyFold(grid, fold);
  }
  if (!checkWin(grid, level.target)) {
    console.error(`${level.id} solution does not match target`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed} checks failed`);
  process.exit(1);
}

console.log(`Verified ${LEVELS.length} levels across ${WORLDS.length} worlds`);
