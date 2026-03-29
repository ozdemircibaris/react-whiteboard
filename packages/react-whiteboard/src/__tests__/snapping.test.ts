import { describe, it, expect } from 'vitest'
import { snapToGrid, snapToShapes } from '../utils/snapping'
import { makeRect } from './storeFactory'
import type { Shape } from '../types'

describe('snapping', () => {
  describe('snapToGrid', () => {
    it('snaps to nearest grid intersection', () => {
      expect(snapToGrid({ x: 12, y: 18 }, 10)).toEqual({ x: 10, y: 20 })
    })

    it('snaps exactly on grid points', () => {
      expect(snapToGrid({ x: 20, y: 30 }, 10)).toEqual({ x: 20, y: 30 })
    })

    it('handles large grid size', () => {
      expect(snapToGrid({ x: 45, y: 70 }, 50)).toEqual({ x: 50, y: 50 })
    })

    it('handles negative coordinates', () => {
      expect(snapToGrid({ x: -12, y: -18 }, 10)).toEqual({ x: -10, y: -20 })
    })

    it('snaps to grid of size 1 (identity)', () => {
      expect(snapToGrid({ x: 3.7, y: 8.2 }, 1)).toEqual({ x: 4, y: 8 })
    })
  })

  describe('snapToShapes', () => {
    it('snaps moving bounds to nearby shape edges', () => {
      const target = makeRect({ id: 't', x: 100, y: 100, width: 50, height: 50 })
      const shapes = new Map<string, Shape>([['t', target]])
      const shapeIds = ['t']

      // Moving bounds near the left edge of target
      const result = snapToShapes(
        { x: 97, y: 97, width: 50, height: 50 },
        shapes,
        shapeIds,
        new Set<string>(),
        5,
      )

      // Should snap to x=100, y=100
      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
    })

    it('does not snap when too far away', () => {
      const target = makeRect({ id: 't', x: 100, y: 100, width: 50, height: 50 })
      const shapes = new Map<string, Shape>([['t', target]])
      const shapeIds = ['t']

      const result = snapToShapes(
        { x: 0, y: 0, width: 50, height: 50 },
        shapes,
        shapeIds,
        new Set<string>(),
        5,
      )

      // No snap — stays at original position
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
      expect(result.snapLines).toHaveLength(0)
    })

    it('excludes shapes in excludeIds', () => {
      const target = makeRect({ id: 't', x: 100, y: 100, width: 50, height: 50 })
      const shapes = new Map<string, Shape>([['t', target]])
      const shapeIds = ['t']

      const result = snapToShapes(
        { x: 98, y: 98, width: 50, height: 50 },
        shapes,
        shapeIds,
        new Set(['t']),
        5,
      )

      // Target excluded, so no snap
      expect(result.x).toBe(98)
      expect(result.y).toBe(98)
    })

    it('produces snap lines when snapping occurs', () => {
      const target = makeRect({ id: 't', x: 100, y: 100, width: 50, height: 50 })
      const shapes = new Map<string, Shape>([['t', target]])
      const shapeIds = ['t']

      const result = snapToShapes(
        { x: 97, y: 97, width: 50, height: 50 },
        shapes,
        shapeIds,
        new Set<string>(),
        5,
      )

      expect(result.snapLines.length).toBeGreaterThan(0)
    })
  })
})
