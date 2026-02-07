import { useEffect, useRef } from 'react'
import type { Shape, Viewport } from '../types'
import { useWhiteboardContext } from '../context'

export interface WhiteboardEventCallbacks {
  /** Fired when a new shape is added to the canvas */
  onShapeCreate?: (shape: Shape) => void
  /** Fired when an existing shape is modified */
  onShapeUpdate?: (shape: Shape, previous: Shape) => void
  /** Fired when a shape is removed from the canvas */
  onShapeDelete?: (shape: Shape) => void
  /** Fired when the viewport (pan/zoom) changes */
  onViewportChange?: (viewport: Viewport) => void
}

/**
 * Subscribe to granular whiteboard events (shape CRUD + viewport changes).
 * Uses Zustand subscription with shallow diffing to detect individual changes.
 *
 * Must be used inside a <WhiteboardProvider>.
 */
export function useWhiteboardEvents(callbacks: WhiteboardEventCallbacks): void {
  const { store } = useWhiteboardContext()

  // Keep callback refs stable to avoid re-subscribing on every render
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  // Subscribe to shape changes
  useEffect(() => {
    let prevShapes = store.getState().shapes

    const unsubscribe = store.subscribe(
      (s) => s.shapes,
      (currentShapes) => {
        const cbs = callbacksRef.current
        const hasCreate = !!cbs.onShapeCreate
        const hasUpdate = !!cbs.onShapeUpdate
        const hasDelete = !!cbs.onShapeDelete

        if (!hasCreate && !hasUpdate && !hasDelete) {
          prevShapes = currentShapes
          return
        }

        // Detect created and updated shapes
        if (hasCreate || hasUpdate) {
          for (const [id, shape] of currentShapes) {
            const prev = prevShapes.get(id)
            if (!prev) {
              cbs.onShapeCreate?.(shape)
            } else if (prev !== shape) {
              cbs.onShapeUpdate?.(shape, prev)
            }
          }
        }

        // Detect deleted shapes
        if (hasDelete) {
          for (const [id, shape] of prevShapes) {
            if (!currentShapes.has(id)) {
              cbs.onShapeDelete?.(shape)
            }
          }
        }

        prevShapes = currentShapes
      },
    )

    return unsubscribe
  }, [store])

  // Subscribe to viewport changes
  useEffect(() => {
    const unsubscribe = store.subscribe(
      (s) => s.viewport,
      (viewport) => {
        callbacksRef.current.onViewportChange?.(viewport)
      },
    )

    return unsubscribe
  }, [store])
}
