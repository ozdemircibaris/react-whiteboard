import { nanoid } from 'nanoid'
import rough from 'roughjs'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { WhiteboardStore } from '../core/store'
import type { Shape, Viewport } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'
import { drawIndicatorLabel } from './drawIndicator'

export interface ShapeBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Abstract base tool for shape-drawing tools (Rectangle, Ellipse, etc.).
 * Provides shared drag-to-draw, Shift-constrain, and preview logic.
 * Subclasses only need to implement shape-specific creation and rendering.
 */
export abstract class BaseShapeTool implements ITool {
  abstract readonly type: string
  readonly cursor = 'crosshair'
  abstract readonly name: string

  protected previewShape: Shape | null = null
  protected previewSeed = Math.floor(Math.random() * 2147483647)
  private cachedRc: RoughCanvas | null = null
  private cachedRcCanvas: HTMLCanvasElement | null = null

  /** Create the final shape instance to be added to the store */
  protected abstract createShapeInstance(bounds: ShapeBounds, seed: number): Shape

  /** Render the preview shape on the overlay canvas */
  protected abstract renderPreview(ctx: CanvasRenderingContext2D, rc: RoughCanvas, shape: Shape): void

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
  }

  onDeactivate(_store: WhiteboardStore): void {
    this.previewShape = null
  }

  onPointerDown(
    ctx: ToolEventContext,
    _store: WhiteboardStore,
    state: ToolState
  ): PointerDownResult {
    const { canvasPoint } = ctx

    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint

    this.previewShape = this.createShapeInstance(
      { x: canvasPoint.x, y: canvasPoint.y, width: 0, height: 0 },
      this.previewSeed,
    )
    state.activeShapeId = this.previewShape.id

    return { handled: true, capture: true, cursor: 'crosshair' }
  }

  onPointerMove(
    ctx: ToolEventContext,
    _store: WhiteboardStore,
    state: ToolState
  ): PointerMoveResult {
    if (!state.isDragging || !state.dragStart) {
      return { handled: false, cursor: 'crosshair' }
    }

    state.dragCurrent = ctx.canvasPoint

    if (this.previewShape && state.dragStart) {
      const bounds = this.calculateBounds(state.dragStart, ctx.canvasPoint, ctx.shiftKey)
      this.previewShape = {
        ...this.previewShape,
        ...bounds,
      } as Shape
    }

    return { handled: true, cursor: 'crosshair' }
  }

  onPointerUp(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerUpResult {
    if (!state.isDragging || !state.dragStart) {
      return { handled: false }
    }

    const bounds = this.calculateBounds(state.dragStart, ctx.canvasPoint, ctx.shiftKey)

    // Clear drag state BEFORE adding shape to store.
    // Canvas scheduleStaticRender skips when toolManager.isDragging() is true,
    // so isDragging must be false for the static canvas to re-render with the new shape.
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.previewShape = null

    let createdShape: Shape | undefined
    if (bounds.width > 5 && bounds.height > 5) {
      // Use the same seed as preview so the shape doesn't visually jump
      createdShape = this.createShapeInstance(bounds, this.previewSeed)
      store.addShape(createdShape, true)
      // Generate new seed for next shape
      this.previewSeed = Math.floor(Math.random() * 2147483647)
    }

    // Switch to select tool with the new shape selected
    if (createdShape) {
      store.setTool('select')
      store.select(createdShape.id)
    }

    return {
      handled: true,
      createdShapes: createdShape ? [createdShape] : undefined,
    }
  }

  renderOverlay(
    ctx: CanvasRenderingContext2D,
    state: ToolState,
    viewport: Viewport
  ): void {
    if (!this.previewShape || !state.isDragging) return

    ctx.save()
    ctx.globalAlpha = 0.9

    if (!this.cachedRc || this.cachedRcCanvas !== ctx.canvas) {
      this.cachedRc = rough.canvas(ctx.canvas)
      this.cachedRcCanvas = ctx.canvas
    }
    this.renderPreview(ctx, this.cachedRc, this.previewShape)

    ctx.restore()

    // Draw dimension indicator below the shape
    const { width, height } = this.previewShape
    if (width > 10 && height > 10) {
      const label = `${Math.round(width)} × ${Math.round(height)}`
      const labelX = this.previewShape.x + width / 2
      const labelY = this.previewShape.y + height + 16 / viewport.zoom
      drawIndicatorLabel(ctx, label, labelX, labelY, viewport.zoom)
    }
  }

  protected calculateBounds(
    start: { x: number; y: number },
    end: { x: number; y: number },
    constrain: boolean
  ): ShapeBounds {
    let x = Math.min(start.x, end.x)
    let y = Math.min(start.y, end.y)
    let width = Math.abs(end.x - start.x)
    let height = Math.abs(end.y - start.y)

    if (constrain) {
      const size = Math.max(width, height)
      width = size
      height = size

      if (end.x < start.x) {
        x = start.x - size
      }
      if (end.y < start.y) {
        y = start.y - size
      }
    }

    return { x, y, width, height }
  }

  /** Generate a unique shape ID */
  protected generateId(): string {
    return nanoid()
  }
}
