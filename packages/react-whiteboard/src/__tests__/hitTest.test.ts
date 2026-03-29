import { describe, it, expect } from 'vitest'
import {
  hitTestRectangle,
  hitTestEllipse,
  hitTestPath,
  hitTestLine,
  hitTestArrow,
  hitTestShape,
} from '../utils/shapeHitTest'
import { makeRect, makeEllipse, makePath, makeLine, makeArrow } from './storeFactory'
import type { PathShape, LineShape, ArrowShape } from '../types'

describe('hitTest', () => {
  describe('hitTestRectangle', () => {
    it('returns true for point inside rectangle', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestRectangle({ x: 50, y: 50 }, rect)).toBe(true)
    })

    it('returns false for point outside rectangle', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestRectangle({ x: 200, y: 200 }, rect)).toBe(false)
    })

    it('returns true on boundary', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestRectangle({ x: 0, y: 0 }, rect)).toBe(true)
      expect(hitTestRectangle({ x: 100, y: 100 }, rect)).toBe(true)
    })

    it('accounts for tolerance', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestRectangle({ x: 105, y: 50 }, rect, 10)).toBe(true)
      expect(hitTestRectangle({ x: 105, y: 50 }, rect, 0)).toBe(false)
    })
  })

  describe('hitTestEllipse', () => {
    it('returns true for point inside ellipse', () => {
      const ellipse = makeEllipse({ id: 'e', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestEllipse({ x: 50, y: 50 }, ellipse)).toBe(true)
    })

    it('returns false for point outside ellipse', () => {
      const ellipse = makeEllipse({ id: 'e', x: 0, y: 0, width: 100, height: 100 })
      // Corner of bounding box is outside ellipse
      expect(hitTestEllipse({ x: 5, y: 5 }, ellipse)).toBe(false)
    })

    it('handles zero-size ellipse', () => {
      const ellipse = makeEllipse({ id: 'e', x: 50, y: 50, width: 0, height: 0 })
      expect(hitTestEllipse({ x: 50, y: 50 }, ellipse)).toBe(false)
    })
  })

  describe('hitTestPath', () => {
    it('returns true for point near path segment', () => {
      const path = makePath({
        id: 'p',
        x: 0,
        y: 0,
        props: {
          stroke: '#000',
          strokeWidth: 4,
          strokeStyle: 'solid',
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
          isComplete: true,
        },
      })
      expect(hitTestPath({ x: 50, y: 0 }, path as PathShape, 5)).toBe(true)
    })

    it('returns false for point far from path', () => {
      const path = makePath({ id: 'p', x: 0, y: 0 })
      expect(hitTestPath({ x: 500, y: 500 }, path as PathShape, 5)).toBe(false)
    })

    it('handles single-point path', () => {
      const path = makePath({
        id: 'p',
        x: 0,
        y: 0,
        props: {
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          points: [{ x: 10, y: 10 }],
          isComplete: true,
        },
      })
      expect(hitTestPath({ x: 10, y: 10 }, path as PathShape, 5)).toBe(true)
      expect(hitTestPath({ x: 100, y: 100 }, path as PathShape, 5)).toBe(false)
    })

    it('handles empty path', () => {
      const path = makePath({
        id: 'p',
        x: 0,
        y: 0,
        props: {
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          points: [],
          isComplete: true,
        },
      })
      expect(hitTestPath({ x: 0, y: 0 }, path as PathShape, 5)).toBe(false)
    })
  })

  describe('hitTestLine', () => {
    it('returns true for point near line', () => {
      const line = makeLine({
        id: 'l',
        x: 0,
        y: 0,
        width: 100,
        height: 0,
        props: {
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        },
      })
      expect(hitTestLine({ x: 50, y: 0 }, line as LineShape, 5)).toBe(true)
    })

    it('returns false for point far from line', () => {
      const line = makeLine({
        id: 'l',
        x: 0,
        y: 0,
        props: {
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        },
      })
      expect(hitTestLine({ x: 50, y: 100 }, line as LineShape, 5)).toBe(false)
    })
  })

  describe('hitTestArrow', () => {
    it('returns true for point on arrow shaft', () => {
      const arrow = makeArrow({
        id: 'a',
        x: 0,
        y: 0,
        props: {
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          startArrowhead: 'none',
          endArrowhead: 'arrow',
        },
      })
      expect(hitTestArrow({ x: 50, y: 0 }, arrow as ArrowShape, 5)).toBe(true)
    })

    it('returns false for point far from arrow', () => {
      const arrow = makeArrow({ id: 'a', x: 0, y: 0 })
      expect(hitTestArrow({ x: 0, y: 500 }, arrow as ArrowShape, 5)).toBe(false)
    })
  })

  describe('hitTestShape (dispatcher)', () => {
    it('dispatches to rectangle hit test', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestShape({ x: 50, y: 50 }, rect)).toBe(true)
    })

    it('dispatches to ellipse hit test', () => {
      const ellipse = makeEllipse({ id: 'e', x: 0, y: 0, width: 100, height: 100 })
      expect(hitTestShape({ x: 50, y: 50 }, ellipse)).toBe(true)
    })

    it('returns false for locked shapes', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 100, height: 100, isLocked: true })
      expect(hitTestShape({ x: 50, y: 50 }, rect)).toBe(false)
    })
  })
})
