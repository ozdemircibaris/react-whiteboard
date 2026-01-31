import type { WhiteboardStore } from '../core/store'
import type { Shape } from '../types'
import { getSelectionBounds } from '../utils/hitTest'
import { angleFromCenter, calculateRotation } from '../utils/rotationHandle'
import type { ToolState, PointerDownResult } from './types'

/**
 * Initialize a rotation drag operation.
 * Extracted from SelectTool to keep file sizes manageable.
 *
 * Returns the pointer-down result, the initial rotation angle,
 * and the snapshot of shapes before the operation (for undo).
 */
export function initRotation(
  canvasPoint: { x: number; y: number },
  selectedShapes: Shape[],
  state: ToolState,
): { result: PointerDownResult; initialAngle: number; beforeStates: Shape[] } {
  const bounds = getSelectionBounds(selectedShapes)
  const center = bounds
    ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
    : canvasPoint
  const initialAngle = angleFromCenter(center, canvasPoint)

  state.isDragging = true
  state.isRotating = true
  state.dragStart = canvasPoint
  state.dragCurrent = canvasPoint
  state.startRotations.clear()
  selectedShapes.forEach((s) => state.startRotations.set(s.id, s.rotation))

  return {
    result: { handled: true, capture: true, cursor: 'grab' },
    initialAngle,
    beforeStates: selectedShapes.map((s) => structuredClone(s) as Shape),
  }
}

/**
 * Apply rotation during a drag operation.
 * Computes the delta angle from the initial angle and updates all selected shapes.
 */
export function applyRotationDrag(
  store: WhiteboardStore,
  state: ToolState,
  shiftKey: boolean,
  rotationInitialAngle: number,
): void {
  if (!state.dragCurrent) return

  const selectedShapes = Array.from(store.selectedIds)
    .map((id) => store.shapes.get(id))
    .filter((s): s is Shape => s !== undefined)

  const bounds = getSelectionBounds(selectedShapes)
  if (!bounds) return

  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const delta = calculateRotation(center, state.dragCurrent, shiftKey, rotationInitialAngle)

  state.startRotations.forEach((startRotation, id) => {
    store.updateShape(id, { rotation: startRotation + delta }, false)
  })
}
