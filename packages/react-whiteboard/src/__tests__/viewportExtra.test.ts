import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestStore, getState, resetShapeCounter } from './storeFactory'

describe('viewportActions (extended)', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  describe('animateZoom', () => {
    it('starts an animation that eventually reaches target zoom', async () => {
      // Mock requestAnimationFrame to execute synchronously
      const originalRAF = globalThis.requestAnimationFrame
      const originalCAF = globalThis.cancelAnimationFrame
      let lastCallback: FrameRequestCallback | null = null

      globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
        lastCallback = cb
        return 1
      }
      globalThis.cancelAnimationFrame = vi.fn()

      try {
        store.getState().animateZoom(2, undefined, 100)

        // Simulate the animation completing
        if (lastCallback) {
          lastCallback(performance.now() + 200) // way past duration
        }

        expect(getState(store).viewport.zoom).toBeCloseTo(2, 1)
      } finally {
        globalThis.requestAnimationFrame = originalRAF
        globalThis.cancelAnimationFrame = originalCAF
      }
    })

    it('animateZoom with center', async () => {
      const originalRAF = globalThis.requestAnimationFrame
      const originalCAF = globalThis.cancelAnimationFrame
      let lastCallback: FrameRequestCallback | null = null

      globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
        lastCallback = cb
        return 1
      }
      globalThis.cancelAnimationFrame = vi.fn()

      try {
        store.getState().animateZoom(2, { x: 100, y: 100 }, 100)

        if (lastCallback) {
          lastCallback(performance.now() + 200)
        }

        const vp = getState(store).viewport
        expect(vp.zoom).toBeCloseTo(2, 1)
        // With center (100,100), zoom from 1->2: x = 0 + 100*(1-2) = -100
        expect(vp.x).toBeCloseTo(-100, 0)
      } finally {
        globalThis.requestAnimationFrame = originalRAF
        globalThis.cancelAnimationFrame = originalCAF
      }
    })

    it('pan cancels active zoom animation', () => {
      const cancelMock = vi.fn()
      const originalRAF = globalThis.requestAnimationFrame
      const originalCAF = globalThis.cancelAnimationFrame

      globalThis.requestAnimationFrame = () => 42
      globalThis.cancelAnimationFrame = cancelMock

      try {
        store.getState().animateZoom(3, undefined, 1000)
        store.getState().pan(10, 10)
        expect(cancelMock).toHaveBeenCalledWith(42)
      } finally {
        globalThis.requestAnimationFrame = originalRAF
        globalThis.cancelAnimationFrame = originalCAF
      }
    })
  })

  describe('zoom without center', () => {
    it('zooms without adjusting pan', () => {
      store.getState().setViewport({ x: 50, y: 50 })
      store.getState().zoom(0.5)
      const vp = getState(store).viewport
      expect(vp.zoom).toBe(1.5)
      expect(vp.x).toBe(50)
      expect(vp.y).toBe(50)
    })
  })

  describe('zoomTo without center', () => {
    it('sets zoom without adjusting pan', () => {
      store.getState().setViewport({ x: 50, y: 50 })
      store.getState().zoomTo(3)
      const vp = getState(store).viewport
      expect(vp.zoom).toBe(3)
      expect(vp.x).toBe(50)
      expect(vp.y).toBe(50)
    })
  })
})
