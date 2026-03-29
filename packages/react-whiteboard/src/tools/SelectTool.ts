import type { WhiteboardStore } from '../core/store'
import type { Shape, Viewport } from '../types'
import { RESIZE_CURSORS } from '../utils/hitTest'
import { drawSnapLines, type SnapLine } from '../utils/snapping'
import type { ITool, ToolEventContext, ToolState, PointerDownResult, PointerMoveResult, PointerUpResult, ToolProvider } from './types'
import {
  hitTestPointerDown,
  getHoverCursor,
  getSelectedShapes,
  handleClickSelection,
  startMarquee,
  completeMarquee,
  drawMarquee,
  startMove,
  applyMove,
  startResize,
  applyResizeDrag,
  startRotation,
  applyRotation,
  handleDoubleClick,
} from './handlers'

/** Select tool — thin orchestrator that delegates to focused handler modules. */
export class SelectTool implements ITool {
  readonly type = 'select' as const
  readonly cursor = 'default'
  readonly name = 'Select'
  constructor(private manager: ToolProvider) {}

  private moveBeforeStates: Shape[] = []
  private resizeStartFontSizes = new Map<string, number>()
  private isMarquee = false
  private rotationInitialAngle = 0
  private activeSnapLines: SnapLine[] = []

  onActivate(_store: WhiteboardStore): void {}
  onDeactivate(store: WhiteboardStore): void { store.clearSelection() }

  onPointerDown(ctx: ToolEventContext, store: WhiteboardStore, state: ToolState): PointerDownResult {
    const { canvasPoint, shiftKey } = ctx
    const hit = hitTestPointerDown(canvasPoint, store)

    if (hit.type === 'rotation') {
      const selectedShapes = getSelectedShapes(store)
      const rot = startRotation(canvasPoint, selectedShapes, state)
      this.rotationInitialAngle = rot.initialAngle
      this.moveBeforeStates = rot.beforeStates
      return rot.result
    }

    if (hit.type === 'resize' && hit.handle) {
      const selectedShapes = getSelectedShapes(store)
      const res = startResize(canvasPoint, hit.handle, selectedShapes, state)
      this.moveBeforeStates = res.beforeStates
      this.resizeStartFontSizes = res.startFontSizes
      return res.result
    }

    if (hit.type === 'shape' && hit.shape) {
      const earlyResult = handleClickSelection(hit.shape, shiftKey, store)
      if (earlyResult) return earlyResult

      const movableShapes = getSelectedShapes(store).filter((s) => !s.isLocked)
      if (movableShapes.length === 0) {
        return { handled: true, capture: false, cursor: 'not-allowed' }
      }
      const mv = startMove(canvasPoint, store, state)
      this.moveBeforeStates = mv.beforeStates
      return mv.result
    }

    // Empty space — start marquee
    this.isMarquee = true
    return startMarquee(canvasPoint, shiftKey, store, state)
  }

  onPointerMove(ctx: ToolEventContext, store: WhiteboardStore, state: ToolState): PointerMoveResult {
    const { canvasPoint } = ctx
    if (state.isDragging && state.isRotating && state.dragStart) {
      state.dragCurrent = canvasPoint
      applyRotation(store, state, ctx.shiftKey, this.rotationInitialAngle)
      return { handled: true, cursor: 'grab' }
    }

    if (state.isDragging && state.resizeHandle && state.dragStart) {
      state.dragCurrent = canvasPoint
      applyResizeDrag(store, state, this.moveBeforeStates, this.resizeStartFontSizes, ctx.shiftKey)
      return { handled: true, cursor: RESIZE_CURSORS[state.resizeHandle] }
    }

    if (state.isDragging && this.isMarquee && state.dragStart) {
      state.dragCurrent = canvasPoint
      return { handled: true, cursor: 'crosshair' }
    }

    if (state.isDragging && state.dragStart && !state.resizeHandle) {
      state.dragCurrent = canvasPoint
      this.activeSnapLines = applyMove(store, state)
      return { handled: true, cursor: 'move' }
    }

    return getHoverCursor(canvasPoint, store)
  }

  onDoubleClick(ctx: ToolEventContext, store: WhiteboardStore): void {
    handleDoubleClick(ctx, store, this.manager)
  }

  onPointerUp(_ctx: ToolEventContext, store: WhiteboardStore, state: ToolState): PointerUpResult {
    if (!state.isDragging) return { handled: false }
    if (this.isMarquee) completeMarquee(store, state)
    this.recordHistory(store, state)
    this.resetDragState(state)
    return { handled: true }
  }

  renderOverlay(ctx: CanvasRenderingContext2D, state: ToolState, _viewport: Viewport): void {
    if (this.isMarquee && state.dragStart && state.dragCurrent) {
      drawMarquee(ctx, state, this.manager.getTheme())
    }
    if (this.activeSnapLines.length > 0 && state.isDragging) {
      drawSnapLines(ctx, this.activeSnapLines, this.manager.getTheme().snapLine)
    }
  }

  private recordHistory(store: WhiteboardStore, state: ToolState): void {
    if (!state.dragStart || !state.dragCurrent || this.moveBeforeStates.length === 0) return
    if (state.dragStart.x === state.dragCurrent.x && state.dragStart.y === state.dragCurrent.y) return
    const afterShapes = this.moveBeforeStates
      .map((before) => store.shapes.get(before.id))
      .filter((s): s is Shape => s !== undefined)
      .map((s) => ({ ...s }))
    store.recordBatchUpdate(this.moveBeforeStates, afterShapes)
  }

  private resetDragState(state: ToolState): void {
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.resizeHandle = null
    state.isRotating = false
    state.startPositions.clear()
    state.startRotations.clear()
    this.moveBeforeStates = []
    this.resizeStartFontSizes.clear()
    this.isMarquee = false
    this.rotationInitialAngle = 0
    this.activeSnapLines = []
  }
}
