import type { Shape } from '../../../types'
import type { DrawSelectionOutlineFn } from './shared'

export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height } = shape

  ctx.save()
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(x, y, width, height)
  ctx.setLineDash([])

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}
