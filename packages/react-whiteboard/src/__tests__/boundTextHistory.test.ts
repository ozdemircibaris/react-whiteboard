import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestStore, getState, makeRect, makeText, resetShapeCounter } from './storeFactory'
import { sortParentFirst } from '../core/store/historyActions'
import type { Shape, RectangleShape } from '../types'

describe('bound text history – orphan guard & atomic delete', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  // -------------------------------------------------------------------------
  // Helper: set up a rectangle with a bound text child
  // -------------------------------------------------------------------------
  function addRectWithBoundText(rectId: string, textId: string) {
    const rect = makeRect({
      id: rectId,
      props: {
        fill: 'transparent',
        fillStyle: 'solid',
        stroke: '#000',
        strokeWidth: 2,
        strokeStyle: 'solid',
        cornerRadius: 0,
        boundTextId: textId,
      },
    })
    const text = makeText({ id: textId, parentId: rectId })

    // Add both shapes directly (parent first, text without shapeIds entry)
    store.getState().addShape(rect)
    // Add text to shapes map but not to shapeIds (simulates bound text)
    store.setState((s) => {
      const newShapes = new Map(s.shapes)
      newShapes.set(textId, text)
      return { shapes: newShapes }
    })

    return { rect, text }
  }

  // -------------------------------------------------------------------------
  // Atomic delete: parent + bound text recorded as single history entry
  // -------------------------------------------------------------------------
  describe('atomic delete', () => {
    it('deleteShape records parent and bound text in a single history entry', () => {
      const { rect, text } = addRectWithBoundText('r1', 'bt1')
      const historyBefore = getState(store).history.length

      store.getState().deleteShape('r1')

      const state = getState(store)
      expect(state.shapes.has('r1')).toBe(false)
      expect(state.shapes.has('bt1')).toBe(false)

      // Only one new history entry for the delete
      const newEntries = state.history.length - historyBefore
      expect(newEntries).toBe(1)

      const lastEntry = state.history[state.history.length - 1]
      expect(lastEntry.action.type).toBe('delete')
      if (lastEntry.action.type === 'delete') {
        const deletedIds = lastEntry.action.shapes.map((s) => s.id).sort()
        expect(deletedIds).toEqual(['bt1', 'r1'])
      }
    })

    it('deleteShapes records parent and bound text atomically', () => {
      const { rect, text } = addRectWithBoundText('r1', 'bt1')
      const historyBefore = getState(store).history.length

      store.getState().deleteShapes(['r1'])

      const state = getState(store)
      expect(state.shapes.has('r1')).toBe(false)
      expect(state.shapes.has('bt1')).toBe(false)

      const newEntries = state.history.length - historyBefore
      expect(newEntries).toBe(1)

      const lastEntry = state.history[state.history.length - 1]
      if (lastEntry.action.type === 'delete') {
        const deletedIds = lastEntry.action.shapes.map((s) => s.id).sort()
        expect(deletedIds).toEqual(['bt1', 'r1'])
      }
    })
  })

  // -------------------------------------------------------------------------
  // Undo restores parent + bound text together
  // -------------------------------------------------------------------------
  describe('undo atomic delete restores both shapes', () => {
    it('undo restores parent and bound text after deleteShape', () => {
      addRectWithBoundText('r1', 'bt1')
      store.getState().deleteShape('r1')

      store.getState().undo()

      const state = getState(store)
      expect(state.shapes.has('r1')).toBe(true)
      expect(state.shapes.has('bt1')).toBe(true)
      expect(state.shapeIds).toContain('r1')
      // Bound text should NOT be in shapeIds (has parentId)
      expect(state.shapeIds).not.toContain('bt1')
    })
  })

  // -------------------------------------------------------------------------
  // sortParentFirst – unit tests
  // -------------------------------------------------------------------------
  describe('sortParentFirst', () => {
    it('sorts parent shapes before bound text children', () => {
      const text = makeText({ id: 'bt1', parentId: 'r1' })
      const rect = makeRect({ id: 'r1' })
      // Pass child first, parent second
      const sorted = sortParentFirst([text, rect], new Map())
      expect(sorted[0].id).toBe('r1')
      expect(sorted[1].id).toBe('bt1')
    })

    it('skips orphaned bound text when parent is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const orphan = makeText({ id: 'bt-orphan', parentId: 'missing-parent' })
      const rect = makeRect({ id: 'r1' })
      const sorted = sortParentFirst([orphan, rect], new Map())

      expect(sorted).toHaveLength(1)
      expect(sorted[0].id).toBe('r1')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping orphaned bound text shape "bt-orphan"'),
      )

      warnSpy.mockRestore()
    })

    it('keeps bound text when parent exists in the store', () => {
      const rect = makeRect({ id: 'r1' })
      const existingShapes = new Map<string, Shape>([['r1', rect]])

      const text = makeText({ id: 'bt1', parentId: 'r1' })
      const sorted = sortParentFirst([text], existingShapes)

      expect(sorted).toHaveLength(1)
      expect(sorted[0].id).toBe('bt1')
    })

    it('keeps bound text when parent is in the same batch', () => {
      const rect = makeRect({ id: 'r1' })
      const text = makeText({ id: 'bt1', parentId: 'r1' })
      const sorted = sortParentFirst([text, rect], new Map())

      expect(sorted).toHaveLength(2)
      // Parent first
      expect(sorted[0].id).toBe('r1')
      expect(sorted[1].id).toBe('bt1')
    })

    it('handles shapes with no parentId as non-children', () => {
      const r1 = makeRect({ id: 'r1' })
      const r2 = makeRect({ id: 'r2' })
      const sorted = sortParentFirst([r1, r2], new Map())
      expect(sorted).toHaveLength(2)
    })
  })

  // -------------------------------------------------------------------------
  // Integration: redo delete re-removes both shapes
  // -------------------------------------------------------------------------
  describe('redo after undo of atomic delete', () => {
    it('redo removes parent and bound text again', () => {
      addRectWithBoundText('r1', 'bt1')
      store.getState().deleteShape('r1')
      store.getState().undo()
      store.getState().redo()

      const state = getState(store)
      expect(state.shapes.has('r1')).toBe(false)
      expect(state.shapes.has('bt1')).toBe(false)
    })
  })
})
