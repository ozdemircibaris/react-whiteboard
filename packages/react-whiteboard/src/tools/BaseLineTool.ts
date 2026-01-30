import { nanoid } from 'nanoid'
import rough from 'roughjs'
import type { WhiteboardStore } from '../core/store'
import type { Point, Viewport, Shape } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'
import { snapToAngle } from '../utils/canvas'

/**
 * Minimum length to create a shape
 */
const MIN_LENGTH = 5

/**
 * Base class for line-based tools (Line, Arrow)
 * Provides common drag-to-draw functionality with angle snapping
 */
export abstract class BaseLineTool implements ITool {
  abstract readonly type: string
  abstract readonly cursor: string
  abstract readonly name: string

  protected previewStart: Point | null = null
  protected previewEnd: Point | null = null

  /**
   * Default stroke properties - can be overridden by subclasses
   */
  protected get defaultStroke(): string {
    return '#333333'
  }

  protected get defaultStrokeWidth(): number {
    return 2
  }

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
  }

  onDeactivate(_store: WhiteboardStore): void {
    this.previewStart = null
    this.previewEnd = null
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

    this.previewStart = { ...canvasPoint }
    this.previewEnd = { ...canvasPoint }

    return { handled: true, capture: true, cursor: this.cursor }
  }

  onPointerMove(
    ctx: ToolEventContext,
    _store: WhiteboardStore,
    state: ToolState
  ): PointerMoveResult {
    if (!state.isDragging || !state.dragStart) {
      return { handled: false, cursor: this.cursor }
    }

    let endPoint = ctx.canvasPoint
    if (ctx.shiftKey) {
      endPoint = snapToAngle(state.dragStart, ctx.canvasPoint)
    }

    state.dragCurrent = endPoint
    this.previewStart = { ...state.dragStart }
    this.previewEnd = endPoint

    return { handled: true, cursor: this.cursor }
  }

  onPointerUp(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerUpResult {
    if (!state.isDragging || !state.dragStart) {
      return { handled: false }
    }

    let endPoint = ctx.canvasPoint
    if (ctx.shiftKey) {
      endPoint = snapToAngle(state.dragStart, ctx.canvasPoint)
    }

    const length = Math.hypot(
      endPoint.x - state.dragStart.x,
      endPoint.y - state.dragStart.y
    )

    let createdShape: Shape | undefined
    if (length >= MIN_LENGTH) {
      createdShape = this.createShape(state.dragStart, endPoint)
      store.addShape(createdShape, true)
      store.select(createdShape.id)
    }

    this.resetState(state)

    return {
      handled: true,
      createdShapes: createdShape ? [createdShape] : undefined,
    }
  }

  /**
   * Create the specific shape type - implemented by subclasses
   */
  protected abstract createShape(start: Point, end: Point): Shape

  /**
   * Reset tool state after drawing
   */
  protected resetState(state: ToolState): void {
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.previewStart = null
    this.previewEnd = null
  }

  /**
   * Calculate normalized bounding box from two points
   */
  protected calculateBounds(start: Point, end: Point): {
    minX: number
    minY: number
    width: number
    height: number
    normalizedStart: Point
    normalizedEnd: Point
  } {
    const minX = Math.min(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxX = Math.max(start.x, end.x)
    const maxY = Math.max(start.y, end.y)

    return {
      minX,
      minY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
      normalizedStart: { x: start.x - minX, y: start.y - minY },
      normalizedEnd: { x: end.x - minX, y: end.y - minY },
    }
  }

  /**
   * Generate unique ID for shape
   */
  protected generateId(): string {
    return nanoid()
  }

  /**
   * Render preview overlay with RoughJS hand-drawn style
   */
  renderOverlay(
    ctx: CanvasRenderingContext2D,
    state: ToolState,
    _viewport: Viewport
  ): void {
    if (!this.previewStart || !this.previewEnd || !state.isDragging) return

    ctx.save()
    ctx.globalAlpha = 0.7

    const rc = rough.canvas(ctx.canvas)
    rc.line(
      this.previewStart.x, this.previewStart.y,
      this.previewEnd.x, this.previewEnd.y,
      {
        seed: 42,
        roughness: 1,
        stroke: this.defaultStroke,
        strokeWidth: this.defaultStrokeWidth,
      }
    )

    this.renderAdditionalOverlay(ctx, this.previewStart, this.previewEnd)

    ctx.restore()
  }

  /**
   * Hook for subclasses to render additional overlay elements (e.g., arrowheads)
   */
  protected renderAdditionalOverlay(
    _ctx: CanvasRenderingContext2D,
    _start: Point,
    _end: Point
  ): void {
    // Override in subclasses if needed
  }
}
