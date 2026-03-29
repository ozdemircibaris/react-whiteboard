/**
 * Stable cache key generation for shape rendering.
 * Extracts visually-relevant fields per shape type and produces
 * a compact string key. Custom/unknown shapes use FNV-1a hashing
 * of their props instead of JSON.stringify.
 */

import type {
  Shape,
  RectangleShape,
  EllipseShape,
  PathShape,
  LineShape,
  ArrowShape,
  TextShape,
  ImageShape,
} from '../types'
import { hashObjectProps } from './fnv1a'

/**
 * Build a lightweight cache key from shape properties that affect rendering.
 * Excludes x,y (position) since the cache is position-independent.
 *
 * Uses type-specific property extraction to avoid expensive serialization
 * on large data (e.g. PathShape with thousands of points, ImageShape with
 * base64 src).
 */
export function shapeCacheKey(shape: Shape, zoom: number): string {
  const base = `${shape.type}|${shape.width}|${shape.height}|${shape.rotation}|${shape.opacity}|${shape.seed}|${shape.roughness}|${zoom}`

  switch (shape.type) {
    case 'rectangle': {
      const p = (shape as RectangleShape).props
      return `${base}|${p.fill}|${p.fillStyle}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.cornerRadius}|${p.boundTextId ?? ''}`
    }
    case 'ellipse': {
      const p = (shape as EllipseShape).props
      return `${base}|${p.fill}|${p.fillStyle}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.boundTextId ?? ''}`
    }
    case 'path': {
      const p = (shape as PathShape).props
      return `${base}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.isComplete}|${p.points.length}`
    }
    case 'line': {
      const p = (shape as LineShape).props
      const pts = p.points
      return `${base}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${pts.length}|${pts[0]?.x}|${pts[0]?.y}|${pts[pts.length - 1]?.x}|${pts[pts.length - 1]?.y}`
    }
    case 'arrow': {
      const p = (shape as ArrowShape).props
      return `${base}|${p.stroke}|${p.strokeWidth}|${p.strokeStyle}|${p.start.x}|${p.start.y}|${p.end.x}|${p.end.y}|${p.startArrowhead}|${p.endArrowhead}`
    }
    case 'text': {
      const p = (shape as TextShape).props
      return `${base}|${p.text.length}|${p.fontSize}|${p.fontFamily}|${p.fontWeight}|${p.fontStyle}|${p.color}|${p.backgroundColor}|${p.align}|${p.lineHeight}`
    }
    case 'image': {
      const p = (shape as ImageShape).props
      return `${base}|${p.src.length}|${p.naturalWidth}|${p.naturalHeight}`
    }
    default: {
      // Custom shapes: use FNV-1a hash of sorted props for a stable, compact key
      const p = shape.props as Record<string, unknown>
      return `${base}|${hashObjectProps(p)}`
    }
  }
}
