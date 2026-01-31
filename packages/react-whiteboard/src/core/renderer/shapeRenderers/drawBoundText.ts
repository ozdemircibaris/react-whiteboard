import type { RectangleShape, EllipseShape, Shape } from '../../../types'
import { resolveFont, wrapTextLines } from '../../../utils/fonts'
import { getBoundTextShape, BOUND_TEXT_PADDING, centerTextVertically } from '../../../utils/boundText'
import { applyRotation } from './shared'

/**
 * Render bound text centered inside a parent shape.
 * Called after the parent shape is drawn but before the selection outline.
 */
export function drawBoundText(
  ctx: CanvasRenderingContext2D,
  parent: RectangleShape | EllipseShape,
  allShapes: Map<string, Shape>,
): void {
  const textShape = getBoundTextShape(parent, allShapes)
  if (!textShape) return

  const { text, fontSize, color, align, lineHeight } = textShape.props
  if (!text) return

  const pad = BOUND_TEXT_PADDING
  const maxWidth = Math.max(parent.width - pad * 2, 20)
  const { lines, height: textHeight } = wrapTextLines(text, maxWidth, textShape.props)

  ctx.save()
  ctx.globalAlpha = textShape.opacity

  // Apply parent rotation first so clip region is in rotated coordinate space
  applyRotation(ctx, parent.rotation, parent.x, parent.y, parent.width, parent.height)

  // Clip to parent bounds (now correctly rotated)
  clipToParent(ctx, parent)

  // Text rendering
  ctx.font = resolveFont(textShape.props)
  ctx.fillStyle = color
  ctx.textAlign = align as CanvasTextAlign
  ctx.textBaseline = 'top'

  const lineSpacing = fontSize * (lineHeight ?? 1.25)
  const offsetY = centerTextVertically(parent.height, textHeight)

  let textX = parent.x + pad
  if (align === 'center') textX = parent.x + parent.width / 2
  else if (align === 'right') textX = parent.x + parent.width - pad

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, parent.y + offsetY + index * lineSpacing)
  })

  ctx.restore()
}

function clipToParent(ctx: CanvasRenderingContext2D, parent: RectangleShape | EllipseShape): void {
  ctx.beginPath()
  if (parent.type === 'ellipse') {
    const cx = parent.x + parent.width / 2
    const cy = parent.y + parent.height / 2
    ctx.ellipse(cx, cy, parent.width / 2, parent.height / 2, 0, 0, Math.PI * 2)
  } else {
    ctx.rect(parent.x, parent.y, parent.width, parent.height)
  }
  ctx.clip()
}
