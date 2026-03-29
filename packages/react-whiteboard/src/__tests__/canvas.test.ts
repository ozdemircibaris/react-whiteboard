import { describe, it, expect } from 'vitest'
import {
  screenToCanvas,
  canvasToScreen,
  getVisibleBounds,
  isPointInBounds,
  boundsIntersect,
  getBoundsCenter,
  expandBounds,
  distance,
  clamp,
  lerp,
  lerpPoint,
  easeOutCubic,
  snapToAngle,
} from '../utils/canvas'
import type { Viewport } from '../types'

describe('canvas utilities', () => {
  const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 }
  const canvasRect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect

  describe('screenToCanvas / canvasToScreen round-trip', () => {
    it('round-trips at identity viewport', () => {
      const screen = { x: 100, y: 200 }
      const canvas = screenToCanvas(screen, defaultViewport, canvasRect)
      const back = canvasToScreen(canvas, defaultViewport, canvasRect)
      expect(back.x).toBeCloseTo(screen.x, 10)
      expect(back.y).toBeCloseTo(screen.y, 10)
    })

    it('round-trips with pan and zoom', () => {
      const vp: Viewport = { x: 50, y: -30, zoom: 2 }
      const screen = { x: 300, y: 400 }
      const canvas = screenToCanvas(screen, vp, canvasRect)
      const back = canvasToScreen(canvas, vp, canvasRect)
      expect(back.x).toBeCloseTo(screen.x, 10)
      expect(back.y).toBeCloseTo(screen.y, 10)
    })

    it('round-trips with non-zero canvas offset', () => {
      const rect = { left: 100, top: 50, width: 800, height: 600 } as DOMRect
      const vp: Viewport = { x: 20, y: 10, zoom: 1.5 }
      const screen = { x: 250, y: 300 }
      const canvas = screenToCanvas(screen, vp, rect)
      const back = canvasToScreen(canvas, vp, rect)
      expect(back.x).toBeCloseTo(screen.x, 10)
      expect(back.y).toBeCloseTo(screen.y, 10)
    })
  })

  describe('screenToCanvas', () => {
    it('converts screen coordinates accounting for pan and zoom', () => {
      const vp: Viewport = { x: 100, y: 50, zoom: 2 }
      const result = screenToCanvas({ x: 200, y: 150 }, vp, canvasRect)
      // (200 - 0 - 100) / 2 = 50
      expect(result.x).toBe(50)
      // (150 - 0 - 50) / 2 = 50
      expect(result.y).toBe(50)
    })
  })

  describe('canvasToScreen', () => {
    it('converts canvas coordinates to screen', () => {
      const vp: Viewport = { x: 100, y: 50, zoom: 2 }
      const result = canvasToScreen({ x: 50, y: 50 }, vp, canvasRect)
      // 50 * 2 + 100 + 0 = 200
      expect(result.x).toBe(200)
      // 50 * 2 + 50 + 0 = 150
      expect(result.y).toBe(150)
    })
  })

  describe('getVisibleBounds', () => {
    it('returns correct bounds at identity viewport', () => {
      const bounds = getVisibleBounds(defaultViewport, 800, 600)
      expect(bounds.x).toBeCloseTo(0)
      expect(bounds.y).toBeCloseTo(0)
      expect(bounds.width).toBeCloseTo(800)
      expect(bounds.height).toBeCloseTo(600)
    })

    it('accounts for pan and zoom', () => {
      const vp: Viewport = { x: 100, y: -50, zoom: 2 }
      const bounds = getVisibleBounds(vp, 800, 600)
      expect(bounds.x).toBe(-50)
      expect(bounds.y).toBe(25)
      expect(bounds.width).toBe(400)
      expect(bounds.height).toBe(300)
    })
  })

  describe('isPointInBounds', () => {
    it('returns true for point inside', () => {
      expect(isPointInBounds({ x: 5, y: 5 }, { x: 0, y: 0, width: 10, height: 10 })).toBe(true)
    })

    it('returns false for point outside', () => {
      expect(isPointInBounds({ x: 15, y: 5 }, { x: 0, y: 0, width: 10, height: 10 })).toBe(false)
    })
  })

  describe('boundsIntersect', () => {
    it('returns true for overlapping bounds', () => {
      expect(
        boundsIntersect(
          { x: 0, y: 0, width: 10, height: 10 },
          { x: 5, y: 5, width: 10, height: 10 },
        ),
      ).toBe(true)
    })

    it('returns false for non-overlapping', () => {
      expect(
        boundsIntersect(
          { x: 0, y: 0, width: 10, height: 10 },
          { x: 20, y: 20, width: 10, height: 10 },
        ),
      ).toBe(false)
    })
  })

  describe('getBoundsCenter', () => {
    it('returns center point', () => {
      expect(getBoundsCenter({ x: 10, y: 20, width: 100, height: 200 })).toEqual({
        x: 60,
        y: 120,
      })
    })
  })

  describe('expandBounds', () => {
    it('expands bounds by amount', () => {
      expect(expandBounds({ x: 10, y: 10, width: 100, height: 100 }, 5)).toEqual({
        x: 5,
        y: 5,
        width: 110,
        height: 110,
      })
    })
  })

  describe('distance', () => {
    it('calculates distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    })
  })

  describe('clamp', () => {
    it('clamps value to range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-1, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('lerp / lerpPoint', () => {
    it('interpolates between values', () => {
      expect(lerp(0, 100, 0.5)).toBe(50)
      expect(lerp(0, 100, 0)).toBe(0)
      expect(lerp(0, 100, 1)).toBe(100)
    })

    it('interpolates between points', () => {
      expect(lerpPoint({ x: 0, y: 0 }, { x: 100, y: 200 }, 0.5)).toEqual({ x: 50, y: 100 })
    })
  })

  describe('easeOutCubic', () => {
    it('returns 0 at t=0', () => {
      expect(easeOutCubic(0)).toBe(0)
    })

    it('returns 1 at t=1', () => {
      expect(easeOutCubic(1)).toBe(1)
    })

    it('returns value between 0 and 1 for t=0.5', () => {
      const v = easeOutCubic(0.5)
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThan(1)
      expect(v).toBeGreaterThan(0.5) // easeOut is faster than linear at midpoint
    })
  })

  describe('snapToAngle', () => {
    it('snaps to nearest 45 degree increment', () => {
      const result = snapToAngle({ x: 0, y: 0 }, { x: 100, y: 5 }, 45)
      // Should snap to 0 degrees — y should be ~0
      expect(result.y).toBeCloseTo(0, 0)
    })
  })
})
