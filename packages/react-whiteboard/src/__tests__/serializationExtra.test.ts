import { describe, it, expect } from 'vitest'
import {
  exportToJSON,
  parseDocument,
  documentToStoreData,
  downloadFile,
  serializeDocument,
} from '../utils/serialization'
import { makeRect, makeEllipse } from './storeFactory'
import type { Shape, Viewport, ImageShape } from '../types'

describe('serialization (extended)', () => {
  const viewport: Viewport = { x: 0, y: 0, zoom: 1 }

  describe('exportToJSON', () => {
    it('exports to valid JSON string', async () => {
      const r1 = makeRect({ id: 'r1' })
      const shapes = new Map<string, Shape>([['r1', r1]])

      const json = await exportToJSON(shapes, ['r1'], viewport)
      const parsed = JSON.parse(json)
      expect(parsed.source).toBe('react-whiteboard')
      expect(parsed.shapes).toHaveLength(1)
    })
  })

  describe('parseDocument edge cases', () => {
    it('accepts version 1', () => {
      const json = JSON.stringify({
        version: 1,
        source: 'react-whiteboard',
        viewport: { x: 0, y: 0, zoom: 1 },
        shapes: [],
        shapeIds: [],
      })
      const doc = parseDocument(json)
      expect(doc.version).toBe(1)
    })

    it('throws on missing version', () => {
      const json = JSON.stringify({
        source: 'react-whiteboard',
        viewport: { x: 0, y: 0, zoom: 1 },
        shapes: [],
        shapeIds: [],
      })
      expect(() => parseDocument(json)).toThrow()
    })

    it('throws on viewport with missing zoom', () => {
      const json = JSON.stringify({
        version: 1,
        source: 'react-whiteboard',
        viewport: { x: 0, y: 0 },
        shapes: [],
        shapeIds: [],
      })
      expect(() => parseDocument(json)).toThrow('invalid viewport')
    })
  })

  describe('documentToStoreData with image shapes', () => {
    it('converts data URL to blob URL for image shapes', () => {
      // Create a minimal data URL
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo='
      const imageShape: ImageShape = {
        id: 'img1',
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        parentId: null,
        seed: 42,
        roughness: 0,
        props: {
          src: dataUrl,
          naturalWidth: 100,
          naturalHeight: 100,
        },
      }

      const doc = {
        version: 1,
        source: 'react-whiteboard' as const,
        viewport,
        shapes: [imageShape as Shape],
        shapeIds: ['img1'],
      }

      const data = documentToStoreData(doc)
      const img = data.shapes.get('img1') as ImageShape
      // Should have been converted to blob URL
      expect(img.props.src).not.toBe(dataUrl)
      expect(img.props.src.startsWith('blob:')).toBe(true)
    })

    it('keeps non-data-URL image src as-is', () => {
      const imageShape: ImageShape = {
        id: 'img1',
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        parentId: null,
        seed: 42,
        roughness: 0,
        props: {
          src: 'https://example.com/image.png',
          naturalWidth: 100,
          naturalHeight: 100,
        },
      }

      const doc = {
        version: 1,
        source: 'react-whiteboard' as const,
        viewport,
        shapes: [imageShape as Shape],
        shapeIds: ['img1'],
      }

      const data = documentToStoreData(doc)
      const img = data.shapes.get('img1') as ImageShape
      expect(img.props.src).toBe('https://example.com/image.png')
    })
  })

  describe('serializeDocument includes bound text shapes', () => {
    it('includes bound text children not in shapeIds', () => {
      const rect = makeRect({
        id: 'r1',
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
      const bt: Shape = {
        id: 'bt1',
        type: 'text',
        x: 10,
        y: 10,
        width: 80,
        height: 20,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        parentId: 'r1',
        seed: 42,
        roughness: 0,
        props: {
          text: 'hello',
          fontSize: 16,
          fontFamily: 'sans',
          fontWeight: 400,
          fontStyle: 'normal',
          color: '#000',
          backgroundColor: 'transparent',
          align: 'left',
          lineHeight: 1.5,
        },
      }

      const shapes = new Map<string, Shape>([['r1', rect], ['bt1', bt]])
      // bt1 is NOT in shapeIds (it's a child)
      const doc = serializeDocument(shapes, ['r1'], viewport)
      expect(doc.shapes).toHaveLength(2)
      expect(doc.shapes.map((s) => s.id)).toContain('bt1')
    })
  })
})
