import rough from 'roughjs'
import { getStroke } from 'perfect-freehand'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { Options as RoughOptions } from 'roughjs/bin/core'
import type {
  Shape,
  Viewport,
  RectangleShape,
  EllipseShape,
  PathShape,
  LineShape,
  ArrowShape,
  TextShape,
} from '../types'
import { getDevicePixelRatio, calculateArrowhead } from '../utils/canvas'

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

/**
 * Canvas renderer with RoughJS for hand-drawn aesthetic
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private roughCanvas: RoughCanvas

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.roughCanvas = rough.canvas(ctx.canvas)
  }

  private get dpr(): number {
    return getDevicePixelRatio()
  }

  /**
   * Build RoughJS options from shape seed/roughness + per-shape style overrides
   */
  private buildRoughOptions(
    seed: number,
    roughness: number,
    extra: RoughOptions = {}
  ): RoughOptions {
    return { seed, roughness, ...extra }
  }

  /**
   * Clear the entire canvas
   */
  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width * this.dpr, height * this.dpr)
  }

  /**
   * Apply viewport transform to context
   */
  applyViewport(viewport: Viewport): void {
    const { x, y, zoom } = viewport
    this.ctx.setTransform(this.dpr * zoom, 0, 0, this.dpr * zoom, x * this.dpr, y * this.dpr)
  }

  /**
   * Reset transform to default
   */
  resetTransform(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /**
   * Draw a grid pattern
   */
  drawGrid(viewport: Viewport, width: number, height: number, gridSize: number = 20): void {
    const { x, y, zoom } = viewport

    this.ctx.save()
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    const scaledGridSize = gridSize * zoom
    const offsetX = x % scaledGridSize
    const offsetY = y % scaledGridSize

    this.ctx.beginPath()
    this.ctx.strokeStyle = '#e5e5e5'
    this.ctx.lineWidth = 1

    for (let gx = offsetX; gx < width; gx += scaledGridSize) {
      this.ctx.moveTo(gx, 0)
      this.ctx.lineTo(gx, height)
    }

    for (let gy = offsetY; gy < height; gy += scaledGridSize) {
      this.ctx.moveTo(0, gy)
      this.ctx.lineTo(width, gy)
    }

    this.ctx.stroke()
    this.ctx.restore()
  }

  /**
   * Draw a shape
   */
  drawShape(shape: Shape, isSelected: boolean = false): void {
    switch (shape.type) {
      case 'rectangle':
        this.drawRectangle(shape as RectangleShape, isSelected)
        break
      case 'ellipse':
        this.drawEllipse(shape as EllipseShape, isSelected)
        break
      case 'path':
        this.drawPath(shape as PathShape, isSelected)
        break
      case 'line':
        this.drawLine(shape as LineShape, isSelected)
        break
      case 'arrow':
        this.drawArrow(shape as ArrowShape, isSelected)
        break
      case 'text':
        this.drawText(shape as TextShape, isSelected)
        break
      default:
        this.drawBoundingBox(shape, isSelected)
    }
  }

  /**
   * Draw a rectangle with RoughJS hand-drawn style
   */
  private drawRectangle(shape: RectangleShape, isSelected: boolean): void {
    const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
    const { fill, stroke, strokeWidth } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    if (rotation !== 0) {
      const cx = x + width / 2
      const cy = y + height / 2
      this.ctx.translate(cx, cy)
      this.ctx.rotate(rotation)
      this.ctx.translate(-cx, -cy)
    }

    this.roughCanvas.rectangle(
      x, y, width, height,
      this.buildRoughOptions(seed, roughness, {
        stroke,
        strokeWidth,
        fill: fill && fill !== 'transparent' ? fill : undefined,
        fillStyle: 'solid',
      })
    )

    if (isSelected) {
      this.drawSelectionOutline(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw an ellipse with RoughJS hand-drawn style
   */
  private drawEllipse(shape: EllipseShape, isSelected: boolean): void {
    const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
    const { fill, stroke, strokeWidth } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    const cx = x + width / 2
    const cy = y + height / 2

    if (rotation !== 0) {
      this.ctx.translate(cx, cy)
      this.ctx.rotate(rotation)
      this.ctx.translate(-cx, -cy)
    }

    // RoughJS ellipse takes center coordinates and full width/height
    this.roughCanvas.ellipse(
      cx, cy, width, height,
      this.buildRoughOptions(seed, roughness, {
        stroke,
        strokeWidth,
        fill: fill && fill !== 'transparent' ? fill : undefined,
        fillStyle: 'solid',
      })
    )

    if (isSelected) {
      this.drawSelectionOutline(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw a freehand path using perfect-freehand for variable-width strokes
   */
  private drawPath(shape: PathShape, isSelected: boolean): void {
    const { x, y, opacity, props } = shape
    const { stroke, strokeWidth, points } = props

    if (points.length < 2) return

    // Translate points to absolute canvas coordinates
    const absolutePoints = points.map((p) => ({
      x: x + p.x,
      y: y + p.y,
      pressure: p.pressure,
    }))

    // Check if any point has real pressure data
    const hasRealPressure = absolutePoints.some(
      (p) => p.pressure !== undefined && p.pressure !== 0.5
    )

    const outlinePoints = getStroke(absolutePoints, {
      ...FREEHAND_OPTIONS,
      size: strokeWidth * 3,
      simulatePressure: !hasRealPressure,
    })

    if (outlinePoints.length < 2) return

    this.ctx.save()
    this.ctx.globalAlpha = opacity
    this.ctx.fillStyle = stroke

    // Fill the stroke outline polygon
    const first = outlinePoints[0]!
    this.ctx.beginPath()
    this.ctx.moveTo(first[0]!, first[1]!)

    for (let i = 1; i < outlinePoints.length; i++) {
      const pt = outlinePoints[i]!
      this.ctx.lineTo(pt[0]!, pt[1]!)
    }

    this.ctx.closePath()
    this.ctx.fill()

    if (isSelected) {
      const { width, height } = shape
      this.drawSelectionOutline(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw a line with RoughJS hand-drawn style
   */
  private drawLine(shape: LineShape, isSelected: boolean): void {
    const { x, y, opacity, props, seed, roughness } = shape
    const { stroke, strokeWidth, points } = props

    const startPoint = points[0]
    const endPoint = points[1]
    if (!startPoint || !endPoint) return

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    this.roughCanvas.line(
      x + startPoint.x, y + startPoint.y,
      x + endPoint.x, y + endPoint.y,
      this.buildRoughOptions(seed, roughness, {
        stroke,
        strokeWidth,
      })
    )

    if (isSelected) {
      this.drawSelectionOutline(x, y, shape.width, shape.height)
    }

    this.ctx.restore()
  }

  /**
   * Draw an arrow with RoughJS line + precise arrowhead
   */
  private drawArrow(shape: ArrowShape, isSelected: boolean): void {
    const { x, y, opacity, props, seed, roughness } = shape
    const { stroke, strokeWidth, start, end, endArrowhead } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    const startX = x + start.x
    const startY = y + start.y
    const endX = x + end.x
    const endY = y + end.y

    // Draw line with RoughJS
    this.roughCanvas.line(
      startX, startY, endX, endY,
      this.buildRoughOptions(seed, roughness, {
        stroke,
        strokeWidth,
      })
    )

    // Draw arrowhead (canvas-native for precision at the tip)
    if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
      this.drawArrowhead(startX, startY, endX, endY, strokeWidth * 4, stroke)
    }

    if (isSelected) {
      this.drawSelectionOutline(x, y, shape.width, shape.height)
    }

    this.ctx.restore()
  }

  /**
   * Draw arrowhead triangle at the end point
   */
  private drawArrowhead(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    size: number,
    color: string
  ): void {
    const [wing1, wing2] = calculateArrowhead(
      { x: fromX, y: fromY },
      { x: toX, y: toY },
      size
    )

    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(toX, toY)
    this.ctx.lineTo(wing1.x, wing1.y)
    this.ctx.lineTo(wing2.x, wing2.y)
    this.ctx.closePath()
    this.ctx.fill()
  }

  /**
   * Draw text with multiline support (canvas-native, RoughJS doesn't handle text)
   */
  private drawText(shape: TextShape, isSelected: boolean): void {
    const { x, y, width, opacity, props } = shape
    const { text, fontSize, fontFamily, fontWeight, color, align } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = color
    this.ctx.textAlign = align as CanvasTextAlign
    this.ctx.textBaseline = 'top'

    let textX = x
    if (align === 'center') textX = x + width / 2
    else if (align === 'right') textX = x + width

    const lineHeight = fontSize * 1.2
    const lines = text.split('\n')

    lines.forEach((line, index) => {
      this.ctx.fillText(line, textX, y + index * lineHeight)
    })

    if (isSelected) {
      this.drawSelectionOutline(x, y, shape.width, shape.height)
    }

    this.ctx.restore()
  }

  /**
   * Draw a bounding box for unknown shapes
   */
  private drawBoundingBox(shape: Shape, isSelected: boolean): void {
    const { x, y, width, height } = shape

    this.ctx.save()
    this.ctx.strokeStyle = '#999'
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])
    this.ctx.strokeRect(x, y, width, height)
    this.ctx.setLineDash([])

    if (isSelected) {
      this.drawSelectionOutline(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw selection outline with resize handles
   */
  private drawSelectionOutline(x: number, y: number, width: number, height: number): void {
    const handleSize = 8
    const halfHandle = handleSize / 2

    this.ctx.strokeStyle = '#0066ff'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])
    this.ctx.strokeRect(x, y, width, height)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.strokeStyle = '#0066ff'
    this.ctx.lineWidth = 1

    const handles = [
      { x: x - halfHandle, y: y - halfHandle },
      { x: x + width / 2 - halfHandle, y: y - halfHandle },
      { x: x + width - halfHandle, y: y - halfHandle },
      { x: x + width - halfHandle, y: y + height / 2 - halfHandle },
      { x: x + width - halfHandle, y: y + height - halfHandle },
      { x: x + width / 2 - halfHandle, y: y + height - halfHandle },
      { x: x - halfHandle, y: y + height - halfHandle },
      { x: x - halfHandle, y: y + height / 2 - halfHandle },
    ]

    for (const handle of handles) {
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    }
  }
}
