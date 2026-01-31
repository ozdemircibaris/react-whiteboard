import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { LineShape } from '../../../types'
import type { DrawSelectionOutlineFn } from './shared'
import { buildRoughOptions, applyRotation, getStrokeLineDash } from './shared'

export function drawLine(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: LineShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { stroke, strokeWidth, strokeStyle, points } = props

  const startPoint = points[0]
  const endPoint = points[1]
  if (!startPoint || !endPoint) return

  ctx.save()
  ctx.globalAlpha = opacity
  applyRotation(ctx, rotation, x, y, width, height)

  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  rc.line(
    x + startPoint.x, y + startPoint.y,
    x + endPoint.x, y + endPoint.y,
    buildRoughOptions(seed, roughness, {
      stroke,
      strokeWidth,
      strokeLineDash: lineDash.length ? lineDash : undefined,
    }),
  )

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}
