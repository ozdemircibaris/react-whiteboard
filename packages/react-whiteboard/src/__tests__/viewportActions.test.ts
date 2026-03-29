import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore, getState, resetShapeCounter } from './storeFactory'

describe('viewportActions', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    resetShapeCounter()
    store = createTestStore()
  })

  describe('setViewport', () => {
    it('updates viewport partially', () => {
      store.getState().setViewport({ x: 100 })
      expect(getState(store).viewport).toEqual({ x: 100, y: 0, zoom: 1 })
    })

    it('clamps zoom to valid range', () => {
      store.getState().setViewport({ zoom: 0.01 })
      expect(getState(store).viewport.zoom).toBeGreaterThanOrEqual(0.1)

      store.getState().setViewport({ zoom: 20 })
      expect(getState(store).viewport.zoom).toBeLessThanOrEqual(10)
    })
  })

  describe('pan', () => {
    it('pans by delta', () => {
      store.getState().pan(50, -30)
      expect(getState(store).viewport).toEqual({ x: 50, y: -30, zoom: 1 })
    })

    it('accumulates pans', () => {
      store.getState().pan(10, 20)
      store.getState().pan(5, 5)
      expect(getState(store).viewport).toEqual({ x: 15, y: 25, zoom: 1 })
    })
  })

  describe('zoom', () => {
    it('increases zoom', () => {
      store.getState().zoom(0.5)
      expect(getState(store).viewport.zoom).toBe(1.5)
    })

    it('clamps zoom to MIN_ZOOM', () => {
      store.getState().zoom(-2)
      expect(getState(store).viewport.zoom).toBeGreaterThanOrEqual(0.1)
    })

    it('clamps zoom to MAX_ZOOM', () => {
      store.getState().zoom(20)
      expect(getState(store).viewport.zoom).toBeLessThanOrEqual(10)
    })

    it('adjusts viewport around center point', () => {
      store.getState().zoom(1, { x: 100, y: 100 })
      const vp = getState(store).viewport
      // Zoom from 1 -> 2, center at (100,100)
      // newX = 0 + 100 * (1 - 2) = -100
      expect(vp.zoom).toBe(2)
      expect(vp.x).toBe(-100)
      expect(vp.y).toBe(-100)
    })
  })

  describe('zoomTo', () => {
    it('sets zoom to exact value', () => {
      store.getState().zoomTo(3)
      expect(getState(store).viewport.zoom).toBe(3)
    })

    it('clamps zoom to valid range', () => {
      store.getState().zoomTo(0.01)
      expect(getState(store).viewport.zoom).toBe(0.1)

      store.getState().zoomTo(50)
      expect(getState(store).viewport.zoom).toBe(10)
    })

    it('adjusts viewport around center point', () => {
      store.getState().zoomTo(2, { x: 200, y: 200 })
      const vp = getState(store).viewport
      expect(vp.zoom).toBe(2)
      expect(vp.x).toBe(-200)
      expect(vp.y).toBe(-200)
    })
  })

  describe('resetViewport', () => {
    it('resets to default viewport', () => {
      store.getState().setViewport({ x: 100, y: 200, zoom: 3 })
      store.getState().resetViewport()
      expect(getState(store).viewport).toEqual({ x: 0, y: 0, zoom: 1 })
    })
  })
})
