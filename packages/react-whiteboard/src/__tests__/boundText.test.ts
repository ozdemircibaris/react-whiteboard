import { describe, it, expect } from 'vitest'
import {
  canContainBoundText,
  getBoundTextBounds,
  centerTextVertically,
  getBoundTextShape,
  collectBoundTextIds,
  getBoundTextIdFromShape,
  BOUND_TEXT_PADDING,
} from '../utils/boundText'
import { makeRect, makeEllipse, makeLine, makeText } from './storeFactory'
import type { Shape, RectangleShape } from '../types'

describe('boundText utilities', () => {
  describe('canContainBoundText', () => {
    it('returns true for rectangle', () => {
      expect(canContainBoundText('rectangle')).toBe(true)
    })

    it('returns true for ellipse', () => {
      expect(canContainBoundText('ellipse')).toBe(true)
    })

    it('returns false for other types', () => {
      expect(canContainBoundText('line')).toBe(false)
      expect(canContainBoundText('text')).toBe(false)
      expect(canContainBoundText('path')).toBe(false)
    })
  })

  describe('getBoundTextBounds', () => {
    it('returns padded bounds', () => {
      const rect = makeRect({ id: 'r', x: 10, y: 20, width: 100, height: 80 })
      const bounds = getBoundTextBounds(rect)
      const pad = BOUND_TEXT_PADDING

      expect(bounds.x).toBe(10 + pad)
      expect(bounds.y).toBe(20 + pad)
      expect(bounds.width).toBe(100 - pad * 2)
      expect(bounds.height).toBe(80 - pad * 2)
    })

    it('clamps to minimum 20', () => {
      const rect = makeRect({ id: 'r', x: 0, y: 0, width: 10, height: 10 })
      const bounds = getBoundTextBounds(rect)
      expect(bounds.width).toBe(20)
      expect(bounds.height).toBe(20)
    })
  })

  describe('centerTextVertically', () => {
    it('centers text in available space', () => {
      const offset = centerTextVertically(100, 20)
      const pad = BOUND_TEXT_PADDING
      const available = 100 - pad * 2
      expect(offset).toBe(pad + (available - 20) / 2)
    })

    it('returns padding when text fills space', () => {
      const offset = centerTextVertically(20, 100)
      expect(offset).toBe(BOUND_TEXT_PADDING)
    })
  })

  describe('getBoundTextShape', () => {
    it('returns text shape when bound', () => {
      const text = makeText({ id: 'bt1' })
      const rect = makeRect({
        id: 'r1',
        props: { fill: '', fillStyle: 'solid', stroke: '#000', strokeWidth: 2, strokeStyle: 'solid', cornerRadius: 0, boundTextId: 'bt1' },
      }) as RectangleShape

      const shapes = new Map<string, Shape>([['r1', rect], ['bt1', text]])
      const result = getBoundTextShape(rect, shapes)
      expect(result).not.toBeNull()
      expect(result!.id).toBe('bt1')
    })

    it('returns null when no boundTextId', () => {
      const rect = makeRect({ id: 'r1' }) as RectangleShape
      const shapes = new Map<string, Shape>([['r1', rect]])
      expect(getBoundTextShape(rect, shapes)).toBeNull()
    })

    it('returns null when bound shape is not text', () => {
      const otherRect = makeRect({ id: 'other' })
      const rect = makeRect({
        id: 'r1',
        props: { fill: '', fillStyle: 'solid', stroke: '#000', strokeWidth: 2, strokeStyle: 'solid', cornerRadius: 0, boundTextId: 'other' },
      }) as RectangleShape

      const shapes = new Map<string, Shape>([['r1', rect], ['other', otherRect]])
      expect(getBoundTextShape(rect, shapes)).toBeNull()
    })
  })

  describe('collectBoundTextIds', () => {
    it('collects bound text IDs from shapes', () => {
      const text = makeText({ id: 'bt1' })
      const rect = makeRect({
        id: 'r1',
        props: { fill: '', fillStyle: 'solid', stroke: '#000', strokeWidth: 2, strokeStyle: 'solid', cornerRadius: 0, boundTextId: 'bt1' },
      })

      const shapes = new Map<string, Shape>([['r1', rect], ['bt1', text]])
      const ids = collectBoundTextIds(['r1'], shapes)
      expect(ids).toEqual(['bt1'])
    })

    it('returns empty for shapes without bound text', () => {
      const rect = makeRect({ id: 'r1' })
      const shapes = new Map<string, Shape>([['r1', rect]])
      expect(collectBoundTextIds(['r1'], shapes)).toEqual([])
    })
  })

  describe('getBoundTextIdFromShape', () => {
    it('returns boundTextId for rectangle', () => {
      const rect = makeRect({
        id: 'r1',
        props: { fill: '', fillStyle: 'solid', stroke: '#000', strokeWidth: 2, strokeStyle: 'solid', cornerRadius: 0, boundTextId: 'bt1' },
      })
      expect(getBoundTextIdFromShape(rect)).toBe('bt1')
    })

    it('returns null for unsupported types', () => {
      const line = makeLine({ id: 'l1' })
      expect(getBoundTextIdFromShape(line)).toBeNull()
    })

    it('returns null when no boundTextId set', () => {
      const rect = makeRect({ id: 'r1' })
      expect(getBoundTextIdFromShape(rect)).toBeNull()
    })
  })
})
