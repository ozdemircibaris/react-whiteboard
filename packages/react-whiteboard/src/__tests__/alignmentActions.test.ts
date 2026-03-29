import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore, getState, makeRect, resetShapeCounter } from './storeFactory'

describe('alignmentActions', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  function setupThreeShapes() {
    store.getState().addShape(makeRect({ id: 'a', x: 10, y: 10, width: 50, height: 50 }))
    store.getState().addShape(makeRect({ id: 'b', x: 100, y: 60, width: 80, height: 40 }))
    store.getState().addShape(makeRect({ id: 'c', x: 200, y: 30, width: 60, height: 70 }))
    store.getState().selectMultiple(['a', 'b', 'c'])
  }

  describe('alignLeft', () => {
    it('aligns all shapes to leftmost x', () => {
      setupThreeShapes()
      store.getState().alignLeft()

      const state = getState(store)
      expect(state.shapes.get('a')!.x).toBe(10)
      expect(state.shapes.get('b')!.x).toBe(10)
      expect(state.shapes.get('c')!.x).toBe(10)
    })

    it('does nothing with fewer than 2 shapes', () => {
      store.getState().addShape(makeRect({ id: 'a', x: 50 }))
      store.getState().select('a')
      store.getState().alignLeft()
      expect(getState(store).shapes.get('a')!.x).toBe(50)
    })
  })

  describe('alignRight', () => {
    it('aligns all shapes to rightmost edge', () => {
      setupThreeShapes()
      store.getState().alignRight()

      const state = getState(store)
      // maxRight = max(10+50, 100+80, 200+60) = 260
      expect(state.shapes.get('a')!.x).toBe(260 - 50) // 210
      expect(state.shapes.get('b')!.x).toBe(260 - 80) // 180
      expect(state.shapes.get('c')!.x).toBe(260 - 60) // 200
    })
  })

  describe('alignTop', () => {
    it('aligns all shapes to topmost y', () => {
      setupThreeShapes()
      store.getState().alignTop()

      const state = getState(store)
      expect(state.shapes.get('a')!.y).toBe(10)
      expect(state.shapes.get('b')!.y).toBe(10)
      expect(state.shapes.get('c')!.y).toBe(10)
    })
  })

  describe('alignBottom', () => {
    it('aligns all shapes to bottommost edge', () => {
      setupThreeShapes()
      store.getState().alignBottom()

      const state = getState(store)
      // maxBottom = max(10+50, 60+40, 30+70) = 100
      expect(state.shapes.get('a')!.y).toBe(100 - 50) // 50
      expect(state.shapes.get('b')!.y).toBe(100 - 40) // 60
      expect(state.shapes.get('c')!.y).toBe(100 - 70) // 30
    })
  })

  describe('alignCenterH', () => {
    it('aligns all shapes to horizontal center', () => {
      setupThreeShapes()
      store.getState().alignCenterH()

      const state = getState(store)
      // minX=10, maxRight=260, centerX=135
      expect(state.shapes.get('a')!.x).toBe(135 - 25) // 110
      expect(state.shapes.get('b')!.x).toBe(135 - 40) // 95
      expect(state.shapes.get('c')!.x).toBe(135 - 30) // 105
    })
  })

  describe('alignCenterV', () => {
    it('aligns all shapes to vertical center', () => {
      setupThreeShapes()
      store.getState().alignCenterV()

      const state = getState(store)
      // minY=10, maxBottom=100, centerY=55
      expect(state.shapes.get('a')!.y).toBe(55 - 25) // 30
      expect(state.shapes.get('b')!.y).toBe(55 - 20) // 35
      expect(state.shapes.get('c')!.y).toBe(55 - 35) // 20
    })
  })
})
