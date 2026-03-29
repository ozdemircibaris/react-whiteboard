import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore, getState, makeRect, makeEllipse, resetShapeCounter } from './storeFactory'

describe('shapeActions', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  describe('addShape', () => {
    it('adds a shape to the store', () => {
      const rect = makeRect({ id: 'r1' })
      store.getState().addShape(rect)

      const state = getState(store)
      expect(state.shapes.size).toBe(1)
      expect(state.shapes.get('r1')).toEqual(rect)
      expect(state.shapeIds).toEqual(['r1'])
    })

    it('does not duplicate shapeId when adding same id', () => {
      const rect = makeRect({ id: 'r1' })
      store.getState().addShape(rect)
      store.getState().addShape({ ...rect, x: 50 })

      const state = getState(store)
      expect(state.shapeIds.filter((id) => id === 'r1')).toHaveLength(1)
    })

    it('records history by default', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      const state = getState(store)
      expect(state.history).toHaveLength(1)
      expect(state.historyIndex).toBe(0)
    })

    it('skips history when recordHistory=false', () => {
      store.getState().addShape(makeRect({ id: 'r1' }), false)
      const state = getState(store)
      expect(state.history).toHaveLength(0)
      expect(state.historyIndex).toBe(-1)
    })
  })

  describe('updateShape', () => {
    it('updates a shape property', () => {
      const rect = makeRect({ id: 'r1', x: 10 })
      store.getState().addShape(rect)
      store.getState().updateShape('r1', { x: 50 })

      expect(getState(store).shapes.get('r1')!.x).toBe(50)
    })

    it('returns empty when shape does not exist', () => {
      store.getState().updateShape('nonexistent', { x: 50 })
      expect(getState(store).shapes.size).toBe(0)
    })

    it('records history for update', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().updateShape('r1', { x: 99 })
      expect(getState(store).history).toHaveLength(2)
    })
  })

  describe('deleteShape', () => {
    it('removes a shape from the store', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().deleteShape('r1')

      const state = getState(store)
      expect(state.shapes.size).toBe(0)
      expect(state.shapeIds).toEqual([])
    })

    it('removes shape from selectedIds', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().select('r1')
      store.getState().deleteShape('r1')

      expect(getState(store).selectedIds.size).toBe(0)
    })

    it('does nothing when shape does not exist', () => {
      store.getState().deleteShape('nonexistent')
      expect(getState(store).shapes.size).toBe(0)
    })
  })

  describe('deleteShapes (batch)', () => {
    it('deletes multiple shapes at once', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().addShape(makeRect({ id: 'r2' }))
      store.getState().addShape(makeRect({ id: 'r3' }))

      store.getState().deleteShapes(['r1', 'r3'])

      const state = getState(store)
      expect(state.shapes.size).toBe(1)
      expect(state.shapeIds).toEqual(['r2'])
    })

    it('does nothing for empty array', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      const before = getState(store).history.length
      store.getState().deleteShapes([])
      expect(getState(store).history.length).toBe(before)
    })
  })

  describe('updateShapesBatch', () => {
    it('updates multiple shapes in a single Map copy', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 0 }))
      store.getState().addShape(makeRect({ id: 'r2', x: 0 }))

      const updates = new Map<string, Partial<{ x: number }>>()
      updates.set('r1', { x: 100 })
      updates.set('r2', { x: 200 })
      store.getState().updateShapesBatch(updates)

      expect(getState(store).shapes.get('r1')!.x).toBe(100)
      expect(getState(store).shapes.get('r2')!.x).toBe(200)
    })

    it('skips non-existent shapes', () => {
      store.getState().addShape(makeRect({ id: 'r1', x: 0 }))

      const updates = new Map<string, Partial<{ x: number }>>()
      updates.set('r1', { x: 100 })
      updates.set('nope', { x: 999 })
      store.getState().updateShapesBatch(updates)

      expect(getState(store).shapes.get('r1')!.x).toBe(100)
      expect(getState(store).shapes.has('nope')).toBe(false)
    })
  })

  describe('getShape', () => {
    it('returns shape by id', () => {
      const rect = makeRect({ id: 'r1' })
      store.getState().addShape(rect)
      expect(store.getState().getShape('r1')).toEqual(rect)
    })

    it('returns undefined for missing shape', () => {
      expect(store.getState().getShape('nope')).toBeUndefined()
    })
  })

  describe('clearShapes', () => {
    it('removes all shapes', () => {
      store.getState().addShape(makeRect({ id: 'r1' }))
      store.getState().addShape(makeEllipse({ id: 'e1' }))
      store.getState().clearShapes()

      const state = getState(store)
      expect(state.shapes.size).toBe(0)
      expect(state.shapeIds).toEqual([])
      expect(state.selectedIds.size).toBe(0)
    })

    it('does not record history when no shapes exist', () => {
      const before = getState(store).history.length
      store.getState().clearShapes()
      expect(getState(store).history.length).toBe(before)
    })
  })
})
