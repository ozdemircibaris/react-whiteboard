import { nanoid } from 'nanoid'
import type { Shape } from '../../types'
import type { StoreApi } from './types'
import { createHistoryEntry, pushHistory } from './historyHelpers'

const PASTE_OFFSET = 20

/**
 * Clipboard actions: copy, cut, paste, duplicate.
 * Clipboard is internal (not system clipboard) for shape data.
 */
export function createClipboardActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    copySelectedShapes: () => {
      const { shapes, selectedIds } = get()
      if (selectedIds.size === 0) return

      const copied = Array.from(selectedIds)
        .map((id) => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)
        .map((s) => structuredClone(s) as Shape)

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

      // Copy to clipboard
      const copied = shapesToCut.map((s) => structuredClone(s) as Shape)

      // Delete shapes
      const idsSet = new Set(ids)
      const newShapes = new Map(shapes)
      const newSelectedIds = new Set<string>()
      ids.forEach((id) => newShapes.delete(id))

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
      const newShapes = clipboard.map((s) => {
        const newId = nanoid()
        idMap.set(s.id, newId)
        return {
          ...structuredClone(s),
          id: newId,
          x: s.x + offset,
          y: s.y + offset,
          seed: Math.floor(Math.random() * 2 ** 31),
        } as Shape
      })

      const newShapeMap = new Map(state.shapes)
      const newShapeIds = [...state.shapeIds]
      newShapes.forEach((shape) => {
        newShapeMap.set(shape.id, shape)
        newShapeIds.push(shape.id)
      })

      const historyUpdate = pushHistory(
        state.history,
        state.historyIndex,
        createHistoryEntry({ type: 'create', shapes: newShapes }),
      )

      set({
        shapes: newShapeMap,
        shapeIds: newShapeIds,
        selectedIds: new Set(newShapes.map((s) => s.id)),
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

      const newShapes = selected.map((s) => ({
        ...structuredClone(s),
        id: nanoid(),
        x: s.x + PASTE_OFFSET,
        y: s.y + PASTE_OFFSET,
        seed: Math.floor(Math.random() * 2 ** 31),
      } as Shape))

      const newShapeMap = new Map(state.shapes)
      const newShapeIds = [...state.shapeIds]
      newShapes.forEach((shape) => {
        newShapeMap.set(shape.id, shape)
        newShapeIds.push(shape.id)
      })

      const historyUpdate = pushHistory(
        state.history,
        state.historyIndex,
        createHistoryEntry({ type: 'create', shapes: newShapes }),
      )

      set({
        shapes: newShapeMap,
        shapeIds: newShapeIds,
        selectedIds: new Set(newShapes.map((s) => s.id)),
        ...historyUpdate,
      })
    },
  }
}
