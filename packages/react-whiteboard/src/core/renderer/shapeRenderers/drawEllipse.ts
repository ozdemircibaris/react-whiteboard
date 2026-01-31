import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { EllipseShape } from '../../../types'
import type { DrawSelectionOutlineFn } from './shared'
import { buildRoughOptions, applyRotation, getStrokeLineDash, mapFillStyle } from './shared'

export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: EllipseShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { fill, fillStyle, stroke, strokeWidth, strokeStyle } = props

  ctx.save()
  ctx.globalAlpha = opacity

  const cx = x + width / 2
  const cy = y + height / 2

  applyRotation(ctx, rotation, x, y, width, height)

  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  rc.ellipse(
    cx, cy, width, height,
    buildRoughOptions(seed, roughness, {
      stroke,
      strokeWidth,
      fill: fill && fill !== 'transparent' ? fill : undefined,
      fillStyle: mapFillStyle(fillStyle),
      strokeLineDash: lineDash.length ? lineDash : undefined,
    }),
  )

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}
