import type { Point, Shape, Bounds, PathShape, LineShape, ArrowShape } from '../types'

// ============================================================================
// Constants
// ============================================================================

/** Threshold for detecting degenerate shapes (near-zero areas) */
const EPSILON = 0.0001

// ============================================================================
// Resize Handle Types & Constants
// ============================================================================

/**
 * Resize handle positions
 */
export type ResizeHandle =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'right-center'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'left-center'

/**
 * Cursor styles for each resize handle
 */
export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  'top-left': 'nwse-resize',
  'top-center': 'ns-resize',
  'top-right': 'nesw-resize',
  'right-center': 'ew-resize',
  'bottom-right': 'nwse-resize',
  'bottom-center': 'ns-resize',
  'bottom-left': 'nesw-resize',
  'left-center': 'ew-resize',
}

/** Default handle size matching renderer */
const HANDLE_SIZE = 8

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
 * Get the bounds of a shape (accounting for stroke width)
 */
export function getShapeBounds(shape: Shape): Bounds {
  const strokeWidth = 'props' in shape && 'strokeWidth' in shape.props ? shape.props.strokeWidth : 0
  const halfStroke = strokeWidth / 2

  if (shape.type === 'path') {
    const pathShape = shape as PathShape
    const points = pathShape.props.points

    if (points.length === 0) {
      return { x: shape.x, y: shape.y, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    return {
      x: minX - halfStroke,
      y: minY - halfStroke,
      width: maxX - minX + strokeWidth,
      height: maxY - minY + strokeWidth,
    }
  }

  return {
    x: shape.x - halfStroke,
    y: shape.y - halfStroke,
    width: shape.width + strokeWidth,
    height: shape.height + strokeWidth,
  }
}

/**
 * Hit test for rectangle shape
 */
export function hitTestRectangle(
  point: Point,
  shape: Shape,
  tolerance: number = 0
): boolean {
  const center: Point = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }

  // If shape is rotated, rotate point in opposite direction
  let testPoint = point
  if (shape.rotation !== 0) {
    testPoint = rotatePoint(point, center, -shape.rotation)
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
export function hitTestEllipse(
  point: Point,
  shape: Shape,
  tolerance: number = 0
): boolean {
  const center: Point = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }

  // If shape is rotated, rotate point in opposite direction
  let testPoint = point
  if (shape.rotation !== 0) {
    testPoint = rotatePoint(point, center, -shape.rotation)
  }

  const rx = shape.width / 2 + tolerance
  const ry = shape.height / 2 + tolerance

  if (rx === 0 || ry === 0) return false

  // Ellipse equation: (x-cx)²/rx² + (y-cy)²/ry² <= 1
  const dx = testPoint.x - center.x
  const dy = testPoint.y - center.y
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
}

/**
 * Calculate distance from point to line segment
 */
export function distanceToLineSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    // Start and end are the same point
    return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2)
  }

  // Project point onto line segment
  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))

  const projX = start.x + t * dx
  const projY = start.y + t * dy

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
}

/**
 * Hit test for path (freehand drawing)
 */
export function hitTestPath(
  point: Point,
  shape: PathShape,
  tolerance: number = 5
): boolean {
  const { points } = shape.props

  if (points.length === 0) return false

  const firstPoint = points[0]
  if (!firstPoint) return false

  if (points.length === 1) {
    const dx = point.x - firstPoint.x
    const dy = point.y - firstPoint.y
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  }

  // Check if point is close to any line segment
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    if (!current || !next) continue

    const dist = distanceToLineSegment(point, current, next)
    if (dist <= tolerance + (shape.props.strokeWidth / 2)) {
      return true
    }
  }

  return false
}

/**
 * Hit test for line shape
 */
export function hitTestLine(
  point: Point,
  shape: LineShape,
  tolerance: number = 5
): boolean {
  const { x, y, props } = shape
  const { points, strokeWidth } = props

  const startPoint = points[0]
  const endPoint = points[1]
  if (!startPoint || !endPoint) return false

  const start = { x: x + startPoint.x, y: y + startPoint.y }
  const end = { x: x + endPoint.x, y: y + endPoint.y }

  const dist = distanceToLineSegment(point, start, end)
  return dist <= tolerance + strokeWidth / 2
}

/**
 * Check if point is inside a triangle using barycentric coordinates
 */
function pointInTriangle(p: Point, p1: Point, p2: Point, p3: Point): boolean {
  const area = 0.5 * (-p2.y * p3.x + p1.y * (-p2.x + p3.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y)
  if (Math.abs(area) < EPSILON) return false // Degenerate triangle

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
  const headAngle = Math.PI / 6 // 30 degrees

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
 * Hit test for arrow shape (line + arrowheads)
 * Tests both start and end arrowheads based on shape properties
 */
export function hitTestArrow(
  point: Point,
  shape: ArrowShape,
  tolerance: number = 5
): boolean {
  const { x, y, props } = shape
  const { start, end, strokeWidth, startArrowhead, endArrowhead } = props

  const startPoint = { x: x + start.x, y: y + start.y }
  const endPoint = { x: x + end.x, y: y + end.y }

  // Test line segment
  const dist = distanceToLineSegment(point, startPoint, endPoint)
  if (dist <= tolerance + strokeWidth / 2) return true

  const arrowSize = strokeWidth * 4

  // Test end arrowhead if present
  if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
    const endTriangle = getArrowheadTriangle(endPoint, startPoint, arrowSize)
    if (pointInTriangle(point, endTriangle.p1, endTriangle.p2, endTriangle.p3)) {
      return true
    }
  }

  // Test start arrowhead if present
  if (startArrowhead === 'arrow' || startArrowhead === 'triangle') {
    const startTriangle = getArrowheadTriangle(startPoint, endPoint, arrowSize)
    if (pointInTriangle(point, startTriangle.p1, startTriangle.p2, startTriangle.p3)) {
      return true
    }
  }

  return false
}

/**
 * Hit test a single shape
 */
export function hitTestShape(
  point: Point,
  shape: Shape,
  tolerance: number = 0
): boolean {
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
      return hitTestRectangle(point, shape, tolerance)
    default:
      // Fallback to bounding box test
      return hitTestRectangle(point, shape, tolerance)
  }
}

/**
 * Find the shape at a given point (returns the topmost shape)
 * Searches in reverse z-order (top to bottom)
 */
export function getShapeAtPoint(
  point: Point,
  shapes: Map<string, Shape>,
  shapeIds: string[],
  tolerance: number = 0
): Shape | null {
  // Iterate in reverse order (top to bottom)
  for (let i = shapeIds.length - 1; i >= 0; i--) {
    const id = shapeIds[i]
    if (!id) continue

    const shape = shapes.get(id)
    if (shape && hitTestShape(point, shape, tolerance)) {
      return shape
    }
  }
  return null
}

/**
 * Find all shapes at a given point
 */
export function getShapesAtPoint(
  point: Point,
  shapes: Map<string, Shape>,
  shapeIds: string[],
  tolerance: number = 0
): Shape[] {
  const result: Shape[] = []

  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (shape && hitTestShape(point, shape, tolerance)) {
      result.push(shape)
    }
  }

  return result
}

/**
 * Find shapes within a selection box (marquee selection)
 */
export function getShapesInBounds(
  bounds: Bounds,
  shapes: Map<string, Shape>,
  shapeIds: string[],
  fullyContained: boolean = true
): Shape[] {
  const result: Shape[] = []

  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (!shape || shape.isLocked) continue

    const shapeBounds = getShapeBounds(shape)

    if (fullyContained) {
      // Shape must be fully inside bounds
      if (
        shapeBounds.x >= bounds.x &&
        shapeBounds.y >= bounds.y &&
        shapeBounds.x + shapeBounds.width <= bounds.x + bounds.width &&
        shapeBounds.y + shapeBounds.height <= bounds.y + bounds.height
      ) {
        result.push(shape)
      }
    } else {
      // Shape just needs to intersect bounds
      if (
        shapeBounds.x < bounds.x + bounds.width &&
        shapeBounds.x + shapeBounds.width > bounds.x &&
        shapeBounds.y < bounds.y + bounds.height &&
        shapeBounds.y + shapeBounds.height > bounds.y
      ) {
        result.push(shape)
      }
    }
  }

  return result
}

/**
 * Get combined bounds of multiple shapes
 */
export function getSelectionBounds(shapes: Shape[]): Bounds | null {
  if (shapes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    const bounds = getShapeBounds(shape)
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.width)
    maxY = Math.max(maxY, bounds.y + bounds.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

// ============================================================================
// Resize Handle Functions
// ============================================================================

/**
 * Get resize handle positions for a shape's bounds
 */
export function getResizeHandlePositions(bounds: Bounds): Record<ResizeHandle, Point> {
  const { x, y, width, height } = bounds

  return {
    'top-left': { x, y },
    'top-center': { x: x + width / 2, y },
    'top-right': { x: x + width, y },
    'right-center': { x: x + width, y: y + height / 2 },
    'bottom-right': { x: x + width, y: y + height },
    'bottom-center': { x: x + width / 2, y: y + height },
    'bottom-left': { x, y: y + height },
    'left-center': { x, y: y + height / 2 },
  }
}

/**
 * Hit test resize handles for a shape
 * Returns the handle being hit or null
 */
export function hitTestResizeHandles(
  point: Point,
  shape: Shape,
  handleSize: number = HANDLE_SIZE
): ResizeHandle | null {
  const halfHandle = handleSize / 2
  const bounds: Bounds = { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
  const handles = getResizeHandlePositions(bounds)

  // Check each handle
  for (const [handle, pos] of Object.entries(handles) as [ResizeHandle, Point][]) {
    if (
      point.x >= pos.x - halfHandle &&
      point.x <= pos.x + halfHandle &&
      point.y >= pos.y - halfHandle &&
      point.y <= pos.y + halfHandle
    ) {
      return handle
    }
  }

  return null
}

/**
 * Hit test resize handles for selection bounds (multiple shapes)
 */
export function hitTestSelectionResizeHandles(
  point: Point,
  bounds: Bounds,
  handleSize: number = HANDLE_SIZE
): ResizeHandle | null {
  const halfHandle = handleSize / 2
  const handles = getResizeHandlePositions(bounds)

  for (const [handle, pos] of Object.entries(handles) as [ResizeHandle, Point][]) {
    if (
      point.x >= pos.x - halfHandle &&
      point.x <= pos.x + halfHandle &&
      point.y >= pos.y - halfHandle &&
      point.y <= pos.y + halfHandle
    ) {
      return handle
    }
  }

  return null
}
