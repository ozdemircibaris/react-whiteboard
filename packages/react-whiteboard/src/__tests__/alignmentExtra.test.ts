import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore, getState, makeRect, resetShapeCounter } from './storeFactory'

describe('alignmentActions (distribute)', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  function setupThreeHorizontal() {
    store.getState().addShape(makeRect({ id: 'a', x: 0, y: 0, width: 20, height: 20 }))
    store.getState().addShape(makeRect({ id: 'b', x: 50, y: 0, width: 20, height: 20 }))
    store.getState().addShape(makeRect({ id: 'c', x: 200, y: 0, width: 20, height: 20 }))
    store.getState().selectMultiple(['a', 'b', 'c'])
  }

  describe('distributeHorizontally', () => {
    it('evenly distributes shapes horizontally', () => {
      setupThreeHorizontal()
      store.getState().distributeHorizontally()

      const state = getState(store)
      // First stays at 0, last stays at 200
      expect(state.shapes.get('a')!.x).toBe(0)
      expect(state.shapes.get('c')!.x).toBe(200)
      // Middle should be evenly spaced
      const bX = state.shapes.get('b')!.x
      // Total space = (200 + 20) - 0 - (20+20+20) = 160
      // Gap = 160 / 2 = 80
      // b.x = 0 + 20 + 80 = 100
      expect(bX).toBe(100)
    })

    it('does nothing with fewer than 3 shapes', () => {
      store.getState().addShape(makeRect({ id: 'a', x: 0 }))
      store.getState().addShape(makeRect({ id: 'b', x: 100 }))
      store.getState().selectMultiple(['a', 'b'])
      store.getState().distributeHorizontally()

      expect(getState(store).shapes.get('a')!.x).toBe(0)
      expect(getState(store).shapes.get('b')!.x).toBe(100)
    })
  })

  describe('distributeVertically', () => {
    it('evenly distributes shapes vertically', () => {
      store.getState().addShape(makeRect({ id: 'a', x: 0, y: 0, width: 20, height: 20 }))
      store.getState().addShape(makeRect({ id: 'b', x: 0, y: 50, width: 20, height: 20 }))
      store.getState().addShape(makeRect({ id: 'c', x: 0, y: 200, width: 20, height: 20 }))
      store.getState().selectMultiple(['a', 'b', 'c'])

      store.getState().distributeVertically()

      const state = getState(store)
      expect(state.shapes.get('a')!.y).toBe(0)
      expect(state.shapes.get('c')!.y).toBe(200)
      const bY = state.shapes.get('b')!.y
      expect(bY).toBe(100)
    })

    it('does nothing with fewer than 3 shapes', () => {
      store.getState().addShape(makeRect({ id: 'a', y: 0 }))
      store.getState().addShape(makeRect({ id: 'b', y: 100 }))
      store.getState().selectMultiple(['a', 'b'])
      store.getState().distributeVertically()

      expect(getState(store).shapes.get('a')!.y).toBe(0)
      expect(getState(store).shapes.get('b')!.y).toBe(100)
    })
  })

  describe('alignment with bound text', () => {
    it('alignment repositions bound text along with parent', () => {
      const rect = makeRect({
        id: 'r1',
        x: 100,
        y: 50,
        width: 80,
        height: 40,
        props: {
          fill: '',
          fillStyle: 'solid',
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          cornerRadius: 0,
          boundTextId: 'bt1',
        },
      })
      const bt = {
        id: 'bt1',
        type: 'text' as const,
        x: 108,
        y: 58,
        width: 64,
        height: 24,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        parentId: 'r1',
        seed: 42,
        roughness: 0,
        props: {
          text: 'hi',
          fontSize: 16,
          fontFamily: 'sans' as const,
          fontWeight: 400,
          fontStyle: 'normal' as const,
          color: '#000',
          backgroundColor: 'transparent',
          align: 'left' as const,
          lineHeight: 1.5,
        },
      }

      store.getState().addShape(rect)
      store.getState().addShape(bt, false)
      store.getState().addShape(makeRect({ id: 'r2', x: 0, y: 50, width: 80, height: 40 }))
      store.getState().selectMultiple(['r1', 'r2'])
      store.getState().alignLeft()

      const state = getState(store)
      // Both shapes aligned to x=0
      expect(state.shapes.get('r1')!.x).toBe(0)
      expect(state.shapes.get('r2')!.x).toBe(0)
      // Bound text should be repositioned too
      expect(state.shapes.get('bt1')!.x).toBe(8) // BOUND_TEXT_PADDING = 8
    })
  })
})
