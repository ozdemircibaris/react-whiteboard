import type { HistoryAction, Shape } from '../../types'
import type { WhiteboardStore } from './createStore'
import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'

/**
 * Removes shapes from state, cleaning up shapeIds and selectedIds.
 * Used by undo-create and redo-delete.
 */
function removeShapes(
  s: WhiteboardStore,
  shapes: Shape[],
  indexDelta: number,
): Partial<WhiteboardStore> {
  const newShapes = new Map(s.shapes)
  const idsToDelete = new Set(shapes.map((shape) => shape.id))
  shapes.forEach((shape) => newShapes.delete(shape.id))
  const newSelectedIds = new Set(s.selectedIds)
  idsToDelete.forEach((id) => newSelectedIds.delete(id))
  return {
    shapes: newShapes,
    shapeIds: s.shapeIds.filter((sid) => !idsToDelete.has(sid)),
    selectedIds: newSelectedIds,
    historyIndex: s.historyIndex + indexDelta,
  }
}

/**
 * Adds shapes to state, respecting parentId for bound text children.
 * Used by undo-delete and redo-create.
 */
function addShapes(
  s: WhiteboardStore,
  shapes: Shape[],
  indexDelta: number,
): Partial<WhiteboardStore> {
  const newShapes = new Map(s.shapes)
  const newShapeIds = [...s.shapeIds]
  shapes.forEach((shape) => {
    newShapes.set(shape.id, shape)
    // Don't add bound text children to shapeIds (they have parentId)
    if (!shape.parentId && !newShapeIds.includes(shape.id)) {
      newShapeIds.push(shape.id)
    }
  })
  return {
    shapes: newShapes,
    shapeIds: newShapeIds,
    historyIndex: s.historyIndex + indexDelta,
  }
}

/**
 * Applies a history entry in the given direction.
 * Consolidates the duplicated undo/redo branching logic into one place.
 */
function applyHistoryEntry(
  action: HistoryAction,
  direction: 'undo' | 'redo',
  set: StoreApi['set'],
): void {
  const indexDelta = direction === 'undo' ? -1 : 1
  // For undo, create→remove and delete→add; for redo, the reverse
  const isReverse = direction === 'undo'

  if (action.type === 'create') {
    set((s) =>
      isReverse
        ? removeShapes(s, action.shapes, indexDelta)
        : addShapes(s, action.shapes, indexDelta),
    )
  } else if (action.type === 'delete') {
    set((s) =>
      isReverse
        ? addShapes(s, action.shapes, indexDelta)
        : removeShapes(s, action.shapes, indexDelta),
    )
  } else if (action.type === 'update') {
    const shapes = isReverse ? action.before : action.after
    set((s) => {
      const newShapes = new Map(s.shapes)
      shapes.forEach((shape) => newShapes.set(shape.id, shape))
      return { shapes: newShapes, historyIndex: s.historyIndex + indexDelta }
    })
  } else if (action.type === 'reorder') {
    const shapeIds = isReverse ? action.previousShapeIds : action.newShapeIds
    set((s) => ({ shapeIds, historyIndex: s.historyIndex + indexDelta }))
  }
}

export function createHistoryActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    undo: () => {
      const state = get()
      if (state.historyIndex < 0) return
      const entry = state.history[state.historyIndex]
      if (!entry) return
      applyHistoryEntry(entry.action, 'undo', set)
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return
      const entry = state.history[state.historyIndex + 1]
      if (!entry) return
      applyHistoryEntry(entry.action, 'redo', set)
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    recordBatchUpdate: (before: Shape[], after: Shape[]) => {
      if (before.length === 0 || after.length === 0) return

      set((state) => {
        const entry = createHistoryEntry({ type: 'update', before, after })
        return pushHistory(state.history, state.historyIndex, entry)
      })
    },
  }
}
