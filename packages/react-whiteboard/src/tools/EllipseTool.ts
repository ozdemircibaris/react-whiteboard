import { nanoid } from 'nanoid'
import rough from 'roughjs'
import type { WhiteboardStore } from '../core/store'
import type { EllipseShape, Viewport } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'

/**
 * Default ellipse properties
 */
const DEFAULT_ELLIPSE_PROPS = {
  fill: '#e0e0e0',
  stroke: '#333333',
  strokeWidth: 2,
}

/**
 * Ellipse tool - draws ellipses by dragging
 */
export class EllipseTool implements ITool {
  readonly type = 'ellipse' as const
  readonly cursor = 'crosshair'
  readonly name = 'Ellipse'

  private previewShape: EllipseShape | null = null

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

    // Start drawing
    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint

    // Create preview shape
    this.previewShape = this.createShape(canvasPoint.x, canvasPoint.y, 0, 0)
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

    // Update preview shape dimensions
    if (this.previewShape && state.dragStart) {
      const bounds = this.calculateBounds(state.dragStart, ctx.canvasPoint, ctx.shiftKey)
      this.previewShape = {
        ...this.previewShape,
        ...bounds,
      }
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

    // Only create shape if it has meaningful size
    let createdShape: EllipseShape | undefined
    if (bounds.width > 5 && bounds.height > 5) {
      createdShape = this.createShape(bounds.x, bounds.y, bounds.width, bounds.height)
      store.addShape(createdShape, true)
      store.select(createdShape.id)
    }

    // Reset state
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.previewShape = null

    return {
      handled: true,
      createdShapes: createdShape ? [createdShape] : undefined,
    }
  }

  renderOverlay(
    ctx: CanvasRenderingContext2D,
    state: ToolState,
    _viewport: Viewport
  ): void {
    if (!this.previewShape || !state.isDragging) return

    const { x, y, width, height, props } = this.previewShape
    const { fill, stroke, strokeWidth } = props

    ctx.save()
    ctx.globalAlpha = 0.7

    const cx = x + width / 2
    const cy = y + height / 2

    const rc = rough.canvas(ctx.canvas)
    rc.ellipse(cx, cy, width, height, {
      seed: 42,
      roughness: 1,
      stroke,
      strokeWidth,
      fill: fill && fill !== 'transparent' ? fill : undefined,
      fillStyle: 'solid',
    })

    ctx.restore()
  }

  private createShape(
    x: number,
    y: number,
    width: number,
    height: number
  ): EllipseShape {
    return {
      id: nanoid(),
      type: 'ellipse',
      x,
      y,
      width,
      height,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      seed: Math.floor(Math.random() * 2147483647),
      roughness: 1,
      props: { ...DEFAULT_ELLIPSE_PROPS },
    }
  }

  private calculateBounds(
    start: { x: number; y: number },
    end: { x: number; y: number },
    constrain: boolean
  ): { x: number; y: number; width: number; height: number } {
    let x = Math.min(start.x, end.x)
    let y = Math.min(start.y, end.y)
    let width = Math.abs(end.x - start.x)
    let height = Math.abs(end.y - start.y)

    // Shift key constrains to circle
    if (constrain) {
      const size = Math.max(width, height)
      width = size
      height = size

      // Adjust position based on drag direction
      if (end.x < start.x) {
        x = start.x - size
      }
      if (end.y < start.y) {
        y = start.y - size
      }
    }

    return { x, y, width, height }
  }
}

export const ellipseTool = new EllipseTool()
