import type { Shape } from '../../types'
import type { StoreApi } from './types'
import { getBoundTextIdFromShape } from '../../utils/boundText'

/**
 * Alignment & distribution actions for selected shapes.
 */
export function createAlignmentActions(
  _set: StoreApi['set'],
  get: StoreApi['get'],
) {
  function getSelectedShapes(): Shape[] {
    const state = get()
    return Array.from(state.selectedIds)
      .map((id) => state.shapes.get(id))
      .filter((s): s is Shape => s !== undefined)
  }

  function batchUpdate(updates: { id: string; x?: number; y?: number }[]): void {
    const state = get()
    const before = updates
      .map((u) => state.shapes.get(u.id))
      .filter((s): s is Shape => s !== undefined)
      .map((s) => structuredClone(s) as Shape)

    for (const { id, x, y } of updates) {
      const partial: Partial<Shape> = {}
      if (x !== undefined) partial.x = x
      if (y !== undefined) partial.y = y
      state.updateShape(id, partial, false)
      // Sync bound text position when container moves
      const shape = state.shapes.get(id)
      if (shape && getBoundTextIdFromShape(shape)) {
        state.syncBoundTextToParent(id)
      }
    }

    const after = updates
      .map((u) => get().shapes.get(u.id))
      .filter((s): s is Shape => s !== undefined)
      .map((s) => ({ ...s }))

    if (before.length > 0) state.recordBatchUpdate(before, after)
  }

  return {
    alignLeft: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 2) return
      const minX = Math.min(...shapes.map((s) => s.x))
      batchUpdate(shapes.map((s) => ({ id: s.id, x: minX })))
    },

    alignRight: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 2) return
      const maxRight = Math.max(...shapes.map((s) => s.x + s.width))
      batchUpdate(shapes.map((s) => ({ id: s.id, x: maxRight - s.width })))
    },

    alignTop: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 2) return
      const minY = Math.min(...shapes.map((s) => s.y))
      batchUpdate(shapes.map((s) => ({ id: s.id, y: minY })))
    },

    alignBottom: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 2) return
      const maxBottom = Math.max(...shapes.map((s) => s.y + s.height))
      batchUpdate(shapes.map((s) => ({ id: s.id, y: maxBottom - s.height })))
    },

    alignCenterH: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 2) return
      const minX = Math.min(...shapes.map((s) => s.x))
      const maxRight = Math.max(...shapes.map((s) => s.x + s.width))
      const centerX = (minX + maxRight) / 2
      batchUpdate(shapes.map((s) => ({ id: s.id, x: centerX - s.width / 2 })))
    },

    alignCenterV: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 2) return
      const minY = Math.min(...shapes.map((s) => s.y))
      const maxBottom = Math.max(...shapes.map((s) => s.y + s.height))
      const centerY = (minY + maxBottom) / 2
      batchUpdate(shapes.map((s) => ({ id: s.id, y: centerY - s.height / 2 })))
    },

    distributeHorizontally: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 3) return
      const sorted = [...shapes].sort((a, b) => a.x - b.x)
      const first = sorted[0]!
      const last = sorted[sorted.length - 1]!
      const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0)
      const totalSpace = (last.x + last.width) - first.x - totalWidth
      const gap = totalSpace / (sorted.length - 1)

      let currentX = first.x + first.width + gap
      const updates = sorted.slice(1, -1).map((s) => {
        const update = { id: s.id, x: currentX }
        currentX += s.width + gap
        return update
      })
      batchUpdate(updates)
    },

    distributeVertically: () => {
      const shapes = getSelectedShapes()
      if (shapes.length < 3) return
      const sorted = [...shapes].sort((a, b) => a.y - b.y)
      const first = sorted[0]!
      const last = sorted[sorted.length - 1]!
      const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0)
      const totalSpace = (last.y + last.height) - first.y - totalHeight
      const gap = totalSpace / (sorted.length - 1)

      let currentY = first.y + first.height + gap
      const updates = sorted.slice(1, -1).map((s) => {
        const update = { id: s.id, y: currentY }
        currentY += s.height + gap
        return update
      })
      batchUpdate(updates)
    },
  }
}
