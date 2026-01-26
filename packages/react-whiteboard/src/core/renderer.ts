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
import { getDevicePixelRatio } from '../utils/canvas'

/**
 * Canvas renderer for drawing shapes
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /**
   * Get current device pixel ratio (dynamically to handle display changes)
   */
  private get dpr(): number {
    return getDevicePixelRatio()
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

    // Calculate grid bounds
    const scaledGridSize = gridSize * zoom
    const offsetX = x % scaledGridSize
    const offsetY = y % scaledGridSize

    // Draw grid lines
    this.ctx.beginPath()
    this.ctx.strokeStyle = '#e5e5e5'
    this.ctx.lineWidth = 1

    // Vertical lines
    for (let gx = offsetX; gx < width; gx += scaledGridSize) {
      this.ctx.moveTo(gx, 0)
      this.ctx.lineTo(gx, height)
    }

    // Horizontal lines
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
        // Unknown shape type - draw bounding box
        this.drawBoundingBox(shape, isSelected)
    }
  }

  /**
   * Draw a rectangle
   */
  private drawRectangle(shape: RectangleShape, isSelected: boolean): void {
    const { x, y, width, height, rotation, opacity, props } = shape
    const { fill, stroke, strokeWidth, cornerRadius } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    // Apply rotation
    if (rotation !== 0) {
      const cx = x + width / 2
      const cy = y + height / 2
      this.ctx.translate(cx, cy)
      this.ctx.rotate(rotation)
      this.ctx.translate(-cx, -cy)
    }

    // Draw rectangle
    this.ctx.beginPath()
    if (cornerRadius > 0) {
      this.roundRect(x, y, width, height, cornerRadius)
    } else {
      this.ctx.rect(x, y, width, height)
    }

    // Fill
    if (fill && fill !== 'transparent') {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    // Stroke
    if (stroke && strokeWidth > 0) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    // Selection outline
    if (isSelected) {
      this.drawSelectionOutline(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw an ellipse
   */
  private drawEllipse(shape: EllipseShape, isSelected: boolean): void {
    const { x, y, width, height, rotation, opacity, props } = shape
    const { fill, stroke, strokeWidth } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    const cx = x + width / 2
    const cy = y + height / 2

    // Apply rotation
    if (rotation !== 0) {
      this.ctx.translate(cx, cy)
      this.ctx.rotate(rotation)
      this.ctx.translate(-cx, -cy)
    }

    // Draw ellipse
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2)

    // Fill
    if (fill && fill !== 'transparent') {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    // Stroke
    if (stroke && strokeWidth > 0) {
      this.ctx.strokeStyle = stroke
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }

    // Selection outline
    if (isSelected) {
      this.drawSelectionOutline(x, y, width, height)
    }

    this.ctx.restore()
  }

  /**
   * Draw a freehand path
   */
  private drawPath(shape: PathShape, isSelected: boolean): void {
    const { x, y, opacity, props } = shape
    const { stroke, strokeWidth, points } = props

    if (points.length < 2) return

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    this.ctx.beginPath()
    this.ctx.moveTo(x + points[0]!.x, y + points[0]!.y)

    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i]!
      const next = points[i + 1]!
      const midX = (current.x + next.x) / 2
      const midY = (current.y + next.y) / 2
      this.ctx.quadraticCurveTo(x + current.x, y + current.y, x + midX, y + midY)
    }

    // Draw to the last point
    const lastPoint = points[points.length - 1]!
    this.ctx.lineTo(x + lastPoint.x, y + lastPoint.y)

    this.ctx.strokeStyle = stroke
    this.ctx.lineWidth = strokeWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.stroke()

    // Selection outline
    if (isSelected) {
      const { width, height } = shape
      this.drawSelectionOutline(x, y, width, height)
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
   * Draw selection outline with handles
   */
  private drawSelectionOutline(x: number, y: number, width: number, height: number): void {
    const handleSize = 8
    const halfHandle = handleSize / 2

    // Draw outline
    this.ctx.strokeStyle = '#0066ff'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])
    this.ctx.strokeRect(x, y, width, height)

    // Draw handles
    this.ctx.fillStyle = '#ffffff'
    this.ctx.strokeStyle = '#0066ff'
    this.ctx.lineWidth = 1

    const handles = [
      { x: x - halfHandle, y: y - halfHandle }, // Top-left
      { x: x + width / 2 - halfHandle, y: y - halfHandle }, // Top-center
      { x: x + width - halfHandle, y: y - halfHandle }, // Top-right
      { x: x + width - halfHandle, y: y + height / 2 - halfHandle }, // Right-center
      { x: x + width - halfHandle, y: y + height - halfHandle }, // Bottom-right
      { x: x + width / 2 - halfHandle, y: y + height - halfHandle }, // Bottom-center
      { x: x - halfHandle, y: y + height - halfHandle }, // Bottom-left
      { x: x - halfHandle, y: y + height / 2 - halfHandle }, // Left-center
    ]

    handles.forEach((handle) => {
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })
  }

  /**
   * Draw a line
   */
  private drawLine(shape: LineShape, isSelected: boolean): void {
    const { x, y, opacity, props } = shape
    const { stroke, strokeWidth, points } = props

    const startPoint = points[0]
    const endPoint = points[1]
    if (!startPoint || !endPoint) return

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    this.ctx.beginPath()
    this.ctx.moveTo(x + startPoint.x, y + startPoint.y)
    this.ctx.lineTo(x + endPoint.x, y + endPoint.y)

    this.ctx.strokeStyle = stroke
    this.ctx.lineWidth = strokeWidth
    this.ctx.lineCap = 'round'
    this.ctx.stroke()

    if (isSelected) {
      this.drawSelectionOutline(x, y, shape.width, shape.height)
    }

    this.ctx.restore()
  }

  /**
   * Draw an arrow
   */
  private drawArrow(shape: ArrowShape, isSelected: boolean): void {
    const { x, y, opacity, props } = shape
    const { stroke, strokeWidth, start, end, endArrowhead } = props

    this.ctx.save()
    this.ctx.globalAlpha = opacity

    const startX = x + start.x
    const startY = y + start.y
    const endX = x + end.x
    const endY = y + end.y

    // Draw line
    this.ctx.beginPath()
    this.ctx.moveTo(startX, startY)
    this.ctx.lineTo(endX, endY)
    this.ctx.strokeStyle = stroke
    this.ctx.lineWidth = strokeWidth
    this.ctx.lineCap = 'round'
    this.ctx.stroke()

    // Draw arrowhead at end
    if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
      this.drawArrowhead(startX, startY, endX, endY, strokeWidth * 4, stroke)
    }

    if (isSelected) {
      this.drawSelectionOutline(x, y, shape.width, shape.height)
    }

    this.ctx.restore()
  }

  /**
   * Draw arrowhead at the end point
   */
  private drawArrowhead(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    size: number,
    color: string
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX)
    const headAngle = Math.PI / 6 // 30 degrees

    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(toX, toY)
    this.ctx.lineTo(
      toX - size * Math.cos(angle - headAngle),
      toY - size * Math.sin(angle - headAngle)
    )
    this.ctx.lineTo(
      toX - size * Math.cos(angle + headAngle),
      toY - size * Math.sin(angle + headAngle)
    )
    this.ctx.closePath()
    this.ctx.fill()
  }

  /**
   * Draw text with multiline support
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

    // Calculate x position based on alignment
    let textX = x
    if (align === 'center') textX = x + width / 2
    else if (align === 'right') textX = x + width

    // Handle multiline text
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
   * Draw a rounded rectangle path
   */
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    this.ctx.moveTo(x + r, y)
    this.ctx.arcTo(x + width, y, x + width, y + height, r)
    this.ctx.arcTo(x + width, y + height, x, y + height, r)
    this.ctx.arcTo(x, y + height, x, y, r)
    this.ctx.arcTo(x, y, x + width, y, r)
    this.ctx.closePath()
  }
}
