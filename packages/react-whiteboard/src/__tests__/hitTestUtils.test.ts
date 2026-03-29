import { describe, it, expect } from 'vitest'
import {
  getShapeBounds,
  getShapeAtPoint,
  getShapesAtPoint,
  getShapesInBounds,
  getSelectionBounds,
} from '../utils/hitTest'
import { makeRect, makeEllipse, makePath } from './storeFactory'
import type { Shape, PathShape } from '../types'

describe('hitTest utility functions', () => {
  describe('getShapeBounds', () => {
    it('returns bounds for rectangle', () => {
      const rect = makeRect({ id: 'r', x: 10, y: 20, width: 100, height: 50 })
      const bounds = getShapeBounds(rect)
      // strokeWidth = 2, so halfStroke = 1
      expect(bounds.x).toBe(9)
      expect(bounds.y).toBe(19)
      expect(bounds.width).toBe(102)
      expect(bounds.height).toBe(52)
    })

    it('returns bounds for path shape', () => {
      const path = makePath({
        id: 'p',
        x: 0,
        y: 0,
        props: {
          stroke: '#000',
          strokeWidth: 4,
          strokeStyle: 'solid',
          points: [
            { x: 10, y: 20 },
            { x: 50, y: 80 },
            { x: 90, y: 30 },
          ],
          isComplete: true,
        },
      })
      const bounds = getShapeBounds(path)
      // halfStroke = 2
      expect(bounds.x).toBe(8)   // 10 - 2
      expect(bounds.y).toBe(18)  // 20 - 2
      expect(bounds.width).toBe(84)  // (90-10) + 4
      expect(bounds.height).toBe(64) // (80-20) + 4
    })

    it('returns zero-size bounds for empty path', () => {
      const path = makePath({
        id: 'p',
        x: 5,
        y: 10,
        props: {
          stroke: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          points: [],
          isComplete: true,
        },
      })
      const bounds = getShapeBounds(path)
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })
  })

  describe('getShapeAtPoint', () => {
    it('returns topmost shape at point', () => {
      const r1 = makeRect({ id: 'r1', x: 0, y: 0, width: 100, height: 100 })
      const r2 = makeRect({ id: 'r2', x: 50, y: 50, width: 100, height: 100 })
      const shapes = new Map<string, Shape>([['r1', r1], ['r2', r2]])
      const shapeIds = ['r1', 'r2']

      // Point at (75,75) is inside both shapes; r2 is on top (later in shapeIds)
      const hit = getShapeAtPoint({ x: 75, y: 75 }, shapes, shapeIds)
      expect(hit?.id).toBe('r2')
    })

    it('returns null when no shape at point', () => {
      const r1 = makeRect({ id: 'r1', x: 0, y: 0, width: 100, height: 100 })
      const shapes = new Map<string, Shape>([['r1', r1]])
      const hit = getShapeAtPoint({ x: 500, y: 500 }, shapes, ['r1'])
      expect(hit).toBeNull()
    })

    it('uses tolerance', () => {
      const r1 = makeRect({ id: 'r1', x: 0, y: 0, width: 100, height: 100 })
      const shapes = new Map<string, Shape>([['r1', r1]])
      const hit = getShapeAtPoint({ x: 105, y: 50 }, shapes, ['r1'], 10)
      expect(hit?.id).toBe('r1')
    })
  })

  describe('getShapesAtPoint', () => {
    it('returns all shapes at point', () => {
      const r1 = makeRect({ id: 'r1', x: 0, y: 0, width: 100, height: 100 })
      const r2 = makeRect({ id: 'r2', x: 50, y: 50, width: 100, height: 100 })
      const shapes = new Map<string, Shape>([['r1', r1], ['r2', r2]])
      const shapeIds = ['r1', 'r2']

      const hits = getShapesAtPoint({ x: 75, y: 75 }, shapes, shapeIds)
      expect(hits).toHaveLength(2)
    })
  })

  describe('getShapesInBounds', () => {
    it('finds shapes fully contained in bounds', () => {
      const r1 = makeRect({ id: 'r1', x: 10, y: 10, width: 30, height: 30 })
      const r2 = makeRect({ id: 'r2', x: 200, y: 200, width: 30, height: 30 })
      const shapes = new Map<string, Shape>([['r1', r1], ['r2', r2]])
      const shapeIds = ['r1', 'r2']

      const result = getShapesInBounds(
        { x: 0, y: 0, width: 100, height: 100 },
        shapes,
        shapeIds,
        true,
      )
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('r1')
    })

    it('finds shapes intersecting bounds when fullyContained=false', () => {
      const r1 = makeRect({ id: 'r1', x: 80, y: 80, width: 50, height: 50 })
      const shapes = new Map<string, Shape>([['r1', r1]])
      const shapeIds = ['r1']

      const result = getShapesInBounds(
        { x: 0, y: 0, width: 100, height: 100 },
        shapes,
        shapeIds,
        false,
      )
      expect(result).toHaveLength(1)
    })

    it('excludes locked shapes', () => {
      const r1 = makeRect({ id: 'r1', x: 10, y: 10, width: 30, height: 30, isLocked: true })
      const shapes = new Map<string, Shape>([['r1', r1]])

      const result = getShapesInBounds(
        { x: 0, y: 0, width: 100, height: 100 },
        shapes,
        ['r1'],
        true,
      )
      expect(result).toHaveLength(0)
    })
  })

  describe('getSelectionBounds', () => {
    it('returns combined bounds of shapes', () => {
      const r1 = makeRect({ id: 'r1', x: 10, y: 10, width: 50, height: 50 })
      const r2 = makeRect({ id: 'r2', x: 100, y: 100, width: 50, height: 50 })
      const bounds = getSelectionBounds([r1, r2])

      expect(bounds).not.toBeNull()
      // r1 strokeWidth=2, halfStroke=1
      expect(bounds!.x).toBe(9)   // min(10-1, 100-1)
      expect(bounds!.y).toBe(9)
      // max(10+50+2, 100+50+2) - 9 = 152 - 9 = 143
    })

    it('returns null for empty array', () => {
      expect(getSelectionBounds([])).toBeNull()
    })
  })
})
