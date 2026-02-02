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
  ImageShape,
} from '../../types'
import type { ThemeColors } from '../../types/theme'
import { resolveTheme } from '../../types/theme'
import { getDevicePixelRatio } from '../../utils/canvas'
import { drawRotationHandle } from '../../utils/rotationHandle'
import {
  drawRectangle,
  drawEllipse,
  drawPath,
  drawLine,
  drawArrow,
  drawText,
  drawBoundingBox,
} from './shapeRenderers'
import { drawImage } from './imageRenderer'

/**
 * Canvas renderer with RoughJS for hand-drawn aesthetic.
 * Orchestrates shape rendering and handles grid/selection drawing.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private roughCanvas: RoughCanvas
  private selectionFn: (x: number, y: number, w: number, h: number) => void
  private cornerOnlySelectionFn: (x: number, y: number, w: number, h: number) => void
  private theme: ThemeColors

  constructor(ctx: CanvasRenderingContext2D, theme?: Partial<ThemeColors>) {
    this.ctx = ctx
    this.roughCanvas = rough.canvas(ctx.canvas)
    this.theme = resolveTheme(theme)
    this.selectionFn = this.drawSelectionOutline.bind(this, false)
    this.cornerOnlySelectionFn = this.drawSelectionOutline.bind(this, true)
  }

  /** Update the theme colors (e.g. when switching dark/light mode) */
  setTheme(theme: Partial<ThemeColors>): void {
    this.theme = resolveTheme(theme)
  }

  /** Get the current resolved theme */
  getTheme(): ThemeColors {
    return this.theme
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
    this.ctx.strokeStyle = this.theme.grid
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
   * Draw a shape — dispatches to type-specific renderer.
   * Pass allShapes to enable bound text rendering inside container shapes.
   */
  drawShape(shape: Shape, isSelected: boolean = false, allShapes?: Map<string, Shape>): void {
    const fn = this.selectionFn

    switch (shape.type) {
      case 'rectangle':
        drawRectangle(this.ctx, this.roughCanvas, shape as RectangleShape, isSelected, fn, allShapes)
        break
      case 'ellipse':
        drawEllipse(this.ctx, this.roughCanvas, shape as EllipseShape, isSelected, fn, allShapes)
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
        drawText(this.ctx, shape as TextShape, isSelected, this.cornerOnlySelectionFn)
        break
      case 'image':
        drawImage(this.ctx, shape as ImageShape, isSelected, fn)
        break
      default:
        drawBoundingBox(this.ctx, shape, isSelected, fn)
    }
  }

  /**
   * Draw selection outline with resize handles
   */
  private drawSelectionOutline(
    cornersOnly: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const handleSize = 8
    const halfHandle = handleSize / 2

    this.ctx.strokeStyle = this.theme.selectionStroke
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])
    this.ctx.strokeRect(x, y, width, height)

    this.ctx.fillStyle = this.theme.selectionHandleFill
    this.ctx.strokeStyle = this.theme.selectionStroke
    this.ctx.lineWidth = 1

    const corners = [
      { x: x - halfHandle, y: y - halfHandle },
      { x: x + width - halfHandle, y: y - halfHandle },
      { x: x + width - halfHandle, y: y + height - halfHandle },
      { x: x - halfHandle, y: y + height - halfHandle },
    ]

    const edges = [
      { x: x + width / 2 - halfHandle, y: y - halfHandle },
      { x: x + width - halfHandle, y: y + height / 2 - halfHandle },
      { x: x + width / 2 - halfHandle, y: y + height - halfHandle },
      { x: x - halfHandle, y: y + height / 2 - halfHandle },
    ]

    const handles = cornersOnly ? corners : [...corners, ...edges]

    for (const handle of handles) {
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    }

    // Draw rotation handle above top-center
    drawRotationHandle(this.ctx, { x, y, width, height }, {
      stroke: this.theme.rotationStroke,
      fill: this.theme.rotationHandleFill,
    })
  }
}
