import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore, getState, makeRect, resetShapeCounter } from './storeFactory'

describe('clipboardActions', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  describe('copySelectedShapes', () => {
    it('copies selected shapes to clipboard', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().select('r1')
      store.getState().copySelectedShapes()

      const state = getState(store)
      expect(state.clipboard).toHaveLength(1)
      expect(state.clipboard[0]!.id).toBe('r1')
      expect(state.clipboardPasteCount).toBe(0)
    })

    it('does nothing when nothing is selected', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().copySelectedShapes()
      expect(getState(store).clipboard).toHaveLength(0)
    })
  })

  describe('cutSelectedShapes', () => {
    it('removes shapes and puts them on clipboard', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().select('r1')
      store.getState().cutSelectedShapes()

      const state = getState(store)
      expect(state.shapes.size).toBe(0)
      expect(state.clipboard).toHaveLength(1)
    })

    it('does nothing when nothing selected', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      const before = getState(store).shapes.size
      store.getState().cutSelectedShapes()
      expect(getState(store).shapes.size).toBe(before)
    })
  })

  describe('pasteShapes', () => {
    it('pastes copied shapes with new IDs and offset', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 10, y: 20 }))
      store.getState().select('r1')
      store.getState().copySelectedShapes()
      store.getState().pasteShapes()

      const state = getState(store)
      // Original + pasted
      expect(state.shapes.size).toBe(2)
      // Pasted shape has different ID
      const ids = Array.from(state.shapes.keys())
      expect(ids).toContain('r1')
      const pastedId = ids.find((id) => id !== 'r1')!
      const pasted = state.shapes.get(pastedId)!
      // Offset by 20 (PASTE_OFFSET * 1)
      expect(pasted.x).toBe(30)
      expect(pasted.y).toBe(40)
    })

    it('increments paste offset on consecutive pastes', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 0, y: 0 }))
      store.getState().select('r1')
      store.getState().copySelectedShapes()

      store.getState().pasteShapes()
      store.getState().pasteShapes()

      const state = getState(store)
      // Original + 2 pastes
      expect(state.shapes.size).toBe(3)
    })

    it('does nothing with empty clipboard', () => {
      store.getState().pasteShapes()
      expect(getState(store).shapes.size).toBe(0)
    })

    it('selects pasted shapes', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().select('r1')
      store.getState().copySelectedShapes()
      store.getState().pasteShapes()

      const state = getState(store)
      // Pasted shape should be selected, not the original
      expect(state.selectedIds.has('r1')).toBe(false)
      expect(state.selectedIds.size).toBe(1)
    })
  })

  describe('duplicateSelectedShapes', () => {
    it('duplicates selected shapes with offset', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 10, y: 20 }))
      store.getState().select('r1')
      store.getState().duplicateSelectedShapes()

      const state = getState(store)
      expect(state.shapes.size).toBe(2)

      const ids = Array.from(state.shapes.keys())
      const dupId = ids.find((id) => id !== 'r1')!
      const dup = state.shapes.get(dupId)!
      expect(dup.x).toBe(30)
      expect(dup.y).toBe(40)
    })

    it('does nothing when nothing selected', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().duplicateSelectedShapes()
      expect(getState(store).shapes.size).toBe(1)
    })

    it('selects duplicated shapes', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().select('r1')
      store.getState().duplicateSelectedShapes()

      const state = getState(store)
      expect(state.selectedIds.has('r1')).toBe(false)
      expect(state.selectedIds.size).toBe(1)
    })
  })
})
