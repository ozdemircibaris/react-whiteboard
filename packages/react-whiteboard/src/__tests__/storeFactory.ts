import { createWhiteboardStore, type WhiteboardStore } from '../core/store/createStore'
import type { Shape, RectangleShape, EllipseShape, LineShape, ArrowShape, PathShape, TextShape } from '../types'

/**
 * Create an isolated Zustand store instance for testing.
 * Each call returns a fresh store so tests don't leak state.
 */
export function createTestStore() {
  return createWhiteboardStore()
}

/** Convenience: get store state without subscribing */
export function getState(store: ReturnType<typeof createTestStore>): WhiteboardStore {
  return store.getState()
}

// ---------------------------------------------------------------------------
// Shape factory helpers — deterministic IDs / seeds for assertions
// ---------------------------------------------------------------------------

let shapeCounter = 0

function baseShape(overrides: Partial<Shape> = {}): Omit<Shape, 'type' | 'props'> {
  shapeCounter++
  return {
    id: overrides.id ?? `shape-${shapeCounter}`,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? 100,
    height: overrides.height ?? 100,
    rotation: overrides.rotation ?? 0,
    opacity: overrides.opacity ?? 1,
    isLocked: overrides.isLocked ?? false,
    parentId: overrides.parentId ?? null,
    seed: overrides.seed ?? 42,
    roughness: overrides.roughness ?? 0,
  }
}

export function makeRect(overrides: Partial<RectangleShape> = {}): RectangleShape {
  return {
    ...baseShape(overrides),
    type: 'rectangle',
    props: {
      fill: 'transparent',
      fillStyle: 'solid',
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      cornerRadius: 0,
      ...overrides.props,
    },
  } as RectangleShape
}

export function makeEllipse(overrides: Partial<EllipseShape> = {}): EllipseShape {
  return {
    ...baseShape(overrides),
    type: 'ellipse',
    props: {
      fill: 'transparent',
      fillStyle: 'solid',
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      ...overrides.props,
    },
  } as EllipseShape
}

export function makeLine(overrides: Partial<LineShape> = {}): LineShape {
  const base = baseShape(overrides)
  return {
    ...base,
    type: 'line',
    props: {
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      points: [{ x: 0, y: 0 }, { x: base.width as number, y: base.height as number }],
      ...overrides.props,
    },
  } as LineShape
}

export function makeArrow(overrides: Partial<ArrowShape> = {}): ArrowShape {
  const base = baseShape(overrides)
  return {
    ...base,
    type: 'arrow',
    props: {
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      start: { x: 0, y: 0 },
      end: { x: base.width as number, y: base.height as number },
      startArrowhead: 'none',
      endArrowhead: 'arrow',
      ...overrides.props,
    },
  } as ArrowShape
}

export function makePath(overrides: Partial<PathShape> = {}): PathShape {
  return {
    ...baseShape(overrides),
    type: 'path',
    props: {
      stroke: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      points: [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }],
      isComplete: true,
      ...overrides.props,
    },
  } as PathShape
}

export function makeText(overrides: Partial<TextShape> = {}): TextShape {
  return {
    ...baseShape(overrides),
    type: 'text',
    props: {
      text: 'Hello',
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

/** Reset the shape counter between test suites if needed */
export function resetShapeCounter(): void {
  shapeCounter = 0
}
