import { nanoid } from 'nanoid'
import type { Shape } from '../../types'
import { cloneShape } from '../../types'
import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'
import { collectBoundTextIds, getBoundTextIdFromShape } from '../../utils/boundText'

const PASTE_OFFSET = 20

/**
 * Clipboard actions: copy, cut, paste, duplicate.
 * Clipboard is internal (not system clipboard) for shape data.
 * Includes bound text children when copying/cutting container shapes.
 */
export function createClipboardActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    copySelectedShapes: () => {
      const { shapes, selectedIds } = get()
      if (selectedIds.size === 0) return

      const copied = Array.from(selectedIds)
        .map((id) => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)
        .map((s) => cloneShape(s))

      // Include bound text children
      const boundTextIds = collectBoundTextIds(selectedIds, shapes)
      for (const btId of boundTextIds) {
        const bt = shapes.get(btId)
        if (bt) copied.push(cloneShape(bt))
      }

      set({ clipboard: copied, clipboardPasteCount: 0 })
    },

    cutSelectedShapes: () => {
      const state = get()
      const { shapes, selectedIds } = state
      if (selectedIds.size === 0) return

      const ids = Array.from(selectedIds)
      const shapesToCut = ids
        .map((id) => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)

      if (shapesToCut.length === 0) return

      // Include bound text children
      const boundTextIds = collectBoundTextIds(ids, shapes)
      const allIds = [...ids, ...boundTextIds]
      for (const btId of boundTextIds) {
        const bt = shapes.get(btId)
        if (bt) shapesToCut.push(bt)
      }

      const copied = shapesToCut.map((s) => cloneShape(s))

      const idsSet = new Set(allIds)
      const newShapes = new Map(shapes)
      const newSelectedIds = new Set<string>()
      allIds.forEach((id) => newShapes.delete(id))

      const historyUpdate = pushHistory(
        state.history,
        state.historyIndex,
        createHistoryEntry({ type: 'delete', shapes: shapesToCut }),
      )

      set({
        shapes: newShapes,
        shapeIds: state.shapeIds.filter((sid) => !idsSet.has(sid)),
        selectedIds: newSelectedIds,
        clipboard: copied,
        clipboardPasteCount: 0,
        ...historyUpdate,
      })
    },

    pasteShapes: () => {
      const state = get()
      const { clipboard } = state
      if (!clipboard || clipboard.length === 0) return

      const pasteCount = (state.clipboardPasteCount ?? 0) + 1
      const offset = PASTE_OFFSET * pasteCount

      // Create new shapes with fresh IDs and offset positions
      const idMap = new Map<string, string>()
      let newShapes = clipboard.map((s): Shape => {
        const newId = nanoid()
        idMap.set(s.id, newId)
        const cloned = cloneShape(s)
        return { ...cloned, id: newId, x: s.x + offset, y: s.y + offset, seed: Math.floor(Math.random() * 2 ** 31) }
      })

      // Remap parentId and boundTextId references
      newShapes = newShapes.map((shape): Shape => {
        let updated = shape
        if (shape.parentId && idMap.has(shape.parentId)) {
          updated = { ...updated, parentId: idMap.get(shape.parentId)! }
        }
        const btId = getBoundTextIdFromShape(shape)
        if (btId && idMap.has(btId) && (shape.type === 'rectangle' || shape.type === 'ellipse')) {
          updated = { ...shape, parentId: updated.parentId, props: { ...shape.props, boundTextId: idMap.get(btId)! } }
        }
        return updated
      })

      // Separate z-order shapes from bound text (bound text has parentId)
      const newShapeMap = new Map(state.shapes)
      const newShapeIds = [...state.shapeIds]
      const selectableIds: string[] = []

      for (const shape of newShapes) {
        newShapeMap.set(shape.id, shape)
        if (!shape.parentId || !idMap.has(shape.parentId)) {
          // Only add to z-order if not a bound text child
          newShapeIds.push(shape.id)
          selectableIds.push(shape.id)
        }
      }

      const historyUpdate = pushHistory(
        state.history,
        state.historyIndex,
        createHistoryEntry({ type: 'create', shapes: newShapes }),
      )

      set({
        shapes: newShapeMap,
        shapeIds: newShapeIds,
        selectedIds: new Set(selectableIds),
        clipboardPasteCount: pasteCount,
        ...historyUpdate,
      })
    },

    duplicateSelectedShapes: () => {
      const state = get()
      const { shapes, selectedIds } = state
      if (selectedIds.size === 0) return

      const selected = Array.from(selectedIds)
        .map((id) => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)

      if (selected.length === 0) return

      // Include bound text children
      const boundTextIds = collectBoundTextIds(selectedIds, shapes)
      for (const btId of boundTextIds) {
        const bt = shapes.get(btId)
        if (bt) selected.push(bt)
      }

      const idMap = new Map<string, string>()
      let newShapes = selected.map((s): Shape => {
        const newId = nanoid()
        idMap.set(s.id, newId)
        const cloned = cloneShape(s)
        return { ...cloned, id: newId, x: s.x + PASTE_OFFSET, y: s.y + PASTE_OFFSET, seed: Math.floor(Math.random() * 2 ** 31) }
      })

      // Remap references
      newShapes = newShapes.map((shape): Shape => {
        let updated = shape
        if (shape.parentId && idMap.has(shape.parentId)) {
          updated = { ...updated, parentId: idMap.get(shape.parentId)! }
        }
        const btId = getBoundTextIdFromShape(shape)
        if (btId && idMap.has(btId) && (shape.type === 'rectangle' || shape.type === 'ellipse')) {
          updated = { ...shape, parentId: updated.parentId, props: { ...shape.props, boundTextId: idMap.get(btId)! } }
        }
        return updated
      })

      const newShapeMap = new Map(state.shapes)
      const newShapeIds = [...state.shapeIds]
      const selectableIds: string[] = []

      for (const shape of newShapes) {
        newShapeMap.set(shape.id, shape)
        if (!shape.parentId || !idMap.has(shape.parentId)) {
          newShapeIds.push(shape.id)
          selectableIds.push(shape.id)
        }
      }

      const historyUpdate = pushHistory(
        state.history,
        state.historyIndex,
        createHistoryEntry({ type: 'create', shapes: newShapes }),
      )

      set({
        shapes: newShapeMap,
        shapeIds: newShapeIds,
        selectedIds: new Set(selectableIds),
        ...historyUpdate,
      })
    },
  }
}
