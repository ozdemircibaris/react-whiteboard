import type { Point, Shape, Bounds, PathShape } from '../types'

// Re-export from sub-modules
export {
  type ResizeHandle,
  RESIZE_CURSORS,
  getResizeHandlePositions,
  hitTestResizeHandles,
  hitTestSelectionResizeHandles,
} from './resizeHandles'

export {
  rotatePoint,
  distanceToLineSegment,
  hitTestRectangle,
  hitTestEllipse,
  hitTestPath,
  hitTestLine,
  hitTestArrow,
  hitTestShape,
} from './shapeHitTest'

/**
 * Get the bounds of a shape (accounting for stroke width)
 */
export function getShapeBounds(shape: Shape): Bounds {
  const strokeWidth = 'props' in shape && 'strokeWidth' in shape.props ? shape.props.strokeWidth : 0
  const halfStroke = strokeWidth / 2

  if (shape.type === 'path') {
    const pathShape = shape as PathShape
    const points = pathShape.props.points

    if (points.length === 0) {
      return { x: shape.x, y: shape.y, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    return {
      x: minX - halfStroke,
      y: minY - halfStroke,
      width: maxX - minX + strokeWidth,
      height: maxY - minY + strokeWidth,
    }
  }

  return {
    x: shape.x - halfStroke,
    y: shape.y - halfStroke,
    width: shape.width + strokeWidth,
    height: shape.height + strokeWidth,
  }
}

import { hitTestShape } from './shapeHitTest'

/**
 * Find the shape at a given point (returns the topmost shape)
 */
export function getShapeAtPoint(
  point: Point,
  shapes: Map<string, Shape>,
  shapeIds: string[],
  tolerance: number = 0
): Shape | null {
  for (let i = shapeIds.length - 1; i >= 0; i--) {
    const id = shapeIds[i]
    if (!id) continue

    const shape = shapes.get(id)
    if (shape && hitTestShape(point, shape, tolerance)) {
      return shape
    }
  }
  return null
}

/**
 * Find all shapes at a given point
 */
export function getShapesAtPoint(
  point: Point,
  shapes: Map<string, Shape>,
  shapeIds: string[],
  tolerance: number = 0
): Shape[] {
  const result: Shape[] = []

  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (shape && hitTestShape(point, shape, tolerance)) {
      result.push(shape)
    }
  }

  return result
}

/**
 * Find shapes within a selection box (marquee selection)
 */
export function getShapesInBounds(
  bounds: Bounds,
  shapes: Map<string, Shape>,
  shapeIds: string[],
  fullyContained: boolean = true
): Shape[] {
  const result: Shape[] = []

  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (!shape || shape.isLocked) continue

    const shapeBounds = getShapeBounds(shape)

    if (fullyContained) {
      if (
        shapeBounds.x >= bounds.x &&
        shapeBounds.y >= bounds.y &&
        shapeBounds.x + shapeBounds.width <= bounds.x + bounds.width &&
        shapeBounds.y + shapeBounds.height <= bounds.y + bounds.height
      ) {
        result.push(shape)
      }
    } else {
      if (
        shapeBounds.x < bounds.x + bounds.width &&
        shapeBounds.x + shapeBounds.width > bounds.x &&
        shapeBounds.y < bounds.y + bounds.height &&
        shapeBounds.y + shapeBounds.height > bounds.y
      ) {
        result.push(shape)
      }
    }
  }

  return result
}

/**
 * Get combined bounds of multiple shapes
 */
export function getSelectionBounds(shapes: Shape[]): Bounds | null {
  if (shapes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    const bounds = getShapeBounds(shape)
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.width)
    maxY = Math.max(maxY, bounds.y + bounds.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
