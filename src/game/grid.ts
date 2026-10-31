import type { FoldAction, GridState, PlantType, Tile } from '../types/index.ts';

export function createGrid(tiles: (PlantType | null)[][]): GridState {
  const rows = tiles.length;
  const cols = tiles[0].length;
  const layers: Tile[][][] = [];

  for (let r = 0; r < rows; r++) {
    layers[r] = [];
    for (let c = 0; c < cols; c++) {
      if (tiles[r][c]) {
        layers[r][c] = [{ plant: tiles[r][c]! }];
      } else {
        layers[r][c] = [];
      }
    }
  }

  return { rows, cols, layers };
}

export function getTopLayer(grid: GridState): (PlantType | null)[][] {
  const result: (PlantType | null)[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    result[r] = [];
    for (let c = 0; c < grid.cols; c++) {
      const stack = grid.layers[r][c];
      result[r][c] = stack.length > 0 ? stack[stack.length - 1].plant : null;
    }
  }
  return result;
}

export function cloneGrid(grid: GridState): GridState {
  const layers: Tile[][][] = [];
  for (let r = 0; r < grid.rows; r++) {
    layers[r] = [];
    for (let c = 0; c < grid.cols; c++) {
      layers[r][c] = grid.layers[r][c].map(t => ({ ...t }));
    }
  }
  return { rows: grid.rows, cols: grid.cols, layers };
}

export function applyFold(grid: GridState, fold: FoldAction): GridState {
  const newGrid = cloneGrid(grid);

  // Swipe direction maps to physical paper fold:
  // Swipe DOWN = top part folds down onto bottom (top ends on top)
  // Swipe UP = bottom part folds up onto top (bottom ends on top)
  // Swipe LEFT = right part folds left onto left (right ends on top)
  // Swipe RIGHT = left part folds right onto right (left ends on top)
  switch (fold.direction) {
    case 'up':
      return foldDown(newGrid, fold.axisIndex);
    case 'down':
      return foldUp(newGrid, fold.axisIndex);
    case 'left':
      return foldRight(newGrid, fold.axisIndex);
    case 'right':
      return foldLeft(newGrid, fold.axisIndex);
  }
}

function foldUp(grid: GridState, axisRow: number): GridState {
  const topHalfRows = axisRow;
  const bottomHalfRows = grid.rows - axisRow;
  const resultRows = Math.max(topHalfRows, bottomHalfRows);
  const layers: Tile[][][] = [];

  for (let r = 0; r < resultRows; r++) {
    layers[r] = [];
    for (let c = 0; c < grid.cols; c++) {
      const bottomR = axisRow + (resultRows - 1 - r);
      const topR = axisRow - 1 - (resultRows - 1 - r);

      let stack: Tile[] = [];

      if (bottomR < grid.rows && bottomR >= axisRow) {
        stack = [...grid.layers[bottomR][c]];
      }

      if (topR >= 0 && topR < axisRow) {
        stack = [...stack, ...grid.layers[topR][c]];
      }

      layers[r][c] = stack;
    }
  }

  return { rows: resultRows, cols: grid.cols, layers };
}

function foldDown(grid: GridState, axisRow: number): GridState {
  const topHalfRows = axisRow;
  const bottomHalfRows = grid.rows - axisRow;
  const resultRows = Math.max(topHalfRows, bottomHalfRows);
  const layers: Tile[][][] = [];

  for (let r = 0; r < resultRows; r++) {
    layers[r] = [];
    for (let c = 0; c < grid.cols; c++) {
      const topR = r + (axisRow - resultRows);
      const mirrorBottomR = 2 * axisRow - 1 - (axisRow - resultRows + r);

      let stack: Tile[] = [];

      if (topR >= 0 && topR < axisRow) {
        stack = [...grid.layers[topR][c]];
      }

      if (mirrorBottomR >= axisRow && mirrorBottomR < grid.rows) {
        stack = [...stack, ...grid.layers[mirrorBottomR][c]];
      }

      layers[r][c] = stack;
    }
  }

  return { rows: resultRows, cols: grid.cols, layers };
}

function foldLeft(grid: GridState, axisCol: number): GridState {
  const leftHalfCols = axisCol;
  const rightHalfCols = grid.cols - axisCol;
  const resultCols = Math.max(leftHalfCols, rightHalfCols);
  const layers: Tile[][][] = [];

  for (let r = 0; r < grid.rows; r++) {
    layers[r] = [];
    for (let c = 0; c < resultCols; c++) {
      const rightC = axisCol + (resultCols - 1 - c);
      const leftC = axisCol - 1 - (resultCols - 1 - c);

      let stack: Tile[] = [];

      if (rightC < grid.cols && rightC >= axisCol) {
        stack = [...grid.layers[r][rightC]];
      }

      if (leftC >= 0 && leftC < axisCol) {
        stack = [...stack, ...grid.layers[r][leftC]];
      }

      layers[r][c] = stack;
    }
  }

  return { rows: grid.rows, cols: resultCols, layers };
}

function foldRight(grid: GridState, axisCol: number): GridState {
  const leftHalfCols = axisCol;
  const rightHalfCols = grid.cols - axisCol;
  const resultCols = Math.max(leftHalfCols, rightHalfCols);
  const layers: Tile[][][] = [];

  for (let r = 0; r < grid.rows; r++) {
    layers[r] = [];
    for (let c = 0; c < resultCols; c++) {
      const leftC = c + (axisCol - resultCols);
      const mirrorRightC = 2 * axisCol - 1 - (axisCol - resultCols + c);

      let stack: Tile[] = [];

      if (leftC >= 0 && leftC < axisCol) {
        stack = [...grid.layers[r][leftC]];
      }

      if (mirrorRightC >= axisCol && mirrorRightC < grid.cols) {
        stack = [...stack, ...grid.layers[r][mirrorRightC]];
      }

      layers[r][c] = stack;
    }
  }

  return { rows: grid.rows, cols: resultCols, layers };
}

export function checkWin(grid: GridState, target: (PlantType | null)[][]): boolean {
  if (grid.rows !== target.length || grid.cols !== target[0].length) {
    return false;
  }

  const topLayer = getTopLayer(grid);

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (target[r][c] === null) continue;
      if (topLayer[r][c] !== target[r][c]) return false;
    }
  }

  return true;
}

function gridKey(grid: GridState): string {
  const cells = grid.layers.map(row =>
    row.map(stack => stack.map(tile => tile.plant).join('.')).join(',')
  ).join('|');
  return `${grid.rows}x${grid.cols}:${cells}`;
}

export function findNextFold(grid: GridState, target: (PlantType | null)[][]): FoldAction | null {
  if (checkWin(grid, target)) return null;

  const seen = new Set<string>([gridKey(grid)]);
  const queue: { grid: GridState; path: FoldAction[] }[] = [{ grid, path: [] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.path.length >= 6) continue;

    for (const fold of getAvailableFolds(current.grid)) {
      const next = applyFold(current.grid, fold);
      const path = [...current.path, fold];
      if (checkWin(next, target)) return path[0];

      const key = gridKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ grid: next, path });
    }
  }

  return null;
}

export function getAvailableFolds(grid: GridState): FoldAction[] {
  const folds: FoldAction[] = [];

  for (let r = 1; r < grid.rows; r++) {
    folds.push({ direction: 'up', axisIndex: r });
    folds.push({ direction: 'down', axisIndex: r });
  }

  for (let c = 1; c < grid.cols; c++) {
    folds.push({ direction: 'left', axisIndex: c });
    folds.push({ direction: 'right', axisIndex: c });
  }

  return folds;
}
