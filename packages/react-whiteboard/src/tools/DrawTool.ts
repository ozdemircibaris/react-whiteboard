import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { PathShape, Point, Viewport } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'

/**
 * Default path properties
 */
const DEFAULT_PATH_PROPS = {
  stroke: '#333333',
  strokeWidth: 3,
}

/**
 * Draw tool - freehand drawing
 */
export class DrawTool implements ITool {
  readonly type = 'draw' as const
  readonly cursor = 'crosshair'
  readonly name = 'Draw'

  private points: Point[] = []
  private currentShapeId: string | null = null

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
    store.setIsDrawing(false)
  }

  onDeactivate(store: WhiteboardStore): void {
    this.points = []
    this.currentShapeId = null
    store.setIsDrawing(false)
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerDownResult {
    const { canvasPoint } = ctx

    // Start drawing
    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint

    // Initialize points array with first point
    this.points = [{ x: canvasPoint.x, y: canvasPoint.y }]
    this.currentShapeId = nanoid()
    state.activeShapeId = this.currentShapeId

    store.setIsDrawing(true)

    return { handled: true, capture: true, cursor: 'crosshair' }
  }

  onPointerMove(
    ctx: ToolEventContext,
    _store: WhiteboardStore,
    state: ToolState
  ): PointerMoveResult {
    if (!state.isDragging) {
      return { handled: false, cursor: 'crosshair' }
    }

    state.dragCurrent = ctx.canvasPoint

    // Add point to path
    this.points.push({ x: ctx.canvasPoint.x, y: ctx.canvasPoint.y })

    return { handled: true, cursor: 'crosshair' }
  }

  onPointerUp(
    _ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerUpResult {
    if (!state.isDragging || this.points.length < 2) {
      // Reset if not enough points
      state.isDragging = false
      state.dragStart = null
      state.dragCurrent = null
      state.activeShapeId = null
      this.points = []
      this.currentShapeId = null
      store.setIsDrawing(false)
      return { handled: false }
    }

    // Create the path shape
    const shape = this.createShape(this.points)
    store.addShape(shape, true)

    // Reset state
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.points = []
    this.currentShapeId = null
    store.setIsDrawing(false)

    return {
      handled: true,
      createdShapes: [shape],
    }
  }

  renderOverlay(
    ctx: CanvasRenderingContext2D,
    state: ToolState,
    _viewport: Viewport
  ): void {
    if (!state.isDragging || this.points.length < 2) return

    ctx.save()
    ctx.strokeStyle = DEFAULT_PATH_PROPS.stroke
    ctx.lineWidth = DEFAULT_PATH_PROPS.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 0.8

    const firstPoint = this.points[0]
    if (!firstPoint) return

    ctx.beginPath()
    ctx.moveTo(firstPoint.x, firstPoint.y)

    // Use quadratic curves for smoother preview
    for (let i = 1; i < this.points.length - 1; i++) {
      const current = this.points[i]
      const next = this.points[i + 1]
      if (!current || !next) continue

      const midX = (current.x + next.x) / 2
      const midY = (current.y + next.y) / 2
      ctx.quadraticCurveTo(current.x, current.y, midX, midY)
    }

    // Draw to the last point
    const lastPoint = this.points[this.points.length - 1]
    if (lastPoint) {
      ctx.lineTo(lastPoint.x, lastPoint.y)
    }

    ctx.stroke()
    ctx.restore()
  }

  private createShape(points: Point[]): PathShape {
    // Calculate bounds
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    const width = maxX - minX
    const height = maxY - minY

    // Normalize points relative to (0, 0)
    const normalizedPoints = points.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }))

    return {
      id: this.currentShapeId || nanoid(),
      type: 'path',
      x: minX,
      y: minY,
      width,
      height,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      props: {
        stroke: DEFAULT_PATH_PROPS.stroke,
        strokeWidth: DEFAULT_PATH_PROPS.strokeWidth,
        points: normalizedPoints,
        isComplete: true,
      },
    }
  }
}

export const drawTool = new DrawTool()
