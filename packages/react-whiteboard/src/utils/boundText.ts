import type { Shape, TextShape, RectangleShape, EllipseShape, Bounds } from '../types'

/** Inset padding for bound text inside parent shape (canvas units) */
export const BOUND_TEXT_PADDING = 8

/** Shape types that can contain bound text */
const BOUND_TEXT_CONTAINERS = new Set(['rectangle', 'ellipse'])

/** Check if a shape type can contain bound text */
export function canContainBoundText(type: string): boolean {
  return BOUND_TEXT_CONTAINERS.has(type)
}

/** Get the available text bounds inside a parent shape (with padding) */
export function getBoundTextBounds(parent: Shape): Bounds {
  const pad = BOUND_TEXT_PADDING
  return {
    x: parent.x + pad,
    y: parent.y + pad,
    width: Math.max(parent.width - pad * 2, 20),
    height: Math.max(parent.height - pad * 2, 20),
  }
}

/** Calculate vertical offset to center text within parent height */
export function centerTextVertically(parentHeight: number, textHeight: number): number {
  const padding = BOUND_TEXT_PADDING
  const available = parentHeight - padding * 2
  if (textHeight >= available) return padding
  return padding + (available - textHeight) / 2
}

/** Get the bound text shape for a parent, if it exists */
export function getBoundTextShape(
  parent: RectangleShape | EllipseShape,
  shapes: Map<string, Shape>,
): TextShape | null {
  const boundTextId = parent.props.boundTextId
  if (!boundTextId) return null
  const shape = shapes.get(boundTextId)
  if (!shape || shape.type !== 'text') return null
  return shape as TextShape
}

/**
 * Collect bound text IDs for a set of shapes.
 * Used when deleting or copying shapes to include their bound text children.
 */
export function collectBoundTextIds(
  shapeIds: Iterable<string>,
  shapes: Map<string, Shape>,
): string[] {
  const ids: string[] = []
  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (!shape) continue
    const boundTextId = getBoundTextIdFromShape(shape)
    if (boundTextId && shapes.has(boundTextId)) {
      ids.push(boundTextId)
    }
  }
  return ids
}

/** Extract boundTextId from shape props if supported */
export function getBoundTextIdFromShape(shape: Shape): string | null {
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    return (shape as RectangleShape | EllipseShape).props.boundTextId ?? null
  }
  return null
}
