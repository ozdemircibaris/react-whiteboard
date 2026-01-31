import type { Shape } from '../../types'
import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'

export function createHistoryActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    undo: () => {
      const state = get()
      if (state.historyIndex < 0) return

      const entry = state.history[state.historyIndex]
      if (!entry) return

      const { action } = entry

      if (action.type === 'create') {
        const shapesToDelete = action.shapes
        set((s) => {
          const newShapes = new Map(s.shapes)
          const idsToDelete = new Set(shapesToDelete.map((shape) => shape.id))
          shapesToDelete.forEach((shape) => newShapes.delete(shape.id))
          const newSelectedIds = new Set(s.selectedIds)
          idsToDelete.forEach((id) => newSelectedIds.delete(id))
          return {
            shapes: newShapes,
            shapeIds: s.shapeIds.filter((sid) => !idsToDelete.has(sid)),
            selectedIds: newSelectedIds,
            historyIndex: s.historyIndex - 1,
          }
        })
      } else if (action.type === 'delete') {
        const shapesToRestore = action.shapes
        set((s) => {
          const newShapes = new Map(s.shapes)
          const newShapeIds = [...s.shapeIds]
          shapesToRestore.forEach((shape) => {
            newShapes.set(shape.id, shape)
            if (!newShapeIds.includes(shape.id)) {
              newShapeIds.push(shape.id)
            }
          })
          return {
            shapes: newShapes,
            shapeIds: newShapeIds,
            historyIndex: s.historyIndex - 1,
          }
        })
      } else if (action.type === 'update') {
        const beforeShapes = action.before
        set((s) => {
          const newShapes = new Map(s.shapes)
          beforeShapes.forEach((shape) => newShapes.set(shape.id, shape))
          return {
            shapes: newShapes,
            historyIndex: s.historyIndex - 1,
          }
        })
      } else if (action.type === 'reorder') {
        set((s) => ({
          shapeIds: action.previousShapeIds,
          historyIndex: s.historyIndex - 1,
        }))
      }
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return

      const entry = state.history[state.historyIndex + 1]
      if (!entry) return

      const { action } = entry

      if (action.type === 'create') {
        const shapesToAdd = action.shapes
        set((s) => {
          const newShapes = new Map(s.shapes)
          const newShapeIds = [...s.shapeIds]
          shapesToAdd.forEach((shape) => {
            newShapes.set(shape.id, shape)
            if (!newShapeIds.includes(shape.id)) {
              newShapeIds.push(shape.id)
            }
          })
          return {
            shapes: newShapes,
            shapeIds: newShapeIds,
            historyIndex: s.historyIndex + 1,
          }
        })
      } else if (action.type === 'delete') {
        const shapesToDelete = action.shapes
        set((s) => {
          const newShapes = new Map(s.shapes)
          const idsToDelete = new Set(shapesToDelete.map((shape) => shape.id))
          shapesToDelete.forEach((shape) => newShapes.delete(shape.id))
          const newSelectedIds = new Set(s.selectedIds)
          idsToDelete.forEach((id) => newSelectedIds.delete(id))
          return {
            shapes: newShapes,
            shapeIds: s.shapeIds.filter((sid) => !idsToDelete.has(sid)),
            selectedIds: newSelectedIds,
            historyIndex: s.historyIndex + 1,
          }
        })
      } else if (action.type === 'update') {
        const afterShapes = action.after
        set((s) => {
          const newShapes = new Map(s.shapes)
          afterShapes.forEach((shape) => newShapes.set(shape.id, shape))
          return {
            shapes: newShapes,
            historyIndex: s.historyIndex + 1,
          }
        })
      } else if (action.type === 'reorder') {
        set((s) => ({
          shapeIds: action.newShapeIds,
          historyIndex: s.historyIndex + 1,
        }))
      }
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
