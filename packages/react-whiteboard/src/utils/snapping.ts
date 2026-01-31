import type { Bounds, Point, Shape } from '../types'

export interface SnapLine {
  orientation: 'horizontal' | 'vertical'
  position: number
  from: number
  to: number
}

export interface SnapResult {
  x: number
  y: number
  snapLines: SnapLine[]
}

const SNAP_THRESHOLD = 5

/**
 * Snap a point to the nearest grid intersection
 */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  }
}

/**
 * Snap moving bounds to other shape edges/centers (smart guides).
 * Returns the snapped position and visual snap lines.
 */
export function snapToShapes(
  movingBounds: Bounds,
  allShapes: Map<string, Shape>,
  shapeIds: string[],
  excludeIds: Set<string>,
  threshold: number = SNAP_THRESHOLD,
): SnapResult {
  const snapLines: SnapLine[] = []
  let bestDx = Infinity
  let bestDy = Infinity
  let snapX = movingBounds.x
  let snapY = movingBounds.y

  const movingEdges = getBoundsEdges(movingBounds)

  for (const id of shapeIds) {
    if (excludeIds.has(id)) continue
    const shape = allShapes.get(id)
    if (!shape) continue

    const targetEdges = getBoundsEdges({
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    })

    // Check vertical alignment (x-axis snapping)
    for (const mv of movingEdges.verticals) {
      for (const tv of targetEdges.verticals) {
        const dx = Math.abs(mv - tv)
        if (dx < threshold && dx < Math.abs(bestDx)) {
          bestDx = tv - mv
          snapX = movingBounds.x + bestDx
        }
      }
    }

    // Check horizontal alignment (y-axis snapping)
    for (const mh of movingEdges.horizontals) {
      for (const th of targetEdges.horizontals) {
        const dy = Math.abs(mh - th)
        if (dy < threshold && dy < Math.abs(bestDy)) {
          bestDy = th - mh
          snapY = movingBounds.y + bestDy
        }
      }
    }
  }

  // Build snap guide lines
  if (Math.abs(bestDx) < threshold) {
    const snappedX = movingBounds.x + bestDx
    snapLines.push({
      orientation: 'vertical',
      position: snappedX + movingBounds.width / 2,
      from: Math.min(movingBounds.y, snapY) - 20,
      to: Math.max(movingBounds.y + movingBounds.height, snapY + movingBounds.height) + 20,
    })
  }

  if (Math.abs(bestDy) < threshold) {
    const snappedY = movingBounds.y + bestDy
    snapLines.push({
      orientation: 'horizontal',
      position: snappedY + movingBounds.height / 2,
      from: Math.min(movingBounds.x, snapX) - 20,
      to: Math.max(movingBounds.x + movingBounds.width, snapX + movingBounds.width) + 20,
    })
  }

  return {
    x: Math.abs(bestDx) < threshold ? snapX : movingBounds.x,
    y: Math.abs(bestDy) < threshold ? snapY : movingBounds.y,
    snapLines,
  }
}

interface BoundsEdges {
  verticals: number[]   // x-positions: left, center, right
  horizontals: number[] // y-positions: top, center, bottom
}

function getBoundsEdges(bounds: Bounds): BoundsEdges {
  return {
    verticals: [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width],
    horizontals: [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height],
  }
}

/**
 * Draw snap guide lines on the canvas overlay
 */
export function drawSnapLines(
  ctx: CanvasRenderingContext2D,
  snapLines: SnapLine[],
): void {
  if (snapLines.length === 0) return

  ctx.save()
  ctx.strokeStyle = '#ff6b6b'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  for (const line of snapLines) {
    ctx.beginPath()
    if (line.orientation === 'vertical') {
      ctx.moveTo(line.position, line.from)
      ctx.lineTo(line.position, line.to)
    } else {
      ctx.moveTo(line.from, line.position)
      ctx.lineTo(line.to, line.position)
    }
    ctx.stroke()
  }

  ctx.restore()
}
