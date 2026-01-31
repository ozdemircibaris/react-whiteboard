import type { TextShape } from '../../../types'
import { resolveFont, wrapTextLines } from '../../../utils/fonts'
import type { DrawSelectionOutlineFn } from './shared'
import { applyRotation, roundRect } from './shared'

export function drawText(
  ctx: CanvasRenderingContext2D,
  shape: TextShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props } = shape
  const { text, fontSize, color, backgroundColor, align, lineHeight } = props

  ctx.save()
  ctx.globalAlpha = opacity
  applyRotation(ctx, rotation, x, y, width, height)

  // Background fill
  if (backgroundColor && backgroundColor !== 'transparent') {
    const pad = 4
    ctx.fillStyle = backgroundColor
    ctx.beginPath()
    roundRect(ctx, x - pad, y - pad, width + pad * 2, height + pad * 2, 4)
    ctx.fill()
  }

  // Text rendering with word-wrap
  ctx.font = resolveFont(props)
  ctx.fillStyle = color
  ctx.textAlign = align as CanvasTextAlign
  ctx.textBaseline = 'top'

  let textX = x
  if (align === 'center') textX = x + width / 2
  else if (align === 'right') textX = x + width

  const lineSpacing = fontSize * (lineHeight ?? 1.25)
  const { lines } = wrapTextLines(text, width, props)

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, y + index * lineSpacing)
  })

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}
