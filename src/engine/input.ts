import type { FoldAction, FoldDirection } from '../types/index.ts';

interface SwipeConfig {
  minDistance: number;
  maxTime: number;
}

const DEFAULT_CONFIG: SwipeConfig = {
  minDistance: 30,
  maxTime: 500,
};

interface TouchInfo {
  startX: number;
  startY: number;
  startTime: number;
}

export type SwipeHandler = (direction: FoldDirection, position: { x: number; y: number }) => void;
export type TapHandler = (x: number, y: number) => void;

export function createInputHandler(
  element: HTMLElement,
  onSwipe: SwipeHandler,
  onTap: TapHandler,
  config: SwipeConfig = DEFAULT_CONFIG
): () => void {
  let touchInfo: TouchInfo | null = null;

  const handleStart = (x: number, y: number) => {
    touchInfo = { startX: x, startY: y, startTime: Date.now() };
  };

  const handleEnd = (x: number, y: number) => {
    if (!touchInfo) return;

    const dx = x - touchInfo.startX;
    const dy = y - touchInfo.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - touchInfo.startTime;

    if (dist < 10) {
      onTap(x, y);
    } else if (dist >= config.minDistance && elapsed <= config.maxTime) {
      let direction: FoldDirection;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      const midX = (touchInfo.startX + x) / 2;
      const midY = (touchInfo.startY + y) / 2;
      onSwipe(direction, { x: midX, y: midY });
    }

    touchInfo = null;
  };

  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = element.getBoundingClientRect();
    handleStart(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = element.getBoundingClientRect();
    handleEnd(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const onMouseDown = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    handleStart(e.clientX - rect.left, e.clientY - rect.top);
  };

  const onMouseUp = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    handleEnd(e.clientX - rect.left, e.clientY - rect.top);
  };

  element.addEventListener('touchstart', onTouchStart, { passive: false });
  element.addEventListener('touchend', onTouchEnd, { passive: false });
  element.addEventListener('mousedown', onMouseDown);
  element.addEventListener('mouseup', onMouseUp);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mouseup', onMouseUp);
  };
}

export function calculateFoldFromSwipe(
  direction: FoldDirection,
  position: { x: number; y: number },
  gridOffsetX: number,
  gridOffsetY: number,
  tileSize: number,
  rows: number,
  cols: number
): FoldAction | null {
  switch (direction) {
    case 'up':
    case 'down': {
      const relY = position.y - gridOffsetY;
      let axisRow = Math.round(relY / tileSize);
      axisRow = Math.max(1, Math.min(axisRow, rows - 1));
      return { direction, axisIndex: axisRow };
    }
    case 'left':
    case 'right': {
      const relX = position.x - gridOffsetX;
      let axisCol = Math.round(relX / tileSize);
      axisCol = Math.max(1, Math.min(axisCol, cols - 1));
      return { direction, axisIndex: axisCol };
    }
  }
}
