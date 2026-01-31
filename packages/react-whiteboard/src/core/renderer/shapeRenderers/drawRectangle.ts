import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { RectangleShape, Shape } from '../../../types'
import type { DrawSelectionOutlineFn } from './shared'
import { buildRoughOptions, applyRotation, getStrokeLineDash, mapFillStyle } from './shared'
import { drawBoundText } from './drawBoundText'

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: RectangleShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
  allShapes?: Map<string, Shape>,
): void {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { fill, fillStyle, stroke, strokeWidth, strokeStyle, cornerRadius } = props

  ctx.save()
  ctx.globalAlpha = opacity
  applyRotation(ctx, rotation, x, y, width, height)

  const fillOpt = fill && fill !== 'transparent' ? fill : undefined
  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  const roughOpts = buildRoughOptions(seed, roughness, {
    stroke,
    strokeWidth,
    fill: fillOpt,
    fillStyle: mapFillStyle(fillStyle),
    strokeLineDash: lineDash.length ? lineDash : undefined,
  })

  if (cornerRadius > 0) {
    const r = Math.min(cornerRadius, width / 2, height / 2)
    const path = `M ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} L ${x + r} ${y + height} Q ${x} ${y + height} ${x} ${y + height - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
    rc.path(path, roughOpts)
  } else {
    rc.rectangle(x, y, width, height, roughOpts)
  }

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()

  // Draw bound text after shape restore (gets its own save/restore internally)
  if (allShapes && props.boundTextId) {
    drawBoundText(ctx, shape, allShapes)
  }
}
