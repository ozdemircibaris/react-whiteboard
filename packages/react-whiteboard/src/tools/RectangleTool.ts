import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { RectangleShape, Viewport } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'

/**
 * Default rectangle properties
 */
const DEFAULT_RECTANGLE_PROPS = {
  fill: '#e0e0e0',
  stroke: '#333333',
  strokeWidth: 2,
  cornerRadius: 0,
}

/**
 * Rectangle tool - draws rectangles by dragging
 */
export class RectangleTool implements ITool {
  readonly type = 'rectangle' as const
  readonly cursor = 'crosshair'
  readonly name = 'Rectangle'

  private previewShape: RectangleShape | null = null

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
    let createdShape: RectangleShape | undefined
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
    const { fill, stroke, strokeWidth, cornerRadius } = props

    ctx.save()
    ctx.globalAlpha = 0.7

    // Draw preview rectangle
    ctx.beginPath()
    if (cornerRadius > 0) {
      this.roundRect(ctx, x, y, width, height, cornerRadius)
    } else {
      ctx.rect(x, y, width, height)
    }

    if (fill && fill !== 'transparent') {
      ctx.fillStyle = fill
      ctx.fill()
    }

    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = strokeWidth
      ctx.stroke()
    }

    ctx.restore()
  }

  private createShape(
    x: number,
    y: number,
    width: number,
    height: number
  ): RectangleShape {
    return {
      id: nanoid(),
      type: 'rectangle',
      x,
      y,
      width,
      height,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      props: { ...DEFAULT_RECTANGLE_PROPS },
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

    // Shift key constrains to square
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

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + width, y, x + width, y + height, r)
    ctx.arcTo(x + width, y + height, x, y + height, r)
    ctx.arcTo(x, y + height, x, y, r)
    ctx.arcTo(x, y, x + width, y, r)
    ctx.closePath()
  }
}

export const rectangleTool = new RectangleTool()
