import type { Shape } from '../../types'
import type { WhiteboardStore } from '../../core/store'
import { initRotation, applyRotationDrag } from '../SelectToolRotate'
import type { ToolState, PointerDownResult } from '../types'

/**
 * Rotation handle interactions: start and apply rotation drag.
 */

/**
 * Start a rotation operation.
 * Returns the pointer-down result, initial angle, and before-states for undo.
 */
export function startRotation(
  canvasPoint: { x: number; y: number },
  selectedShapes: Shape[],
  state: ToolState,
): { result: PointerDownResult; initialAngle: number; beforeStates: Shape[] } {
  return initRotation(canvasPoint, selectedShapes, state)
}

/**
 * Apply rotation during a drag operation.
 */
export function applyRotation(
  store: WhiteboardStore,
  state: ToolState,
  shiftKey: boolean,
  rotationInitialAngle: number,
): void {
  applyRotationDrag(store, state, shiftKey, rotationInitialAngle)
}
