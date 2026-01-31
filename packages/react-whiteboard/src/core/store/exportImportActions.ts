import type { Shape, Viewport } from '../../types'
import type { StoreApi } from './types'

/**
 * Export/import actions for saving and loading whiteboard documents.
 */
export function createExportImportActions(_set: StoreApi['set'], get: StoreApi['get']) {
  return {
    /**
     * Load shapes and viewport from an imported document,
     * replacing the current canvas content.
     */
    loadDocument: (shapes: Map<string, Shape>, shapeIds: string[], viewport: Viewport) => {
      const state = get()
      state.clearSelection()
      _set({
        shapes,
        shapeIds,
        viewport,
        history: [],
        historyIndex: -1,
        selectedIds: new Set<string>(),
      })
    },
  }
}
