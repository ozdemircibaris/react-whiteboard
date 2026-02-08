import type { Shape } from '../../types'
import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'
import { getBoundTextIdFromShape } from '../../utils/boundText'

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

        const deletedShapes: Shape[] = [shape]

        // Cascade-delete bound text child
        const boundTextId = getBoundTextIdFromShape(shape)
        if (boundTextId) {
          const boundText = state.shapes.get(boundTextId)
          if (boundText) {
            deletedShapes.push(boundText)
            newShapes.delete(boundTextId)
          }
        }

        const historyUpdate = recordHistory
          ? pushHistory(
              state.history,
              state.historyIndex,
              createHistoryEntry({ type: 'delete', shapes: deletedShapes })
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

        // Collect bound text children for cascade deletion
        const boundTextIds: string[] = []
        for (const shape of shapesToDelete) {
          const btId = getBoundTextIdFromShape(shape)
          if (btId && !idsSet.has(btId)) {
            const bt = state.shapes.get(btId)
            if (bt) {
              boundTextIds.push(btId)
              shapesToDelete.push(bt)
              idsSet.add(btId)
            }
          }
        }

        const newShapes = new Map(state.shapes)
        const newSelectedIds = new Set(state.selectedIds)
        for (const id of idsSet) {
          newShapes.delete(id)
          newSelectedIds.delete(id)
        }

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

    /**
     * Batch-update multiple shapes in a single Map copy (no history).
     * Use for hot-path operations like drag-move to avoid N separate Map allocations.
     */
    updateShapesBatch: (updates: Map<string, Partial<Shape>>) => {
      set((state) => {
        const newShapes = new Map(state.shapes)
        for (const [id, partial] of updates) {
          const shape = newShapes.get(id)
          if (!shape) continue
          newShapes.set(id, { ...shape, ...partial } as Shape)
        }
        return { shapes: newShapes }
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
