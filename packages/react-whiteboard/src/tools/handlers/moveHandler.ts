import type { Shape, RectangleShape, EllipseShape } from '../../types'
import type { WhiteboardStore } from '../../core/store'
import { snapToShapes, type SnapLine } from '../../utils/snapping'
import { canContainBoundText, getBoundTextShape, BOUND_TEXT_PADDING } from '../../utils/boundText'
import type { ToolState, PointerDownResult } from '../types'

/**
 * Drag-move logic with snap-to-shape guides and bound text sync.
 */

export interface MoveState {
  moveBeforeStates: Shape[]
  activeSnapLines: SnapLine[]
}

/**
 * Start a move operation for selected (unlocked) shapes.
 */
export function startMove(
  canvasPoint: { x: number; y: number },
  store: WhiteboardStore,
  state: ToolState,
): { result: PointerDownResult; beforeStates: Shape[] } {
  state.isDragging = true
  state.dragStart = canvasPoint
  state.dragCurrent = canvasPoint
  state.startPositions.clear()

  const selectedShapes: Shape[] = []
  store.selectedIds.forEach((id) => {
    const shape = store.shapes.get(id)
    if (shape && !shape.isLocked) {
      state.startPositions.set(id, {
        x: shape.x, y: shape.y, width: shape.width, height: shape.height,
      })
      selectedShapes.push(shape)
    }
  })

  return {
    result: { handled: true, capture: true, cursor: 'move' },
    beforeStates: selectedShapes.map((s) => structuredClone(s) as Shape),
  }
}

/**
 * Apply move delta with snapping and bound-text sync.
 * Returns updated snap lines for overlay rendering.
 */
export function applyMove(
  store: WhiteboardStore,
  state: ToolState,
): SnapLine[] {
  if (!state.dragStart || !state.dragCurrent) return []
  const dx = state.dragCurrent.x - state.dragStart.x
  const dy = state.dragCurrent.y - state.dragStart.y

  if (state.startPositions.size === 0) return []

  // Calculate combined bounds of selection for snapping
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const sp of state.startPositions.values()) {
    minX = Math.min(minX, sp.x + dx)
    minY = Math.min(minY, sp.y + dy)
    maxX = Math.max(maxX, sp.x + dx + sp.width)
    maxY = Math.max(maxY, sp.y + dy + sp.height)
  }

  const movingBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  const result = snapToShapes(movingBounds, store.shapes, store.shapeIds, store.selectedIds)

  const snapDx = result.x - minX
  const snapDy = result.y - minY

  // Batch all position updates (shapes + bound text) into a single Map copy
  const batchUpdates = new Map<string, Partial<Shape>>()
  state.startPositions.forEach((startPos, id) => {
    const newX = startPos.x + dx + snapDx
    const newY = startPos.y + dy + snapDy
    batchUpdates.set(id, { x: newX, y: newY })

    // Move bound text with parent container
    const shape = store.shapes.get(id)
    if (shape && canContainBoundText(shape.type)) {
      const textShape = getBoundTextShape(
        shape as RectangleShape | EllipseShape,
        store.shapes,
      )
      if (textShape) {
        batchUpdates.set(textShape.id, {
          x: newX + BOUND_TEXT_PADDING,
          y: newY + BOUND_TEXT_PADDING,
        })
      }
    }
  })
  store.updateShapesBatch(batchUpdates)

  return result.snapLines
}
