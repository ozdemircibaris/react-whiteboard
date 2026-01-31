import type { WhiteboardStore } from '../core/store'
import type { Shape, TextShape, RectangleShape, EllipseShape, Viewport } from '../types'
import {
  getShapeAtPoint,
  getShapesInBounds,
  hitTestSelectionResizeHandles,
  getSelectionBounds,
  RESIZE_CURSORS,
  type ResizeHandle,
} from '../utils/hitTest'
import { hitTestRotationHandle } from '../utils/rotationHandle'
import { applyResize } from './SelectToolResize'
import { initRotation, applyRotationDrag } from './SelectToolRotate'
import { snapToShapes, drawSnapLines, type SnapLine } from '../utils/snapping'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'
import { textTool } from './TextTool'
import { canContainBoundText, getBoundTextShape } from '../utils/boundText'

/**
 * Select tool — handles selection, moving, resizing, and rotating shapes
 */
export class SelectTool implements ITool {
  readonly type = 'select' as const
  readonly cursor = 'default'
  readonly name = 'Select'

  private moveBeforeStates: Shape[] = []
  private resizeStartFontSizes: Map<string, number> = new Map()
  private isMarquee = false
  private rotationInitialAngle = 0
  private activeSnapLines: SnapLine[] = []

  private allText(shapes: Shape[]): boolean {
    return shapes.length > 0 && shapes.every((s) => s.type === 'text')
  }

  private isEdgeHandle(handle: ResizeHandle): boolean {
    return handle.includes('center')
  }

  onActivate(_store: WhiteboardStore): void {}

  onDeactivate(store: WhiteboardStore): void {
    store.clearSelection()
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState,
  ): PointerDownResult {
    const { canvasPoint, shiftKey } = ctx
    const { shapes, shapeIds, selectedIds } = store

    if (selectedIds.size > 0) {
      const selectedShapes = this.getSelectedShapes(store)
      const selectionBounds = getSelectionBounds(selectedShapes)

      if (selectionBounds) {
        // Check rotation handle first
        if (hitTestRotationHandle(canvasPoint, selectionBounds)) {
          const rot = initRotation(canvasPoint, selectedShapes, state)
          this.rotationInitialAngle = rot.initialAngle
          this.moveBeforeStates = rot.beforeStates
          return rot.result
        }

        // Check resize handles
        const handle = hitTestSelectionResizeHandles(canvasPoint, selectionBounds)
        if (handle && !(this.allText(selectedShapes) && this.isEdgeHandle(handle))) {
          return this.startResize(canvasPoint, handle, selectedShapes, state)
        }
      }
    }

    // Check if clicking on a shape
    const hitShape = getShapeAtPoint(canvasPoint, shapes, shapeIds, 2)

    if (hitShape) {
      if (shiftKey) {
        store.toggleSelection(hitShape.id)
        if (!store.selectedIds.has(hitShape.id)) {
          return { handled: true, capture: false, cursor: 'default' }
        }
      } else if (!selectedIds.has(hitShape.id)) {
        store.select(hitShape.id)
      }
      return this.startMove(canvasPoint, store, state)
    }

    // Empty space — start marquee
    if (!shiftKey) store.clearSelection()
    this.isMarquee = true
    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint
    return { handled: true, capture: true, cursor: 'crosshair' }
  }

  onPointerMove(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState,
  ): PointerMoveResult {
    const { canvasPoint } = ctx

    // Rotation drag
    if (state.isDragging && state.isRotating && state.dragStart) {
      state.dragCurrent = canvasPoint
      applyRotationDrag(store, state, ctx.shiftKey, this.rotationInitialAngle)
      return { handled: true, cursor: 'grab' }
    }

    // Resize drag
    if (state.isDragging && state.resizeHandle && state.dragStart) {
      state.dragCurrent = canvasPoint
      applyResize(store, state, this.moveBeforeStates, this.resizeStartFontSizes)
      return { handled: true, cursor: RESIZE_CURSORS[state.resizeHandle] }
    }

    // Marquee drag
    if (state.isDragging && this.isMarquee && state.dragStart) {
      state.dragCurrent = canvasPoint
      return { handled: true, cursor: 'crosshair' }
    }

    // Move drag
    if (state.isDragging && state.dragStart && !state.resizeHandle) {
      state.dragCurrent = canvasPoint
      this.handleMove(store, state)
      return { handled: true, cursor: 'move' }
    }

    // Hover
    return this.getHoverCursor(canvasPoint, store)
  }

  onDoubleClick(ctx: ToolEventContext, store: WhiteboardStore): void {
    const hitShape = getShapeAtPoint(ctx.canvasPoint, store.shapes, store.shapeIds, 2)
    if (!hitShape) return

    if (hitShape.type === 'text') {
      store.setTool('text')
      textTool.editText(hitShape as TextShape, ctx.viewport, store)
      return
    }

    if (canContainBoundText(hitShape.type)) {
      const container = hitShape as RectangleShape | EllipseShape
      const existingText = getBoundTextShape(container, store.shapes)

      if (existingText) {
        store.setTool('text')
        textTool.editBoundText(existingText, container, ctx.viewport, store)
      } else {
        const newText = store.createBoundText(hitShape.id)
        if (newText) {
          store.setTool('text')
          textTool.editBoundText(newText, container, ctx.viewport, store)
        }
      }
    }
  }

  onPointerUp(
    _ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState,
  ): PointerUpResult {
    if (!state.isDragging) return { handled: false }

    // Marquee selection
    if (this.isMarquee && state.dragStart && state.dragCurrent) {
      const x = Math.min(state.dragStart.x, state.dragCurrent.x)
      const y = Math.min(state.dragStart.y, state.dragCurrent.y)
      const w = Math.abs(state.dragCurrent.x - state.dragStart.x)
      const h = Math.abs(state.dragCurrent.y - state.dragStart.y)
      if (w > 3 || h > 3) {
        const found = getShapesInBounds(
          { x, y, width: w, height: h }, store.shapes, store.shapeIds,
        )
        if (found.length > 0) store.selectMultiple(found.map((s) => s.id))
      }
    }

    // Record history
    if (state.dragStart && state.dragCurrent && this.moveBeforeStates.length > 0) {
      const hasMoved =
        state.dragStart.x !== state.dragCurrent.x ||
        state.dragStart.y !== state.dragCurrent.y
      if (hasMoved) {
        const afterShapes = this.moveBeforeStates
          .map((before) => store.shapes.get(before.id))
          .filter((s): s is Shape => s !== undefined)
          .map((s) => ({ ...s }))
        store.recordBatchUpdate(this.moveBeforeStates, afterShapes)
      }
    }

    this.resetDragState(state)
    return { handled: true }
  }

  renderOverlay(ctx: CanvasRenderingContext2D, state: ToolState, _viewport: Viewport): void {
    if (this.isMarquee && state.dragStart && state.dragCurrent) {
      this.drawMarquee(ctx, state)
    }
    if (this.activeSnapLines.length > 0 && state.isDragging) {
      drawSnapLines(ctx, this.activeSnapLines)
    }
  }

  // ────────────────────────────────────────────

  private getSelectedShapes(store: WhiteboardStore): Shape[] {
    return Array.from(store.selectedIds)
      .map((id) => store.shapes.get(id))
      .filter((s): s is Shape => s !== undefined)
  }

  private startResize(
    canvasPoint: { x: number; y: number },
    handle: ResizeHandle,
    selectedShapes: Shape[],
    state: ToolState,
  ): PointerDownResult {
    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint
    state.resizeHandle = handle
    state.startPositions.clear()
    this.resizeStartFontSizes.clear()
    selectedShapes.forEach((shape) => {
      state.startPositions.set(shape.id, {
        x: shape.x, y: shape.y, width: shape.width, height: shape.height,
      })
      if (shape.type === 'text') {
        this.resizeStartFontSizes.set(shape.id, (shape as TextShape).props.fontSize)
      }
    })
    this.moveBeforeStates = selectedShapes.map((s) => structuredClone(s) as Shape)
    return { handled: true, capture: true, cursor: RESIZE_CURSORS[handle] }
  }

  private startMove(
    canvasPoint: { x: number; y: number },
    store: WhiteboardStore,
    state: ToolState,
  ): PointerDownResult {
    state.isDragging = true
    state.dragStart = canvasPoint
    state.dragCurrent = canvasPoint
    state.startPositions.clear()
    const selectedShapes: Shape[] = []
    store.selectedIds.forEach((id) => {
      const shape = store.shapes.get(id)
      if (shape) {
        state.startPositions.set(id, {
          x: shape.x, y: shape.y, width: shape.width, height: shape.height,
        })
        selectedShapes.push(shape)
      }
    })
    this.moveBeforeStates = selectedShapes.map((s) => structuredClone(s) as Shape)
    return { handled: true, capture: true, cursor: 'move' }
  }

  private handleMove(store: WhiteboardStore, state: ToolState): void {
    if (!state.dragStart || !state.dragCurrent) return
    const dx = state.dragCurrent.x - state.dragStart.x
    const dy = state.dragCurrent.y - state.dragStart.y

    // Calculate combined bounds of selection for snapping
    const entries = Array.from(state.startPositions.entries())
    if (entries.length === 0) return

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [, sp] of entries) {
      minX = Math.min(minX, sp.x + dx)
      minY = Math.min(minY, sp.y + dy)
      maxX = Math.max(maxX, sp.x + dx + sp.width)
      maxY = Math.max(maxY, sp.y + dy + sp.height)
    }

    const movingBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    const result = snapToShapes(movingBounds, store.shapes, store.shapeIds, store.selectedIds)
    this.activeSnapLines = result.snapLines

    const snapDx = result.x - minX
    const snapDy = result.y - minY

    state.startPositions.forEach((startPos, id) => {
      store.updateShape(id, {
        x: startPos.x + dx + snapDx,
        y: startPos.y + dy + snapDy,
      }, false)
      // Sync bound text position when container moves
      store.syncBoundTextToParent(id)
    })
  }

  private getHoverCursor(
    canvasPoint: { x: number; y: number },
    store: WhiteboardStore,
  ): PointerMoveResult {
    if (store.selectedIds.size > 0) {
      const selectedShapes = this.getSelectedShapes(store)
      const selectionBounds = getSelectionBounds(selectedShapes)
      if (selectionBounds) {
        if (hitTestRotationHandle(canvasPoint, selectionBounds)) {
          return { handled: true, cursor: 'grab' }
        }
        const handle = hitTestSelectionResizeHandles(canvasPoint, selectionBounds)
        if (handle && !(this.allText(selectedShapes) && this.isEdgeHandle(handle))) {
          return { handled: true, cursor: RESIZE_CURSORS[handle] }
        }
      }
    }
    const hitShape = getShapeAtPoint(canvasPoint, store.shapes, store.shapeIds, 2)
    if (hitShape) return { handled: true, cursor: 'move' }
    return { handled: false, cursor: 'default' }
  }

  private drawMarquee(ctx: CanvasRenderingContext2D, state: ToolState): void {
    if (!state.dragStart || !state.dragCurrent) return
    const x = Math.min(state.dragStart.x, state.dragCurrent.x)
    const y = Math.min(state.dragStart.y, state.dragCurrent.y)
    const w = Math.abs(state.dragCurrent.x - state.dragStart.x)
    const h = Math.abs(state.dragCurrent.y - state.dragStart.y)
    ctx.save()
    ctx.fillStyle = 'rgba(0, 102, 255, 0.08)'
    ctx.strokeStyle = 'rgba(0, 102, 255, 0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
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

export const selectTool = new SelectTool()
