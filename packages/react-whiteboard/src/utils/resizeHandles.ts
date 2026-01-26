import type { Point, Shape, Bounds } from '../types'

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
 * Hit test resize handles for a shape
 * Returns the handle being hit or null
 */
export function hitTestResizeHandles(
  point: Point,
  shape: Shape,
  handleSize: number = HANDLE_SIZE
): ResizeHandle | null {
  const halfHandle = handleSize / 2
  const bounds: Bounds = { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
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
 * Hit test resize handles for selection bounds (multiple shapes)
 */
export function hitTestSelectionResizeHandles(
  point: Point,
  bounds: Bounds,
  handleSize: number = HANDLE_SIZE
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
