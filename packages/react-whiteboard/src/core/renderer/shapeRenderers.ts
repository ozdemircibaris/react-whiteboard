import { getStroke } from 'perfect-freehand'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { Options as RoughOptions } from 'roughjs/bin/core'
import type {
  RectangleShape,
  EllipseShape,
  PathShape,
  LineShape,
  ArrowShape,
  TextShape,
  Shape,
} from '../../types'
import { calculateArrowhead } from '../../utils/canvas'
import { resolveFont } from '../../utils/fonts'

/**
 * Shared stroke options for perfect-freehand rendering
 */
const FREEHAND_OPTIONS = {
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  start: { cap: true, taper: 0 },
  end: { cap: true, taper: 0 },
  last: true,
}

/** Selection outline drawing callback type */
export type DrawSelectionOutlineFn = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void

/**
 * Build RoughJS options from shape seed/roughness + per-shape style overrides
 */
export function buildRoughOptions(
  seed: number,
  roughness: number,
  extra: RoughOptions = {},
): RoughOptions {
  return { seed, roughness, ...extra }
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: RectangleShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { fill, stroke, strokeWidth } = props

  ctx.save()
  ctx.globalAlpha = opacity

  if (rotation !== 0) {
    const cx = x + width / 2
    const cy = y + height / 2
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }

  rc.rectangle(
    x, y, width, height,
    buildRoughOptions(seed, roughness, {
      stroke,
      strokeWidth,
      fill: fill && fill !== 'transparent' ? fill : undefined,
      fillStyle: 'solid',
    }),
  )

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}

export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: EllipseShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { fill, stroke, strokeWidth } = props

  ctx.save()
  ctx.globalAlpha = opacity

  const cx = x + width / 2
  const cy = y + height / 2

  if (rotation !== 0) {
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }

  rc.ellipse(
    cx, cy, width, height,
    buildRoughOptions(seed, roughness, {
      stroke,
      strokeWidth,
      fill: fill && fill !== 'transparent' ? fill : undefined,
      fillStyle: 'solid',
    }),
  )

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  shape: PathShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, opacity, props } = shape
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

  const outlinePoints = getStroke(absolutePoints, {
    ...FREEHAND_OPTIONS,
    size: strokeWidth * 3,
    simulatePressure: !hasRealPressure,
  })

  if (outlinePoints.length < 2) return

  ctx.save()
  ctx.globalAlpha = opacity
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
    const { width, height } = shape
    drawSelection(x, y, width, height)
  }

  ctx.restore()
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  shape: LineShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, opacity, props, seed, roughness } = shape
  const { stroke, strokeWidth, points } = props

  const startPoint = points[0]
  const endPoint = points[1]
  if (!startPoint || !endPoint) return

  ctx.save()
  ctx.globalAlpha = opacity

  rc.line(
    x + startPoint.x, y + startPoint.y,
    x + endPoint.x, y + endPoint.y,
    buildRoughOptions(seed, roughness, { stroke, strokeWidth }),
  )

  if (isSelected) drawSelection(x, y, shape.width, shape.height)
  ctx.restore()
}

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
  const { x, y, opacity, props, seed, roughness } = shape
  const { stroke, strokeWidth, start, end, endArrowhead } = props

  ctx.save()
  ctx.globalAlpha = opacity

  const startX = x + start.x
  const startY = y + start.y
  const endX = x + end.x
  const endY = y + end.y

  rc.line(
    startX, startY, endX, endY,
    buildRoughOptions(seed, roughness, { stroke, strokeWidth }),
  )

  if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
    drawArrowhead(ctx, startX, startY, endX, endY, strokeWidth * 4, stroke)
  }

  if (isSelected) drawSelection(x, y, shape.width, shape.height)
  ctx.restore()
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  shape: TextShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, opacity, props } = shape
  const { text, fontSize, color, backgroundColor, align, lineHeight } = props

  ctx.save()
  ctx.globalAlpha = opacity

  // Background fill
  if (backgroundColor && backgroundColor !== 'transparent') {
    const pad = 4
    ctx.fillStyle = backgroundColor
    ctx.beginPath()
    roundRect(ctx, x - pad, y - pad, width + pad * 2, height + pad * 2, 4)
    ctx.fill()
  }

  // Text rendering
  ctx.font = resolveFont(props)
  ctx.fillStyle = color
  ctx.textAlign = align as CanvasTextAlign
  ctx.textBaseline = 'top'

  let textX = x
  if (align === 'center') textX = x + width / 2
  else if (align === 'right') textX = x + width

  const lineSpacing = fontSize * (lineHeight ?? 1.25)
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, y + index * lineSpacing)
  })

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}

/** Draw a rounded rectangle path (no stroke/fill — caller does that) */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

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
