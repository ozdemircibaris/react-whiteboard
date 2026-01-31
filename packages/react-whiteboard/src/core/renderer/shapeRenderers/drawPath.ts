import { getStroke } from 'perfect-freehand'
import type { PathShape } from '../../../types'
import type { DrawSelectionOutlineFn } from './shared'
import { applyRotation } from './shared'

/** Shared stroke options for perfect-freehand rendering */
const FREEHAND_OPTIONS = {
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  start: { cap: true, taper: 0 },
  end: { cap: true, taper: 0 },
  last: true,
}

/** Stroke cache for completed paths — avoids recomputing every frame */
const strokeCache = new WeakMap<PathShape, number[][]>()

export function drawPath(
  ctx: CanvasRenderingContext2D,
  shape: PathShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props } = shape
  const { stroke, strokeWidth, points } = props

  if (points.length < 2) return

  const absolutePoints = points.map((p) => ({
    x: x + p.x,
    y: y + p.y,
    pressure: p.pressure,
  }))

  const hasRealPressure = absolutePoints.some(
    (p) => p.pressure !== undefined && p.pressure !== 0.5,
  )

  // Use cache for completed paths to avoid recomputing getStroke every frame
  let outlinePoints = strokeCache.get(shape)
  if (!outlinePoints) {
    outlinePoints = getStroke(absolutePoints, {
      ...FREEHAND_OPTIONS,
      size: strokeWidth * 3,
      simulatePressure: !hasRealPressure,
    })
    if (props.isComplete) {
      strokeCache.set(shape, outlinePoints)
    }
  }

  if (outlinePoints.length < 2) return

  ctx.save()
  ctx.globalAlpha = opacity
  applyRotation(ctx, rotation, x, y, width, height)
  ctx.fillStyle = stroke

  const first = outlinePoints[0]!
  ctx.beginPath()
  ctx.moveTo(first[0]!, first[1]!)

  for (let i = 1; i < outlinePoints.length; i++) {
    const pt = outlinePoints[i]!
    ctx.lineTo(pt[0]!, pt[1]!)
  }

  ctx.closePath()
  ctx.fill()

  if (isSelected) {
    drawSelection(x, y, width, height)
  }

  ctx.restore()
}
