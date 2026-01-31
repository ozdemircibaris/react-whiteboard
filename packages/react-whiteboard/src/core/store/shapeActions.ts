import type { Shape } from '../../types'
import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'

export function createShapeActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    addShape: (shape: Shape, recordHistory = true) => {
      set((state) => {
        const newShapes = new Map(state.shapes)
        newShapes.set(shape.id, shape)

        const historyUpdate = recordHistory
          ? pushHistory(
              state.history,
              state.historyIndex,
              createHistoryEntry({ type: 'create', shapes: [shape] })
            )
          : {}

        return {
          shapes: newShapes,
          shapeIds: state.shapeIds.includes(shape.id)
            ? state.shapeIds
            : [...state.shapeIds, shape.id],
          ...historyUpdate,
        }
      })
    },

    updateShape: (id: string, updates: Partial<Shape>, recordHistory = true) => {
      set((state) => {
        const shape = state.shapes.get(id)
        if (!shape) return {}

        const updatedShape = { ...shape, ...updates } as Shape
        const newShapes = new Map(state.shapes)
        newShapes.set(id, updatedShape)

        const historyUpdate = recordHistory
          ? pushHistory(
              state.history,
              state.historyIndex,
              createHistoryEntry({ type: 'update', before: [shape], after: [updatedShape] })
            )
          : {}

        return { shapes: newShapes, ...historyUpdate }
      })
    },

    deleteShape: (id: string, recordHistory = true) => {
      set((state) => {
        const shape = state.shapes.get(id)
        if (!shape) return {}

        const newShapes = new Map(state.shapes)
        newShapes.delete(id)
        const newSelectedIds = new Set(state.selectedIds)
        newSelectedIds.delete(id)

        const historyUpdate = recordHistory
          ? pushHistory(
              state.history,
              state.historyIndex,
              createHistoryEntry({ type: 'delete', shapes: [shape] })
            )
          : {}

        return {
          shapes: newShapes,
          shapeIds: state.shapeIds.filter((sid) => sid !== id),
          selectedIds: newSelectedIds,
          ...historyUpdate,
        }
      })
    },

    deleteShapes: (ids: string[], recordHistory = true) => {
      set((state) => {
        const idsSet = new Set(ids)
        const shapesToDelete = ids
          .map((id) => state.shapes.get(id))
          .filter((shape): shape is Shape => shape !== undefined)

        if (shapesToDelete.length === 0) return {}

        const newShapes = new Map(state.shapes)
        const newSelectedIds = new Set(state.selectedIds)
        ids.forEach((id) => {
          newShapes.delete(id)
          newSelectedIds.delete(id)
        })

        const historyUpdate = recordHistory
          ? pushHistory(
              state.history,
              state.historyIndex,
              createHistoryEntry({ type: 'delete', shapes: shapesToDelete })
            )
          : {}

        return {
          shapes: newShapes,
          shapeIds: state.shapeIds.filter((sid) => !idsSet.has(sid)),
          selectedIds: newSelectedIds,
          ...historyUpdate,
        }
      })
    },

    getShape: (id: string) => get().shapes.get(id),

    clearShapes: (recordHistory = true) => {
      set((state) => {
        const allShapes = Array.from(state.shapes.values())

        const historyUpdate =
          recordHistory && allShapes.length > 0
            ? pushHistory(
                state.history,
                state.historyIndex,
                createHistoryEntry({ type: 'delete', shapes: allShapes })
              )
            : {}

        return {
          shapes: new Map(),
          shapeIds: [],
          selectedIds: new Set<string>(),
          ...historyUpdate,
        }
      })
    },
  }
}
