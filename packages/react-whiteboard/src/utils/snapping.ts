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
 * Uses proximity culling to skip shapes that are too far away to snap.
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

  // Pre-compute moving edge positions (avoid per-shape object allocation)
  const mLeft = movingBounds.x
  const mCenterX = movingBounds.x + movingBounds.width / 2
  const mRight = movingBounds.x + movingBounds.width
  const mTop = movingBounds.y
  const mCenterY = movingBounds.y + movingBounds.height / 2
  const mBottom = movingBounds.y + movingBounds.height

  for (const id of shapeIds) {
    if (excludeIds.has(id)) continue
    const shape = allShapes.get(id)
    if (!shape) continue

    const tLeft = shape.x
    const tRight = shape.x + shape.width
    const tTop = shape.y
    const tBottom = shape.y + shape.height

    // Proximity culling: skip shapes whose edges are all too far to snap
    const canSnapX = tRight >= mLeft - threshold && tLeft <= mRight + threshold
    const canSnapY = tBottom >= mTop - threshold && tTop <= mBottom + threshold
    if (!canSnapX && !canSnapY) continue

    const tCenterX = tLeft + shape.width / 2
    const tCenterY = tTop + shape.height / 2

    // Check vertical alignment (x-axis snapping)
    if (canSnapX) {
      checkEdgeSnap(mLeft,    tLeft,    threshold)
      checkEdgeSnap(mLeft,    tCenterX, threshold)
      checkEdgeSnap(mLeft,    tRight,   threshold)
      checkEdgeSnap(mCenterX, tLeft,    threshold)
      checkEdgeSnap(mCenterX, tCenterX, threshold)
      checkEdgeSnap(mCenterX, tRight,   threshold)
      checkEdgeSnap(mRight,   tLeft,    threshold)
      checkEdgeSnap(mRight,   tCenterX, threshold)
      checkEdgeSnap(mRight,   tRight,   threshold)
    }

    // Check horizontal alignment (y-axis snapping)
    if (canSnapY) {
      checkEdgeSnapY(mTop,     tTop,     threshold)
      checkEdgeSnapY(mTop,     tCenterY, threshold)
      checkEdgeSnapY(mTop,     tBottom,  threshold)
      checkEdgeSnapY(mCenterY, tTop,     threshold)
      checkEdgeSnapY(mCenterY, tCenterY, threshold)
      checkEdgeSnapY(mCenterY, tBottom,  threshold)
      checkEdgeSnapY(mBottom,  tTop,     threshold)
      checkEdgeSnapY(mBottom,  tCenterY, threshold)
      checkEdgeSnapY(mBottom,  tBottom,  threshold)
    }
  }

  // Inline helpers capture bestDx/bestDy via closure
  function checkEdgeSnap(mv: number, tv: number, t: number) {
    const d = Math.abs(mv - tv)
    if (d < t && d < Math.abs(bestDx)) {
      bestDx = tv - mv
      snapX = movingBounds.x + bestDx
    }
  }
  function checkEdgeSnapY(mh: number, th: number, t: number) {
    const d = Math.abs(mh - th)
    if (d < t && d < Math.abs(bestDy)) {
      bestDy = th - mh
      snapY = movingBounds.y + bestDy
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

/**
 * Draw snap guide lines on the canvas overlay
 */
export function drawSnapLines(
  ctx: CanvasRenderingContext2D,
  snapLines: SnapLine[],
  color?: string,
): void {
  if (snapLines.length === 0) return

  ctx.save()
  ctx.strokeStyle = color ?? '#ff6b6b'
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
