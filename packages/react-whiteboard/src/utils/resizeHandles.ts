import type { Point, Shape, Bounds } from '../types'
import { rotatePoint } from './shapeHitTest'

/**
 * Resize handle positions
 */
export type ResizeHandle =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'right-center'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'left-center'

/**
 * Cursor styles for each resize handle
 */
export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  'top-left': 'nwse-resize',
  'top-center': 'ns-resize',
  'top-right': 'nesw-resize',
  'right-center': 'ew-resize',
  'bottom-right': 'nwse-resize',
  'bottom-center': 'ns-resize',
  'bottom-left': 'nesw-resize',
  'left-center': 'ew-resize',
}

/** Default handle size matching renderer */
const HANDLE_SIZE = 8

/**
 * Get resize handle positions for a shape's bounds
 */
export function getResizeHandlePositions(bounds: Bounds): Record<ResizeHandle, Point> {
  const { x, y, width, height } = bounds

  return {
    'top-left': { x, y },
    'top-center': { x: x + width / 2, y },
    'top-right': { x: x + width, y },
    'right-center': { x: x + width, y: y + height / 2 },
    'bottom-right': { x: x + width, y: y + height },
    'bottom-center': { x: x + width / 2, y: y + height },
    'bottom-left': { x, y: y + height },
    'left-center': { x, y: y + height / 2 },
  }
}

/**
 * Core handle hit test logic — shared by shape and selection handle hit tests
 */
function hitTestHandlesAtBounds(
  point: Point,
  bounds: Bounds,
  handleSize: number,
): ResizeHandle | null {
  const halfHandle = handleSize / 2
  const handles = getResizeHandlePositions(bounds)

  for (const [handle, pos] of Object.entries(handles) as [ResizeHandle, Point][]) {
    if (
      point.x >= pos.x - halfHandle &&
      point.x <= pos.x + halfHandle &&
      point.y >= pos.y - halfHandle &&
      point.y <= pos.y + halfHandle
    ) {
      return handle
    }
  }

  return null
}

/**
 * Hit test resize handles for a single shape.
 * Accounts for shape rotation by un-rotating the test point.
 */
export function hitTestResizeHandles(
  point: Point,
  shape: Shape,
  handleSize: number = HANDLE_SIZE
): ResizeHandle | null {
  let testPoint = point
  if (shape.rotation !== 0) {
    const center: Point = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    }
    testPoint = rotatePoint(point, center, -shape.rotation)
  }

  const bounds: Bounds = { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
  return hitTestHandlesAtBounds(testPoint, bounds, handleSize)
}

/**
 * Hit test resize handles for selection bounds (multiple shapes)
 */
export function hitTestSelectionResizeHandles(
  point: Point,
  bounds: Bounds,
  handleSize: number = HANDLE_SIZE
): ResizeHandle | null {
  return hitTestHandlesAtBounds(point, bounds, handleSize)
}

/**
 * Calculate new bounds after a resize handle drag.
 * Enforces a minimum size and corrects position for left/top handle drags.
 */
export function calculateResizedBounds(
  startBounds: Bounds,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  minSize: number = 10,
): Bounds {
  let { x, y, width, height } = startBounds

  switch (handle) {
    case 'top-left':
      x += dx; y += dy; width -= dx; height -= dy; break
    case 'top-center':
      y += dy; height -= dy; break
    case 'top-right':
      y += dy; width += dx; height -= dy; break
    case 'right-center':
      width += dx; break
    case 'bottom-right':
      width += dx; height += dy; break
    case 'bottom-center':
      height += dy; break
    case 'bottom-left':
      x += dx; width -= dx; height += dy; break
    case 'left-center':
      x += dx; width -= dx; break
  }

  if (width < minSize) {
    if (handle.includes('left')) x = startBounds.x + startBounds.width - minSize
    width = minSize
  }
  if (height < minSize) {
    if (handle.includes('top')) y = startBounds.y + startBounds.height - minSize
    height = minSize
  }

  return { x, y, width, height }
}
