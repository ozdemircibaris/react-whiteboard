import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { ArrowShape, Point, Viewport } from '../types'
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
 * Default arrow properties
 */
const DEFAULT_ARROW_PROPS = {
  stroke: '#333333',
  strokeWidth: 2,
  startArrowhead: 'none' as const,
  endArrowhead: 'arrow' as const,
}

/**
 * Minimum arrow length to create a shape
 */
const MIN_ARROW_LENGTH = 5

/**
 * Arrow tool - draws arrows by dragging
 * Shift+drag snaps to 45-degree angles
 */
export class ArrowTool implements ITool {
  readonly type = 'arrow' as const
  readonly cursor = 'crosshair'
  readonly name = 'Arrow'

  private previewStart: Point | null = null
  private previewEnd: Point | null = null

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

    // Start drawing
    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint

    // Initialize preview
    this.previewStart = { ...canvasPoint }
    this.previewEnd = { ...canvasPoint }

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

    // Calculate end point, with optional angle snapping
    let endPoint = ctx.canvasPoint
    if (ctx.shiftKey) {
      endPoint = snapToAngle(state.dragStart, ctx.canvasPoint)
    }

    state.dragCurrent = endPoint
    this.previewStart = { ...state.dragStart }
    this.previewEnd = endPoint

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

    // Calculate end point with optional snapping
    let endPoint = ctx.canvasPoint
    if (ctx.shiftKey) {
      endPoint = snapToAngle(state.dragStart, ctx.canvasPoint)
    }

    // Calculate arrow length
    const length = Math.hypot(
      endPoint.x - state.dragStart.x,
      endPoint.y - state.dragStart.y
    )

    // Only create shape if arrow is long enough
    let createdShape: ArrowShape | undefined
    if (length >= MIN_ARROW_LENGTH) {
      createdShape = this.createShape(state.dragStart, endPoint)
      store.addShape(createdShape, true)
      store.select(createdShape.id)
    }

    // Reset state
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.previewStart = null
    this.previewEnd = null

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
    if (!this.previewStart || !this.previewEnd || !state.isDragging) return

    const { stroke, strokeWidth } = DEFAULT_ARROW_PROPS
    const start = this.previewStart
    const end = this.previewEnd

    ctx.save()
    ctx.globalAlpha = 0.7
    ctx.strokeStyle = stroke
    ctx.fillStyle = stroke
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'

    // Draw line
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    // Draw arrowhead
    this.drawArrowhead(ctx, start, end, strokeWidth * 4)

    ctx.restore()
  }

  /**
   * Draw arrowhead at the end point
   */
  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    size: number
  ): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const headAngle = Math.PI / 6 // 30 degrees

    ctx.beginPath()
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(
      to.x - size * Math.cos(angle - headAngle),
      to.y - size * Math.sin(angle - headAngle)
    )
    ctx.lineTo(
      to.x - size * Math.cos(angle + headAngle),
      to.y - size * Math.sin(angle + headAngle)
    )
    ctx.closePath()
    ctx.fill()
  }

  /**
   * Create arrow shape from two points
   */
  private createShape(start: Point, end: Point): ArrowShape {
    // Calculate bounding box
    const minX = Math.min(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxX = Math.max(start.x, end.x)
    const maxY = Math.max(start.y, end.y)

    // Normalize points relative to bounding box
    const normalizedStart: Point = {
      x: start.x - minX,
      y: start.y - minY,
    }
    const normalizedEnd: Point = {
      x: end.x - minX,
      y: end.y - minY,
    }

    return {
      id: nanoid(),
      type: 'arrow',
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      props: {
        ...DEFAULT_ARROW_PROPS,
        start: normalizedStart,
        end: normalizedEnd,
      },
    }
  }
}

export const arrowTool = new ArrowTool()
