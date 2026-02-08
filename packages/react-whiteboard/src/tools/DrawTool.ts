import { nanoid } from 'nanoid'
import { getStroke } from 'perfect-freehand'
import type { WhiteboardStore } from '../core/store'
import type { PathShape, PathPoint, Viewport } from '../types'
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

/** Maximum points per stroke to prevent memory/performance issues */
const MAX_POINTS = 2000

/**
 * Shared stroke options for perfect-freehand
 */
const STROKE_OPTIONS = {
  size: DEFAULT_PATH_PROPS.strokeWidth * 3,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  start: { cap: true, taper: 0 },
  end: { cap: true, taper: 0 },
}

/**
 * Draw tool - freehand drawing with pressure-sensitive variable-width strokes
 */
export class DrawTool implements ITool {
  readonly type = 'draw' as const
  readonly cursor = 'crosshair'
  readonly name = 'Draw'

  private points: PathPoint[] = []
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
    const { canvasPoint, pressure } = ctx

    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint

    this.points = [{ x: canvasPoint.x, y: canvasPoint.y, pressure }]
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

    // Cap point count to prevent unbounded memory growth on long strokes.
    // After limit, downsample by skipping every other point.
    if (this.points.length < MAX_POINTS || this.points.length % 2 === 0) {
      this.points.push({
        x: ctx.canvasPoint.x,
        y: ctx.canvasPoint.y,
        pressure: ctx.pressure,
      })
    }

    return { handled: true, cursor: 'crosshair' }
  }

  onPointerUp(
    _ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerUpResult {
    if (!state.isDragging || this.points.length < 2) {
      state.isDragging = false
      state.dragStart = null
      state.dragCurrent = null
      state.activeShapeId = null
      this.points = []
      this.currentShapeId = null
      store.setIsDrawing(false)
      return { handled: false }
    }

    const shape = this.createShape(this.points)

    // Clear drag state BEFORE adding shape to store.
    // Canvas scheduleStaticRender skips when toolManager.isDragging() is true,
    // so isDragging must be false for the static canvas to re-render with the new shape.
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.activeShapeId = null
    this.points = []
    this.currentShapeId = null
    store.setIsDrawing(false)

    store.addShape(shape, true)

    // Switch to select tool with the new shape selected
    store.setTool('select')
    store.select(shape.id)

    return {
      handled: true,
      createdShapes: [shape],
    }
  }

  /**
   * Render live preview using perfect-freehand for variable-width strokes
   */
  renderOverlay(
    ctx: CanvasRenderingContext2D,
    state: ToolState,
    _viewport: Viewport
  ): void {
    if (!state.isDragging || this.points.length < 2) return

    const outlinePoints = getStroke(this.points, {
      ...STROKE_OPTIONS,
      last: false,
      simulatePressure: !this.hasRealPressure(),
    })

    if (outlinePoints.length < 2) return

    ctx.save()
    ctx.globalAlpha = 0.8
    ctx.fillStyle = DEFAULT_PATH_PROPS.stroke

    this.fillStrokeOutline(ctx, outlinePoints)

    ctx.restore()
  }

  /**
   * Check if any point has non-default pressure (real pen input)
   */
  private hasRealPressure(): boolean {
    return this.points.some((p) => p.pressure !== undefined && p.pressure !== 0.5)
  }

  /**
   * Fill the stroke outline polygon on canvas
   */
  private fillStrokeOutline(ctx: CanvasRenderingContext2D, outline: number[][]): void {
    const first = outline[0]
    if (!first) return

    ctx.beginPath()
    ctx.moveTo(first[0]!, first[1]!)

    for (let i = 1; i < outline.length; i++) {
      const pt = outline[i]!
      ctx.lineTo(pt[0]!, pt[1]!)
    }

    ctx.closePath()
    ctx.fill()
  }

  private createShape(points: PathPoint[]): PathShape {
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

    const normalizedPoints: PathPoint[] = points.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
      pressure: p.pressure,
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
      seed: Math.floor(Math.random() * 2147483647),
      roughness: 1,
      props: {
        stroke: DEFAULT_PATH_PROPS.stroke,
        strokeWidth: DEFAULT_PATH_PROPS.strokeWidth,
        strokeStyle: 'solid' as const,
        points: normalizedPoints,
        isComplete: true,
      },
    }
  }
}
