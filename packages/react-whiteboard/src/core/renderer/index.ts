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
import { applyRotation } from './shapeRenderers/shared'
import { drawImage } from './imageRenderer'
import type { ShapeRendererRegistry } from './ShapeRendererRegistry'

/** Cached bitmap entry for a shape during drag */
interface DragCacheEntry {
  canvas: HTMLCanvasElement
  key: string
  /** Half-width of cache region in canvas space */
  halfW: number
  /** Half-height of cache region in canvas space */
  halfH: number
}

/**
 * Canvas renderer with RoughJS for hand-drawn aesthetic.
 * Orchestrates shape rendering and handles grid/selection drawing.
 */
export class CanvasRenderer {
  private static NOOP_SELECTION = (_x: number, _y: number, _w: number, _h: number) => {}

  private ctx: CanvasRenderingContext2D
  private roughCanvas: RoughCanvas
  private selectionFn: (x: number, y: number, w: number, h: number) => void
  private cornerOnlySelectionFn: (x: number, y: number, w: number, h: number) => void
  private theme: ThemeColors
  private registry: ShapeRendererRegistry | null = null
  private dragCache = new Map<string, DragCacheEntry>()

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

  /** Set the custom shape renderer registry */
  setRegistry(registry: ShapeRendererRegistry): void {
    this.registry = registry
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
   * When skipSelection is true, selection outlines are suppressed (used by static canvas).
   */
  drawShape(
    shape: Shape,
    isSelected: boolean = false,
    allShapes?: Map<string, Shape>,
    skipSelection: boolean = false,
  ): void {
    const noop = CanvasRenderer.NOOP_SELECTION
    const fn = skipSelection ? noop : this.selectionFn
    const cornerFn = skipSelection ? noop : this.cornerOnlySelectionFn
    const sel = skipSelection ? false : isSelected

    switch (shape.type) {
      case 'rectangle':
        drawRectangle(this.ctx, this.roughCanvas, shape as RectangleShape, sel, fn, allShapes)
        break
      case 'ellipse':
        drawEllipse(this.ctx, this.roughCanvas, shape as EllipseShape, sel, fn, allShapes)
        break
      case 'path':
        drawPath(this.ctx, shape as PathShape, sel, fn)
        break
      case 'line':
        drawLine(this.ctx, this.roughCanvas, shape as LineShape, sel, fn)
        break
      case 'arrow':
        drawArrow(this.ctx, this.roughCanvas, shape as ArrowShape, sel, fn)
        break
      case 'text':
        drawText(this.ctx, shape as TextShape, sel, cornerFn)
        break
      case 'image':
        drawImage(this.ctx, shape as ImageShape, sel, fn)
        break
      default: {
        const custom = this.registry?.getRenderer(shape.type)
        if (custom) {
          custom.draw({
            ctx: this.ctx,
            roughCanvas: this.roughCanvas,
            shape,
            isSelected: sel,
            drawSelection: fn,
            allShapes: allShapes ?? new Map(),
          })
        } else {
          drawBoundingBox(this.ctx, shape, sel, fn)
        }
      }
    }
  }

  // ── Drag bitmap cache ─────────────────────────────────────────────

  /**
   * Build a lightweight cache key from shape properties that affect rendering (excludes x,y).
   * Uses type-specific property extraction to avoid expensive JSON.stringify on large data
   * (e.g. PathShape with thousands of points, ImageShape with base64 src).
   */
  private shapeCacheKey(shape: Shape, zoom: number): string {
    const base = `${shape.type}|${shape.width}|${shape.height}|${shape.rotation}|${shape.opacity}|${shape.seed}|${shape.roughness}|${zoom}`

    switch (shape.type) {
      case 'rectangle': {
        const p = (shape as RectangleShape).props
        return `${base}|${p.fill}|${p.fillStyle}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.cornerRadius}|${p.boundTextId ?? ''}`
      }
      case 'ellipse': {
        const p = (shape as EllipseShape).props
        return `${base}|${p.fill}|${p.fillStyle}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.boundTextId ?? ''}`
      }
      case 'path': {
        const p = (shape as PathShape).props
        return `${base}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.isComplete}|${p.points.length}`
      }
      case 'line': {
        const p = (shape as LineShape).props
        const pts = p.points
        return `${base}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${pts.length}|${pts[0]?.x}|${pts[0]?.y}|${pts[pts.length - 1]?.x}|${pts[pts.length - 1]?.y}`
      }
      case 'arrow': {
        const p = (shape as ArrowShape).props
        return `${base}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.start.x}|${p.start.y}|${p.end.x}|${p.end.y}|${p.startArrowhead}|${p.endArrowhead}`
      }
      case 'text': {
        const p = (shape as TextShape).props
        return `${base}|${p.text.length}|${p.fontSize}|${p.fontFamily}|${p.fontWeight}|${p.fontStyle}|${p.color}|${p.backgroundColor}|${p.align}|${p.lineHeight}`
      }
      case 'image': {
        const p = (shape as ImageShape).props
        return `${base}|${p.src.length}|${p.naturalWidth}|${p.naturalHeight}`
      }
      default: {
        // Custom shapes: fallback to JSON.stringify (unavoidable for unknown prop structure)
        const p = shape.props as Record<string, unknown>
        return `${base}|${JSON.stringify(p)}`
      }
    }
  }

  /**
   * Draw a shape using a cached offscreen bitmap.
   * On first call (cache miss), renders the shape to an offscreen canvas with RoughJS.
   * On subsequent calls with same visual properties, blits the cached bitmap.
   * Selection outlines are drawn directly (cheap, no caching needed).
   */
  drawShapeCached(
    shape: Shape,
    isSelected: boolean,
    zoom: number,
    allShapes?: Map<string, Shape>,
  ): void {
    const key = this.shapeCacheKey(shape, zoom)
    let entry = this.dragCache.get(shape.id)

    if (!entry || entry.key !== key) {
      entry = this.renderToCache(shape, key, zoom, allShapes)
    }

    // Blit cached bitmap centered on shape's current position
    const blitX = shape.x + shape.width / 2 - entry.halfW
    const blitY = shape.y + shape.height / 2 - entry.halfH
    this.ctx.drawImage(entry.canvas, blitX, blitY, entry.halfW * 2, entry.halfH * 2)

    if (isSelected) this.drawSelectionForShape(shape)
  }

  /**
   * Render a shape to an offscreen canvas and store in the drag cache.
   */
  private renderToCache(
    shape: Shape,
    key: string,
    zoom: number,
    allShapes?: Map<string, Shape>,
  ): DragCacheEntry {
    const strokeWidth = (shape.props as Record<string, unknown>)?.strokeWidth as number ?? 2
    const padding = Math.max(strokeWidth, 2) + 12
    const { rotation, width, height } = shape

    // Compute axis-aligned bounding box of the rotated shape
    const cosA = Math.abs(Math.cos(rotation))
    const sinA = Math.abs(Math.sin(rotation))
    const rotW = width * cosA + height * sinA
    const rotH = width * sinA + height * cosA
    const halfW = rotW / 2 + padding
    const halfH = rotH / 2 + padding

    // Create offscreen canvas at correct pixel density
    const pixW = Math.ceil(halfW * 2 * this.dpr * zoom)
    const pixH = Math.ceil(halfH * 2 * this.dpr * zoom)
    const offCanvas = document.createElement('canvas')
    offCanvas.width = Math.max(pixW, 1)
    offCanvas.height = Math.max(pixH, 1)
    const offCtx = offCanvas.getContext('2d')!
    offCtx.scale(this.dpr * zoom, this.dpr * zoom)

    // Position shape so its center aligns with cache center
    const tempX = halfW - width / 2
    const tempY = halfH - height / 2
    const tempShape = { ...shape, x: tempX, y: tempY } as Shape

    // Swap ctx/roughCanvas to render onto the offscreen canvas
    const origCtx = this.ctx
    const origRc = this.roughCanvas
    this.ctx = offCtx
    this.roughCanvas = rough.canvas(offCanvas)
    this.drawShape(tempShape, false, allShapes, true)
    this.ctx = origCtx
    this.roughCanvas = origRc

    const entry: DragCacheEntry = { canvas: offCanvas, key, halfW, halfH }
    this.dragCache.set(shape.id, entry)
    return entry
  }

  /** Clear the drag bitmap cache (call when drag ends) */
  clearDragCache(): void {
    this.dragCache.clear()
  }

  // ── Selection rendering ─────────────────────────────────────────

  /**
   * Draw only the selection outline for a shape (without rendering the shape itself).
   * Applies the shape's rotation transform so handles are correctly positioned.
   * Used by the interactive canvas for non-transient selected shapes.
   */
  drawSelectionForShape(shape: Shape): void {
    const cornersOnly = shape.type === 'text'
    this.ctx.save()
    applyRotation(this.ctx, shape.rotation, shape.x, shape.y, shape.width, shape.height)
    this.drawSelectionOutline(cornersOnly, shape.x, shape.y, shape.width, shape.height)
    this.ctx.restore()
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
