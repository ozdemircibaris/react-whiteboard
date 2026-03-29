import { describe, it, expect } from 'vitest'
import { shapeCacheKey } from '../utils/shapeCacheKey'
import type {
  RectangleShape,
  EllipseShape,
  PathShape,
  LineShape,
  ArrowShape,
  TextShape,
  ImageShape,
  Shape,
} from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBase(overrides: Partial<Shape> = {}): Omit<Shape, 'type' | 'props'> {
  return {
    id: 'test-id',
    x: 100,
    y: 200,
    width: 300,
    height: 150,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    parentId: null,
    seed: 42,
    roughness: 1,
    ...overrides,
  }
}

function makeRectangle(overrides: Partial<RectangleShape> = {}): RectangleShape {
  return {
    ...makeBase(overrides),
    type: 'rectangle',
    props: {
      fill: '#ff0000',
      fillStyle: 'solid',
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      cornerRadius: 0,
      ...overrides.props,
    },
  } as RectangleShape
}

function makeEllipse(overrides: Partial<EllipseShape> = {}): EllipseShape {
  return {
    ...makeBase(overrides),
    type: 'ellipse',
    props: {
      fill: '#00ff00',
      fillStyle: 'hachure',
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      ...overrides.props,
    },
  } as EllipseShape
}

function makePath(overrides: Partial<PathShape> = {}): PathShape {
  return {
    ...makeBase(overrides),
    type: 'path',
    props: {
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      isComplete: true,
      ...overrides.props,
    },
  } as PathShape
}

function makeLine(overrides: Partial<LineShape> = {}): LineShape {
  return {
    ...makeBase(overrides),
    type: 'line',
    props: {
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      points: [{ x: 0, y: 0 }, { x: 50, y: 50 }],
      ...overrides.props,
    },
  } as LineShape
}

function makeArrow(overrides: Partial<ArrowShape> = {}): ArrowShape {
  return {
    ...makeBase(overrides),
    type: 'arrow',
    props: {
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 50 },
      startArrowhead: 'none',
      endArrowhead: 'arrow',
      ...overrides.props,
    },
  } as ArrowShape
}

function makeText(overrides: Partial<TextShape> = {}): TextShape {
  return {
    ...makeBase(overrides),
    type: 'text',
    props: {
      text: 'Hello World',
      fontSize: 16,
      fontFamily: 'sans',
      fontWeight: 400,
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      align: 'left',
      lineHeight: 1.5,
      ...overrides.props,
    },
  } as TextShape
}

function makeImage(overrides: Partial<ImageShape> = {}): ImageShape {
  return {
    ...makeBase(overrides),
    type: 'image',
    props: {
      src: 'data:image/png;base64,abc123',
      naturalWidth: 800,
      naturalHeight: 600,
      ...overrides.props,
    },
  } as ImageShape
}

function makeCustomShape(props: Record<string, unknown> = {}): Shape {
  return {
    ...makeBase(),
    type: 'custom-widget' as never,
    props: { color: 'red', size: 42, ...props },
  } as unknown as Shape
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('shapeCacheKey', () => {
  const zoom = 1

  describe('determinism — same props produce same key', () => {
    it('rectangle', () => {
      const s = makeRectangle()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeRectangle(), zoom))
    })

    it('ellipse', () => {
      const s = makeEllipse()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeEllipse(), zoom))
    })

    it('path', () => {
      const s = makePath()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makePath(), zoom))
    })

    it('line', () => {
      const s = makeLine()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeLine(), zoom))
    })

    it('arrow', () => {
      const s = makeArrow()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeArrow(), zoom))
    })

    it('text', () => {
      const s = makeText()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeText(), zoom))
    })

    it('image', () => {
      const s = makeImage()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeImage(), zoom))
    })

    it('custom shape', () => {
      const s = makeCustomShape()
      expect(shapeCacheKey(s, zoom)).toBe(shapeCacheKey(makeCustomShape(), zoom))
    })
  })

  describe('sensitivity — changing any visual field produces a different key', () => {
    it('width change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ width: 999 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('height change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ height: 999 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('rotation change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ rotation: Math.PI / 4 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('opacity change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ opacity: 0.5 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('roughness change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ roughness: 2 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('fill change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ props: { ...makeRectangle().props, fill: '#0000ff' } })
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('stroke change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ props: { ...makeRectangle().props, stroke: '#ff0000' } })
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('strokeWidth change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ props: { ...makeRectangle().props, strokeWidth: 5 } })
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })

    it('zoom change', () => {
      const s = makeRectangle()
      expect(shapeCacheKey(s, 1)).not.toBe(shapeCacheKey(s, 2))
    })

    it('seed change', () => {
      const a = makeRectangle()
      const b = makeRectangle({ seed: 999 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).not.toBe(shapeCacheKey(b, zoom))
    })
  })

  describe('position independence — x,y changes do NOT affect the key', () => {
    it('moving a rectangle keeps the same key', () => {
      const a = makeRectangle()
      const b = makeRectangle({ x: 500, y: 600 } as Partial<RectangleShape>)
      expect(shapeCacheKey(a, zoom)).toBe(shapeCacheKey(b, zoom))
    })
  })

  describe('all shape types produce valid string keys', () => {
    const shapes: [string, Shape][] = [
      ['rectangle', makeRectangle()],
      ['ellipse', makeEllipse()],
      ['path', makePath()],
      ['line', makeLine()],
      ['arrow', makeArrow()],
      ['text', makeText()],
      ['image', makeImage()],
      ['custom', makeCustomShape()],
    ]

    it.each(shapes)('%s produces a non-empty string key', (_name, shape) => {
      const key = shapeCacheKey(shape, zoom)
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })
  })

  describe('custom shape uses FNV-1a hash instead of JSON.stringify', () => {
    it('does not contain raw JSON in the key', () => {
      const s = makeCustomShape({ nested: { a: 1, b: [1, 2] } })
      const key = shapeCacheKey(s, zoom)
      // Should NOT contain JSON curly braces or array brackets from stringify
      expect(key).not.toContain('{"')
      expect(key).not.toContain('"}')
    })

    it('property order does not affect the key', () => {
      const a = { ...makeBase(), type: 'widget' as never, props: { b: 2, a: 1 } } as unknown as Shape
      const b = { ...makeBase(), type: 'widget' as never, props: { a: 1, b: 2 } } as unknown as Shape
      expect(shapeCacheKey(a, zoom)).toBe(shapeCacheKey(b, zoom))
    })
  })
})
