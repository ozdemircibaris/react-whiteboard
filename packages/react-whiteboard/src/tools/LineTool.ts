import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { LineShape, Point, Viewport } from '../types'
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
 * Default line properties
 */
const DEFAULT_LINE_PROPS = {
  stroke: '#333333',
  strokeWidth: 2,
}

/**
 * Minimum line length to create a shape
 */
const MIN_LINE_LENGTH = 5

/**
 * Line tool - draws lines by dragging
 * Shift+drag snaps to 45-degree angles
 */
export class LineTool implements ITool {
  readonly type = 'line' as const
  readonly cursor = 'crosshair'
  readonly name = 'Line'

  private previewPoints: Point[] = []

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
  }

  onDeactivate(_store: WhiteboardStore): void {
    this.previewPoints = []
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

    // Initialize preview with start point
    this.previewPoints = [{ ...canvasPoint }, { ...canvasPoint }]

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
    this.previewPoints = [{ ...state.dragStart }, endPoint]

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

    // Calculate line length
    const length = Math.hypot(
      endPoint.x - state.dragStart.x,
      endPoint.y - state.dragStart.y
    )

    // Only create shape if line is long enough
    let createdShape: LineShape | undefined
    if (length >= MIN_LINE_LENGTH) {
      createdShape = this.createShape(state.dragStart, endPoint)
      store.addShape(createdShape, true)
      store.select(createdShape.id)
    }

    // Reset state
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.previewPoints = []

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
    if (this.previewPoints.length < 2 || !state.isDragging) return

    const start = this.previewPoints[0]
    const end = this.previewPoints[1]
    if (!start || !end) return

    ctx.save()
    ctx.globalAlpha = 0.7
    ctx.strokeStyle = DEFAULT_LINE_PROPS.stroke
    ctx.lineWidth = DEFAULT_LINE_PROPS.strokeWidth
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    ctx.restore()
  }

  /**
   * Create line shape from two points
   */
  private createShape(start: Point, end: Point): LineShape {
    // Calculate bounding box
    const minX = Math.min(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxX = Math.max(start.x, end.x)
    const maxY = Math.max(start.y, end.y)

    // Normalize points relative to bounding box
    const normalizedPoints: Point[] = [
      { x: start.x - minX, y: start.y - minY },
      { x: end.x - minX, y: end.y - minY },
    ]

    return {
      id: nanoid(),
      type: 'line',
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 1), // Min 1px for vertical lines
      height: Math.max(maxY - minY, 1), // Min 1px for horizontal lines
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      props: {
        ...DEFAULT_LINE_PROPS,
        points: normalizedPoints,
      },
    }
  }
}

export const lineTool = new LineTool()
