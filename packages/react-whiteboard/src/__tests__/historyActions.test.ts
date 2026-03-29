import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore, getState, makeRect, resetShapeCounter } from './storeFactory'

describe('historyActions', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  describe('undo / redo for create', () => {
    it('undoes a shape creation', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      expect(getState(store).shapes.size).toBe(1)

      store.getState().undo()
      expect(getState(store).shapes.size).toBe(0)
      expect(getState(store).shapeIds).toEqual([])
    })

    it('redoes a shape creation', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().undo()
      store.getState().redo()

      expect(getState(store).shapes.size).toBe(1)
      expect(getState(store).shapeIds).toEqual(['r1'])
    })
  })

  describe('undo / redo for delete', () => {
    it('undoes a shape deletion (restores shape)', () => {
      const rect = makeRect({ id: 'r1' })
      store.getState().addShape(rect)
      store.getState().deleteShape('r1')

      expect(getState(store).shapes.size).toBe(0)
      store.getState().undo()
      expect(getState(store).shapes.size).toBe(1)
      expect(getState(store).shapes.get('r1')).toEqual(rect)
    })

    it('redoes a shape deletion', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().deleteShape('r1')
      store.getState().undo()
      store.getState().redo()

      expect(getState(store).shapes.size).toBe(0)
    })
  })

  describe('undo / redo for update', () => {
    it('undoes a shape update', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 10 }))
      store.getState().updateShape('r1', { x: 99 })

      store.getState().undo()
      expect(getState(store).shapes.get('r1')!.x).toBe(10)
    })

    it('redoes a shape update', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 10 }))
      store.getState().updateShape('r1', { x: 99 })
      store.getState().undo()
      store.getState().redo()

      expect(getState(store).shapes.get('r1')!.x).toBe(99)
    })
  })

  describe('round-trip: add 3 shapes, undo 3, zero shapes', () => {
    it('restores empty state after undoing all creates', () => {
      store.getState().addShape(makeRect({ id: 'a' }))
      store.getState().addShape(makeRect({ id: 'b' }))
      store.getState().addShape(makeRect({ id: 'c' }))

      expect(getState(store).shapes.size).toBe(3)

      store.getState().undo()
      store.getState().undo()
      store.getState().undo()

      expect(getState(store).shapes.size).toBe(0)
      expect(getState(store).shapeIds).toEqual([])
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo is false when no history', () => {
      expect(store.getState().canUndo()).toBe(false)
    })

    it('canUndo is true after action', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      expect(store.getState().canUndo()).toBe(true)
    })

    it('canRedo is false when at latest', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      expect(store.getState().canRedo()).toBe(false)
    })

    it('canRedo is true after undo', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().undo()
      expect(store.getState().canRedo()).toBe(true)
    })
  })

  describe('max history depth', () => {
    it('trims history beyond MAX_HISTORY (100)', () => {
      for (let i = 0; i < 110; i++) {
        store.getState().addShape(makeRect({ id: `s${i}` }))
      }
      // MAX_HISTORY is 100, so oldest entries are trimmed
      expect(getState(store).history.length).toBeLessThanOrEqual(100)
    })
  })

  describe('undo does nothing at beginning', () => {
    it('does not crash when undoing with no history', () => {
      store.getState().undo()
      expect(getState(store).shapes.size).toBe(0)
    })
  })

  describe('redo does nothing at end', () => {
    it('does not crash when redoing at latest', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().redo()
      expect(getState(store).shapes.size).toBe(1)
    })
  })

  describe('recordBatchUpdate', () => {
    it('records a batch update in history', () => {
      const r1 = makeRect({ id: 'r1', x: 10 })
      store.getState().addShape(r1)

      const before = [{ ...r1 }]
      store.getState().updateShape('r1', { x: 50 }, false)
      const after = [getState(store).shapes.get('r1')!]

      store.getState().recordBatchUpdate(before, after)

      // Should have 2 entries: add + batch update
      expect(getState(store).history).toHaveLength(2)
    })

    it('does nothing with empty arrays', () => {
      const before = getState(store).history.length
      store.getState().recordBatchUpdate([], [])
      expect(getState(store).history.length).toBe(before)
    })
  })
})
