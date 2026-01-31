import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { ArrowShape } from '../../../types'
import { calculateArrowhead } from '../../../utils/canvas'
import type { DrawSelectionOutlineFn } from './shared'
import { buildRoughOptions, applyRotation, getStrokeLineDash } from './shared'

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number,
  color: string,
): void {
  const [wing1, wing2] = calculateArrowhead(
    { x: fromX, y: fromY },
    { x: toX, y: toY },
    size,
  )

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(wing1.x, wing1.y)
  ctx.lineTo(wing2.x, wing2.y)
  ctx.closePath()
  ctx.fill()
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: ArrowShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { stroke, strokeWidth, strokeStyle, start, end, startArrowhead, endArrowhead } = props

  ctx.save()
  ctx.globalAlpha = opacity
  applyRotation(ctx, rotation, x, y, width, height)

  const startX = x + start.x
  const startY = y + start.y
  const endX = x + end.x
  const endY = y + end.y

  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  rc.line(
    startX, startY, endX, endY,
    buildRoughOptions(seed, roughness, {
      stroke,
      strokeWidth,
      strokeLineDash: lineDash.length ? lineDash : undefined,
    }),
  )

  if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
    drawArrowhead(ctx, startX, startY, endX, endY, strokeWidth * 4, stroke)
  }

  if (startArrowhead === 'arrow' || startArrowhead === 'triangle') {
    drawArrowhead(ctx, endX, endY, startX, startY, strokeWidth * 4, stroke)
  }

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}
