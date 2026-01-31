import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'

/**
 * Z-order actions for reordering shapes in the rendering stack.
 * Uses the existing 'reorder' history action type for undo/redo support.
 */
export function createZOrderActions(set: StoreApi['set'], get: StoreApi['get']) {
  function reorder(newShapeIds: string[]) {
    const state = get()
    const prev = state.shapeIds

    // Skip if nothing changed
    if (prev.length === newShapeIds.length && prev.every((id, i) => id === newShapeIds[i])) return

    const historyUpdate = pushHistory(
      state.history,
      state.historyIndex,
      createHistoryEntry({ type: 'reorder', previousShapeIds: prev, newShapeIds }),
    )

    set({ shapeIds: newShapeIds, ...historyUpdate })
  }

  return {
    /** Move selected shapes to the top of the z-order */
    bringToFront: () => {
      const { shapeIds, selectedIds } = get()
      if (selectedIds.size === 0) return

      const rest = shapeIds.filter((id) => !selectedIds.has(id))
      const selected = shapeIds.filter((id) => selectedIds.has(id))
      reorder([...rest, ...selected])
    },

    /** Move selected shapes to the bottom of the z-order */
    sendToBack: () => {
      const { shapeIds, selectedIds } = get()
      if (selectedIds.size === 0) return

      const rest = shapeIds.filter((id) => !selectedIds.has(id))
      const selected = shapeIds.filter((id) => selectedIds.has(id))
      reorder([...selected, ...rest])
    },

    /** Move selected shapes one step forward in z-order */
    bringForward: () => {
      const { shapeIds, selectedIds } = get()
      if (selectedIds.size === 0) return

      const ids = [...shapeIds]

      // Process from end to start so selected items don't block each other
      for (let i = ids.length - 2; i >= 0; i--) {
        if (selectedIds.has(ids[i]!) && !selectedIds.has(ids[i + 1]!)) {
          const tmp = ids[i]!
          ids[i] = ids[i + 1]!
          ids[i + 1] = tmp
        }
      }

      reorder(ids)
    },

    /** Move selected shapes one step backward in z-order */
    sendBackward: () => {
      const { shapeIds, selectedIds } = get()
      if (selectedIds.size === 0) return

      const ids = [...shapeIds]

      // Process from start to end so selected items don't block each other
      for (let i = 1; i < ids.length; i++) {
        if (selectedIds.has(ids[i]!) && !selectedIds.has(ids[i - 1]!)) {
          const tmp = ids[i]!
          ids[i] = ids[i - 1]!
          ids[i - 1] = tmp
        }
      }

      reorder(ids)
    },
  }
}
