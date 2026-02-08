import type { Shape } from '../types'

export interface ShapesBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * Calculate the bounding box that encloses all specified shapes.
 * Returns null if there are no shapes to measure.
 */
export function getShapesBounds(
  shapes: Map<string, Shape>,
  shapeIds: string[],
): ShapesBounds | null {
  if (shapeIds.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const id of shapeIds) {
    const s = shapes.get(id)
    if (!s) continue
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }

  if (!isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}
