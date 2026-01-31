import rough from 'roughjs'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type {
  Shape,
  Viewport,
  RectangleShape,
  EllipseShape,
  PathShape,
  LineShape,
  ArrowShape,
  TextShape,
} from '../../types'
import { getDevicePixelRatio } from '../../utils/canvas'
import {
  drawRectangle,
  drawEllipse,
  drawPath,
  drawLine,
  drawArrow,
  drawText,
  drawBoundingBox,
} from './shapeRenderers'

/**
 * Canvas renderer with RoughJS for hand-drawn aesthetic.
 * Orchestrates shape rendering and handles grid/selection drawing.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private roughCanvas: RoughCanvas
  private selectionFn: (x: number, y: number, w: number, h: number) => void

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.roughCanvas = rough.canvas(ctx.canvas)
    this.selectionFn = this.drawSelectionOutline.bind(this)
  }

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
   * Draw a shape — dispatches to type-specific renderer
   */
  drawShape(shape: Shape, isSelected: boolean = false): void {
    const fn = this.selectionFn

    switch (shape.type) {
      case 'rectangle':
        drawRectangle(this.ctx, this.roughCanvas, shape as RectangleShape, isSelected, fn)
        break
      case 'ellipse':
        drawEllipse(this.ctx, this.roughCanvas, shape as EllipseShape, isSelected, fn)
        break
      case 'path':
        drawPath(this.ctx, shape as PathShape, isSelected, fn)
        break
      case 'line':
        drawLine(this.ctx, this.roughCanvas, shape as LineShape, isSelected, fn)
        break
      case 'arrow':
        drawArrow(this.ctx, this.roughCanvas, shape as ArrowShape, isSelected, fn)
        break
      case 'text':
        drawText(this.ctx, shape as TextShape, isSelected, fn)
        break
      default:
        drawBoundingBox(this.ctx, shape, isSelected, fn)
    }
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
