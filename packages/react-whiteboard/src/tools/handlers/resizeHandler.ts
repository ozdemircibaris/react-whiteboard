import type { Shape, TextShape } from '../../types'
import type { WhiteboardStore } from '../../core/store'
import { RESIZE_CURSORS, type ResizeHandle } from '../../utils/hitTest'
import { applyResize } from '../SelectToolResize'
import type { ToolState, PointerDownResult } from '../types'

/**
 * Resize handle interactions: start resize and apply resize drag.
 */

/**
 * Start a resize operation for the given handle.
 */
export function startResize(
  canvasPoint: { x: number; y: number },
  handle: ResizeHandle,
  selectedShapes: Shape[],
  state: ToolState,
): { result: PointerDownResult; beforeStates: Shape[]; startFontSizes: Map<string, number> } {
  state.isDragging = true
  state.dragStart = canvasPoint
  state.dragCurrent = canvasPoint
  state.resizeHandle = handle
  state.startPositions.clear()

  const startFontSizes = new Map<string, number>()
  selectedShapes.forEach((shape) => {
    state.startPositions.set(shape.id, {
      x: shape.x, y: shape.y, width: shape.width, height: shape.height,
    })
    if (shape.type === 'text') {
      startFontSizes.set(shape.id, (shape as TextShape).props.fontSize)
    }
  })

  return {
    result: { handled: true, capture: true, cursor: RESIZE_CURSORS[handle] },
    beforeStates: selectedShapes.map((s) => structuredClone(s) as Shape),
    startFontSizes,
  }
}

/**
 * Apply resize during a drag operation.
 */
export function applyResizeDrag(
  store: WhiteboardStore,
  state: ToolState,
  moveBeforeStates: Shape[],
  resizeStartFontSizes: Map<string, number>,
  shiftKey: boolean,
): void {
  applyResize(store, state, moveBeforeStates, resizeStartFontSizes, shiftKey)
}
