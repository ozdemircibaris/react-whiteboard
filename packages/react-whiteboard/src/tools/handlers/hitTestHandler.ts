import type { Shape } from '../../types'
import type { WhiteboardStore } from '../../core/store'
import {
  getShapeAtPoint,
  hitTestSelectionResizeHandles,
  getSelectionBounds,
  RESIZE_CURSORS,
  type ResizeHandle,
} from '../../utils/hitTest'
import { hitTestRotationHandle } from '../../utils/rotationHandle'
import type { PointerMoveResult } from '../types'

/**
 * Resolves pointer position to shapes, resize handles, or rotation handles.
 */

/** Check if all shapes are text type */
export function allText(shapes: Shape[]): boolean {
  return shapes.length > 0 && shapes.every((s) => s.type === 'text')
}

/** Check if a resize handle is an edge handle (not corner) */
export function isEdgeHandle(handle: ResizeHandle): boolean {
  return handle.includes('center')
}

/** Get selected shapes from store */
export function getSelectedShapes(store: WhiteboardStore): Shape[] {
  return Array.from(store.selectedIds)
    .map((id) => store.shapes.get(id))
    .filter((s): s is Shape => s !== undefined)
}

export interface HitTestResult {
  type: 'rotation' | 'resize' | 'shape' | 'empty'
  handle?: ResizeHandle
  shape?: Shape
}

/**
 * Determine what the pointer is hitting: rotation handle, resize handle, shape, or empty space.
 */
export function hitTestPointerDown(
  canvasPoint: { x: number; y: number },
  store: WhiteboardStore,
): HitTestResult {
  const { shapes, shapeIds, selectedIds } = store

  if (selectedIds.size > 0) {
    const selectedShapes = getSelectedShapes(store)
    const selectionBounds = getSelectionBounds(selectedShapes)

    if (selectionBounds) {
      const hasUnlocked = selectedShapes.some((s) => !s.isLocked)
      if (hasUnlocked) {
        if (hitTestRotationHandle(canvasPoint, selectionBounds)) {
          return { type: 'rotation' }
        }

        const handle = hitTestSelectionResizeHandles(canvasPoint, selectionBounds)
        if (handle && !(allText(selectedShapes) && isEdgeHandle(handle))) {
          return { type: 'resize', handle }
        }
      }
    }
  }

  const hitShape = getShapeAtPoint(canvasPoint, shapes, shapeIds, 2)
  if (hitShape) {
    return { type: 'shape', shape: hitShape }
  }

  return { type: 'empty' }
}

/**
 * Compute the hover cursor based on pointer position relative to
 * selected shapes, handles, and other shapes.
 */
export function getHoverCursor(
  canvasPoint: { x: number; y: number },
  store: WhiteboardStore,
): PointerMoveResult {
  if (store.selectedIds.size > 0) {
    const selectedShapes = getSelectedShapes(store)
    const selectionBounds = getSelectionBounds(selectedShapes)
    if (selectionBounds) {
      if (hitTestRotationHandle(canvasPoint, selectionBounds)) {
        return { handled: true, cursor: 'grab' }
      }
      const handle = hitTestSelectionResizeHandles(canvasPoint, selectionBounds)
      if (handle && !(allText(selectedShapes) && isEdgeHandle(handle))) {
        return { handled: true, cursor: RESIZE_CURSORS[handle] }
      }
    }
  }
  const hitShape = getShapeAtPoint(canvasPoint, store.shapes, store.shapeIds, 2)
  if (hitShape) {
    return { handled: true, cursor: hitShape.isLocked ? 'not-allowed' : 'move' }
  }
  return { handled: false, cursor: 'default' }
}
