import type { WhiteboardStore } from '../core/store'
import type { Shape, TextShape, LineShape, ArrowShape, PathShape } from '../types'
import {
  getShapeAtPoint,
  hitTestSelectionResizeHandles,
  getSelectionBounds,
  calculateResizedBounds,
  RESIZE_CURSORS,
  type ResizeHandle,
} from '../utils/hitTest'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'
import { textTool } from './TextTool'
import { wrapTextLines } from '../utils/fonts'

/**
 * Select tool - handles selection, moving, and resizing shapes
 */
export class SelectTool implements ITool {
  readonly type = 'select' as const
  readonly cursor = 'default'
  readonly name = 'Select'

  private moveBeforeStates: Shape[] = []
  private resizeStartFontSizes: Map<string, number> = new Map()

  /** Check if all given shapes are text — used to restrict handles to corners only */
  private allText(shapes: Shape[]): boolean {
    return shapes.length > 0 && shapes.every((s) => s.type === 'text')
  }

  private isEdgeHandle(handle: ResizeHandle): boolean {
    return handle.includes('center')
  }

  onActivate(_store: WhiteboardStore): void {
    // Nothing to do
  }

  onDeactivate(store: WhiteboardStore): void {
    store.clearSelection()
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerDownResult {
    const { canvasPoint, shiftKey } = ctx
    const { shapes, shapeIds, selectedIds } = store

    // Check if clicking on a resize handle of current selection
    if (selectedIds.size > 0) {
      const selectedShapes = Array.from(selectedIds)
        .map((id) => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)
      const selectionBounds = getSelectionBounds(selectedShapes)

      if (selectionBounds) {
        const handle = hitTestSelectionResizeHandles(canvasPoint, selectionBounds)
        if (handle && !(this.allText(selectedShapes) && this.isEdgeHandle(handle))) {
          // Start resize
          state.isDragging = true
          state.dragStart = canvasPoint
          state.dragCurrent = canvasPoint
          state.resizeHandle = handle

          // Store starting bounds of all selected shapes
          state.startPositions.clear()
          this.resizeStartFontSizes.clear()
          selectedShapes.forEach((shape) => {
            state.startPositions.set(shape.id, {
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
            })
            if (shape.type === 'text') {
              this.resizeStartFontSizes.set(shape.id, (shape as TextShape).props.fontSize)
            }
          })

          // Deep clone before states to preserve nested props for history
          this.moveBeforeStates = selectedShapes.map((s) => structuredClone(s) as Shape)

          return { handled: true, capture: true, cursor: RESIZE_CURSORS[handle] }
        }
      }
    }

    // Check if clicking on a shape
    const hitShape = getShapeAtPoint(canvasPoint, shapes, shapeIds, 2)

    if (hitShape) {
      if (shiftKey) {
        // Toggle selection with shift
        store.toggleSelection(hitShape.id)

        // If shape was deselected, don't start a drag
        const updatedSelectedIds = store.selectedIds
        if (!updatedSelectedIds.has(hitShape.id)) {
          return { handled: true, capture: false, cursor: 'default' }
        }
      } else if (!selectedIds.has(hitShape.id)) {
        // Select the shape
        store.select(hitShape.id)
      }

      // Start drag for moving — read fresh selectedIds from store
      state.isDragging = true
      state.dragStart = canvasPoint
      state.dragCurrent = canvasPoint

      const currentSelectedIds = store.selectedIds

      state.startPositions.clear()
      const selectedShapes: Shape[] = []
      currentSelectedIds.forEach((id) => {
        const shape = shapes.get(id)
        if (shape) {
          state.startPositions.set(id, {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
          })
          selectedShapes.push(shape)
        }
      })

      // Deep clone before states to preserve nested props for history
      this.moveBeforeStates = selectedShapes.map((s) => structuredClone(s) as Shape)

      return { handled: true, capture: true, cursor: 'move' }
    }

    // Clicked on empty space - clear selection
    if (!shiftKey) {
      store.clearSelection()
    }

    return { handled: false }
  }

  onPointerMove(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerMoveResult {
    const { canvasPoint } = ctx
    const { shapes, shapeIds, selectedIds } = store

    // If dragging with resize handle
    if (state.isDragging && state.resizeHandle && state.dragStart) {
      state.dragCurrent = canvasPoint
      this.handleResize(store, state)
      return { handled: true, cursor: RESIZE_CURSORS[state.resizeHandle] }
    }

    // If dragging shapes (move)
    if (state.isDragging && state.dragStart && !state.resizeHandle) {
      state.dragCurrent = canvasPoint
      this.handleMove(store, state)
      return { handled: true, cursor: 'move' }
    }

    // Not dragging - check hover for cursor
    // First check resize handles on selection
    if (selectedIds.size > 0) {
      const selectedShapes = Array.from(selectedIds)
        .map((id) => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)
      const selectionBounds = getSelectionBounds(selectedShapes)

      if (selectionBounds) {
        const handle = hitTestSelectionResizeHandles(canvasPoint, selectionBounds)
        if (handle && !(this.allText(selectedShapes) && this.isEdgeHandle(handle))) {
          return { handled: true, cursor: RESIZE_CURSORS[handle] }
        }
      }
    }

    // Check if hovering over a shape
    const hitShape = getShapeAtPoint(canvasPoint, shapes, shapeIds, 2)
    if (hitShape) {
      return { handled: true, cursor: 'move' }
    }

    return { handled: false, cursor: 'default' }
  }

  onDoubleClick(ctx: ToolEventContext, store: WhiteboardStore): void {
    const hitShape = getShapeAtPoint(ctx.canvasPoint, store.shapes, store.shapeIds, 2)
    if (hitShape && hitShape.type === 'text') {
      store.setTool('text')
      textTool.editText(hitShape as TextShape, ctx.viewport, store)
    }
  }

  onPointerUp(
    _ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerUpResult {
    if (!state.isDragging) {
      return { handled: false }
    }

    // Record history if shapes were moved/resized
    if (state.dragStart && state.dragCurrent && this.moveBeforeStates.length > 0) {
      const hasMoved =
        state.dragStart.x !== state.dragCurrent.x ||
        state.dragStart.y !== state.dragCurrent.y

      if (hasMoved) {
        // Get current state of shapes for history
        const afterShapes = this.moveBeforeStates
          .map((before) => store.shapes.get(before.id))
          .filter((s): s is Shape => s !== undefined)
          .map((s) => ({ ...s }))

        // Record the update in history manually
        // We need to use the store's internal history mechanism
        // For now, we'll batch update with history
        // The shapes are already updated, we just need to record
        this.recordMoveHistory(store, this.moveBeforeStates, afterShapes)
      }
    }

    // Reset state
    state.isDragging = false
    state.dragStart = null
    state.dragCurrent = null
    state.resizeHandle = null
    state.startPositions.clear()
    this.moveBeforeStates = []
    this.resizeStartFontSizes.clear()

    return { handled: true }
  }

  private handleMove(store: WhiteboardStore, state: ToolState): void {
    if (!state.dragStart || !state.dragCurrent) return

    const dx = state.dragCurrent.x - state.dragStart.x
    const dy = state.dragCurrent.y - state.dragStart.y

    state.startPositions.forEach((startPos, id) => {
      store.updateShape(
        id,
        {
          x: startPos.x + dx,
          y: startPos.y + dy,
        },
        false // Don't record history on each move
      )
    })
  }

  private handleResize(store: WhiteboardStore, state: ToolState): void {
    if (!state.dragStart || !state.dragCurrent || !state.resizeHandle) return

    const dx = state.dragCurrent.x - state.dragStart.x
    const dy = state.dragCurrent.y - state.dragStart.y
    const isCornerHandle = !state.resizeHandle.includes('center')

    state.startPositions.forEach((startBounds, id) => {
      const newBounds = calculateResizedBounds(
        startBounds,
        state.resizeHandle!,
        dx,
        dy
      )

      const shape = store.shapes.get(id)
      if (shape?.type === 'text') {
        const textShape = shape as TextShape

        if (isCornerHandle && startBounds.width > 0) {
          // Corner resize: scale fontSize proportionally
          const originalFontSize = this.resizeStartFontSizes.get(id) ?? textShape.props.fontSize
          const scaleFactor = newBounds.width / startBounds.width
          const newFontSize = Math.max(8, Math.round(originalFontSize * scaleFactor))
          const newProps = { ...textShape.props, fontSize: newFontSize }
          const { height } = wrapTextLines(textShape.props.text, newBounds.width, newProps)
          newBounds.height = height
          store.updateShape(id, { ...newBounds, props: newProps }, false)
        } else {
          // Side resize: rewrap text at new width, keep fontSize
          const { height } = wrapTextLines(textShape.props.text, newBounds.width, textShape.props)
          newBounds.height = height
          store.updateShape(id, newBounds, false)
        }
      } else if (shape?.type === 'line') {
        // Scale line endpoints proportionally
        const original = this.moveBeforeStates.find((s) => s.id === id) as LineShape | undefined
        if (original && startBounds.width > 0 && startBounds.height > 0) {
          const scaleX = newBounds.width / startBounds.width
          const scaleY = newBounds.height / startBounds.height
          const newPoints = original.props.points.map((p) => ({
            x: p.x * scaleX,
            y: p.y * scaleY,
          }))
          store.updateShape(id, { ...newBounds, props: { ...(shape as LineShape).props, points: newPoints } }, false)
        } else {
          store.updateShape(id, newBounds, false)
        }
      } else if (shape?.type === 'arrow') {
        // Scale arrow endpoints proportionally
        const original = this.moveBeforeStates.find((s) => s.id === id) as ArrowShape | undefined
        if (original && startBounds.width > 0 && startBounds.height > 0) {
          const scaleX = newBounds.width / startBounds.width
          const scaleY = newBounds.height / startBounds.height
          const newStart = { x: original.props.start.x * scaleX, y: original.props.start.y * scaleY }
          const newEnd = { x: original.props.end.x * scaleX, y: original.props.end.y * scaleY }
          store.updateShape(id, { ...newBounds, props: { ...(shape as ArrowShape).props, start: newStart, end: newEnd } }, false)
        } else {
          store.updateShape(id, newBounds, false)
        }
      } else if (shape?.type === 'path') {
        // Scale freehand path points proportionally
        const original = this.moveBeforeStates.find((s) => s.id === id) as PathShape | undefined
        if (original && startBounds.width > 0 && startBounds.height > 0) {
          const scaleX = newBounds.width / startBounds.width
          const scaleY = newBounds.height / startBounds.height
          const newPoints = original.props.points.map((p) => ({
            x: p.x * scaleX,
            y: p.y * scaleY,
            pressure: p.pressure,
          }))
          store.updateShape(id, { ...newBounds, props: { ...(shape as PathShape).props, points: newPoints } }, false)
        } else {
          store.updateShape(id, newBounds, false)
        }
      } else {
        store.updateShape(id, newBounds, false)
      }
    })
  }

  private recordMoveHistory(
    store: WhiteboardStore,
    beforeShapes: Shape[],
    afterShapes: Shape[]
  ): void {
    if (beforeShapes.length > 0 && afterShapes.length > 0) {
      store.recordBatchUpdate(beforeShapes, afterShapes)
    }
  }
}

export const selectTool = new SelectTool()
