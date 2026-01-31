import type { Point, Shape, PathShape, LineShape, ArrowShape } from '../types'

/** Threshold for detecting degenerate shapes */
const EPSILON = 0.0001

/**
 * Rotate a point around a center point by a given angle (in radians)
 */
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

/**
 * Calculate distance from point to line segment
 */
export function distanceToLineSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2)
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))

  const projX = start.x + t * dx
  const projY = start.y + t * dy

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
}

/**
 * Check if point is inside a triangle using barycentric coordinates
 */
function pointInTriangle(p: Point, p1: Point, p2: Point, p3: Point): boolean {
  const area = 0.5 * (-p2.y * p3.x + p1.y * (-p2.x + p3.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y)
  if (Math.abs(area) < EPSILON) return false

  const s = (1 / (2 * area)) * (p1.y * p3.x - p1.x * p3.y + (p3.y - p1.y) * p.x + (p1.x - p3.x) * p.y)
  const t = (1 / (2 * area)) * (p1.x * p2.y - p1.y * p2.x + (p1.y - p2.y) * p.x + (p2.x - p1.x) * p.y)

  return s >= 0 && t >= 0 && 1 - s - t >= 0
}

/**
 * Calculate arrowhead triangle points
 */
function getArrowheadTriangle(
  tip: Point,
  fromPoint: Point,
  size: number
): { p1: Point; p2: Point; p3: Point } {
  const angle = Math.atan2(tip.y - fromPoint.y, tip.x - fromPoint.x)
  const headAngle = Math.PI / 6

  return {
    p1: tip,
    p2: {
      x: tip.x - size * Math.cos(angle - headAngle),
      y: tip.y - size * Math.sin(angle - headAngle),
    },
    p3: {
      x: tip.x - size * Math.cos(angle + headAngle),
      y: tip.y - size * Math.sin(angle + headAngle),
    },
  }
}

/**
 * Un-rotate a test point for hit testing rotated shapes.
 * Returns the original point if rotation is 0.
 */
function unrotateTestPoint(point: Point, shape: Shape): Point {
  if (shape.rotation === 0) return point
  const center: Point = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }
  return rotatePoint(point, center, -shape.rotation)
}

/**
 * Hit test for rectangle shape
 */
export function hitTestRectangle(point: Point, shape: Shape, tolerance: number = 0): boolean {
  const testPoint = unrotateTestPoint(point, shape)
  const center: Point = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }

  const halfWidth = shape.width / 2 + tolerance
  const halfHeight = shape.height / 2 + tolerance

  return (
    Math.abs(testPoint.x - center.x) <= halfWidth &&
    Math.abs(testPoint.y - center.y) <= halfHeight
  )
}

/**
 * Hit test for ellipse shape
 */
export function hitTestEllipse(point: Point, shape: Shape, tolerance: number = 0): boolean {
  const testPoint = unrotateTestPoint(point, shape)
  const center: Point = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }

  const rx = shape.width / 2 + tolerance
  const ry = shape.height / 2 + tolerance

  if (rx === 0 || ry === 0) return false

  const dx = testPoint.x - center.x
  const dy = testPoint.y - center.y
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
}

/**
 * Hit test for path (freehand drawing) — offsets points by shape position
 */
export function hitTestPath(point: Point, shape: PathShape, tolerance: number = 5): boolean {
  const { x, y } = shape
  const { points, strokeWidth } = shape.props

  if (points.length === 0) return false

  const testPoint = unrotateTestPoint(point, shape)

  const firstPoint = points[0]
  if (!firstPoint) return false

  if (points.length === 1) {
    const dx = testPoint.x - (x + firstPoint.x)
    const dy = testPoint.y - (y + firstPoint.y)
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  }

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    if (!current || !next) continue

    const absCurrent = { x: x + current.x, y: y + current.y }
    const absNext = { x: x + next.x, y: y + next.y }
    const dist = distanceToLineSegment(testPoint, absCurrent, absNext)
    if (dist <= tolerance + strokeWidth / 2) {
      return true
    }
  }

  return false
}

/**
 * Hit test for line shape — accounts for rotation
 */
export function hitTestLine(point: Point, shape: LineShape, tolerance: number = 5): boolean {
  const { x, y, props } = shape
  const { points, strokeWidth } = props

  const startPoint = points[0]
  const endPoint = points[1]
  if (!startPoint || !endPoint) return false

  const testPoint = unrotateTestPoint(point, shape)

  const start = { x: x + startPoint.x, y: y + startPoint.y }
  const end = { x: x + endPoint.x, y: y + endPoint.y }

  const dist = distanceToLineSegment(testPoint, start, end)
  return dist <= tolerance + strokeWidth / 2
}

/**
 * Hit test for arrow shape (line + arrowheads) — accounts for rotation
 */
export function hitTestArrow(point: Point, shape: ArrowShape, tolerance: number = 5): boolean {
  const { x, y, props } = shape
  const { start, end, strokeWidth, startArrowhead, endArrowhead } = props

  const testPoint = unrotateTestPoint(point, shape)

  const startPoint = { x: x + start.x, y: y + start.y }
  const endPoint = { x: x + end.x, y: y + end.y }

  const dist = distanceToLineSegment(testPoint, startPoint, endPoint)
  if (dist <= tolerance + strokeWidth / 2) return true

  const arrowSize = strokeWidth * 4

  if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
    const endTriangle = getArrowheadTriangle(endPoint, startPoint, arrowSize)
    if (pointInTriangle(testPoint, endTriangle.p1, endTriangle.p2, endTriangle.p3)) {
      return true
    }
  }

  if (startArrowhead === 'arrow' || startArrowhead === 'triangle') {
    const startTriangle = getArrowheadTriangle(startPoint, endPoint, arrowSize)
    if (pointInTriangle(testPoint, startTriangle.p1, startTriangle.p2, startTriangle.p3)) {
      return true
    }
  }

  return false
}

/**
 * Hit test a single shape
 */
export function hitTestShape(point: Point, shape: Shape, tolerance: number = 0): boolean {
  if (shape.isLocked) return false

  switch (shape.type) {
    case 'rectangle':
      return hitTestRectangle(point, shape, tolerance)
    case 'ellipse':
      return hitTestEllipse(point, shape, tolerance)
    case 'path':
      return hitTestPath(point, shape as PathShape, tolerance)
    case 'line':
      return hitTestLine(point, shape as LineShape, tolerance)
    case 'arrow':
      return hitTestArrow(point, shape as ArrowShape, tolerance)
    case 'text':
    case 'image':
    case 'group':
      return hitTestRectangle(point, shape, tolerance)
    default:
      return hitTestRectangle(point, shape, tolerance)
  }
}
