import { describe, it, expect } from 'vitest'
import {
  serializeDocument,
  parseDocument,
  documentToStoreData,
} from '../utils/serialization'
import { makeRect, makeEllipse } from './storeFactory'
import type { Shape, Viewport } from '../types'

describe('serialization', () => {
  const viewport: Viewport = { x: 10, y: 20, zoom: 1.5 }

  function buildShapeMap(shapes: Shape[]): Map<string, Shape> {
    return new Map(shapes.map((s) => [s.id, s]))
  }

  describe('serializeDocument', () => {
    it('serializes shapes and viewport', () => {
      const r1 = makeRect({ id: 'r1' })
      const e1 = makeEllipse({ id: 'e1' })
      const shapes = buildShapeMap([r1, e1])
      const shapeIds = ['r1', 'e1']

      const doc = serializeDocument(shapes, shapeIds, viewport)

      expect(doc.version).toBe(1)
      expect(doc.source).toBe('react-whiteboard')
      expect(doc.shapes).toHaveLength(2)
      expect(doc.shapeIds).toEqual(['r1', 'e1'])
      expect(doc.viewport).toEqual(viewport)
    })

    it('preserves shape IDs in round-trip', () => {
      const r1 = makeRect({ id: 'r1' })
      const r2 = makeRect({ id: 'r2' })
      const shapes = buildShapeMap([r1, r2])
      const shapeIds = ['r1', 'r2']

      const doc = serializeDocument(shapes, shapeIds, viewport)
      const ids = doc.shapes.map((s) => s.id)
      expect(ids).toEqual(['r1', 'r2'])
    })
  })

  describe('parseDocument', () => {
    it('parses a valid document JSON', () => {
      const json = JSON.stringify({
        version: 1,
        source: 'react-whiteboard',
        viewport: { x: 0, y: 0, zoom: 1 },
        shapes: [makeRect({ id: 'r1' })],
        shapeIds: ['r1'],
      })

      const doc = parseDocument(json)
      expect(doc.shapes).toHaveLength(1)
      expect(doc.shapeIds).toEqual(['r1'])
    })

    it('throws on invalid source', () => {
      const json = JSON.stringify({
        version: 1,
        source: 'other-app',
        viewport: { x: 0, y: 0, zoom: 1 },
        shapes: [],
        shapeIds: [],
      })
      expect(() => parseDocument(json)).toThrow('unrecognized source')
    })

    it('throws on future version', () => {
      const json = JSON.stringify({
        version: 999,
        source: 'react-whiteboard',
        viewport: { x: 0, y: 0, zoom: 1 },
        shapes: [],
        shapeIds: [],
      })
      expect(() => parseDocument(json)).toThrow('Unsupported document version')
    })

    it('throws on non-object', () => {
      expect(() => parseDocument('"hello"')).toThrow('not an object')
    })

    it('throws on missing shapes', () => {
      const json = JSON.stringify({
        version: 1,
        source: 'react-whiteboard',
        viewport: { x: 0, y: 0, zoom: 1 },
      })
      expect(() => parseDocument(json)).toThrow('missing shapes')
    })

    it('throws on invalid viewport', () => {
      const json = JSON.stringify({
        version: 1,
        source: 'react-whiteboard',
        viewport: null,
        shapes: [],
        shapeIds: [],
      })
      expect(() => parseDocument(json)).toThrow('invalid viewport')
    })
  })

  describe('full round-trip: serialize -> JSON -> parse -> store data', () => {
    it('preserves shape count and IDs', () => {
      const r1 = makeRect({ id: 'r1', x: 10, y: 20 })
      const e1 = makeEllipse({ id: 'e1', x: 30, y: 40 })
      const shapes = buildShapeMap([r1, e1])
      const shapeIds = ['r1', 'e1']

      const doc = serializeDocument(shapes, shapeIds, viewport)
      const json = JSON.stringify(doc)
      const parsed = parseDocument(json)
      const storeData = documentToStoreData(parsed)

      expect(storeData.shapes.size).toBe(2)
      expect(storeData.shapeIds).toEqual(['r1', 'e1'])
      expect(storeData.shapes.get('r1')!.x).toBe(10)
      expect(storeData.shapes.get('e1')!.x).toBe(30)
      expect(storeData.viewport).toEqual(viewport)
    })

    it('preserves shape type through round-trip', () => {
      const r1 = makeRect({ id: 'r1' })
      const e1 = makeEllipse({ id: 'e1' })
      const shapes = buildShapeMap([r1, e1])

      const doc = serializeDocument(shapes, ['r1', 'e1'], viewport)
      const json = JSON.stringify(doc)
      const parsed = parseDocument(json)
      const storeData = documentToStoreData(parsed)

      expect(storeData.shapes.get('r1')!.type).toBe('rectangle')
      expect(storeData.shapes.get('e1')!.type).toBe('ellipse')
    })
  })

  describe('documentToStoreData', () => {
    it('converts shapes array to Map', () => {
      const doc = {
        version: 1,
        source: 'react-whiteboard' as const,
        viewport: { x: 0, y: 0, zoom: 1 },
        shapes: [makeRect({ id: 'r1' })],
        shapeIds: ['r1'],
      }

      const data = documentToStoreData(doc)
      expect(data.shapes).toBeInstanceOf(Map)
      expect(data.shapes.size).toBe(1)
      expect(data.shapes.get('r1')!.type).toBe('rectangle')
    })
  })
})
