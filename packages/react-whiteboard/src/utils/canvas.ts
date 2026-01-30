import type { Point, Viewport, Bounds } from '../types'

/**
 * Get the device pixel ratio for high-DPI displays
 */
export function getDevicePixelRatio(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  screenPoint: Point,
  viewport: Viewport,
  canvasRect: DOMRect
): Point {
  const { x: panX, y: panY, zoom } = viewport

  return {
    x: (screenPoint.x - canvasRect.left - panX) / zoom,
    y: (screenPoint.y - canvasRect.top - panY) / zoom,
  }
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasPoint: Point,
  viewport: Viewport,
  canvasRect: DOMRect
): Point {
  const { x: panX, y: panY, zoom } = viewport

  return {
    x: canvasPoint.x * zoom + panX + canvasRect.left,
    y: canvasPoint.y * zoom + panY + canvasRect.top,
  }
}

/**
 * Get the visible bounds in canvas coordinates
 */
export function getVisibleBounds(
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number
): Bounds {
  const { x: panX, y: panY, zoom } = viewport

  return {
    x: -panX / zoom,
    y: -panY / zoom,
    width: canvasWidth / zoom,
    height: canvasHeight / zoom,
  }
}

/**
 * Check if a point is within bounds
 */
export function isPointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  )
}

/**
 * Check if two bounds intersect
 */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

/**
 * Get the center point of bounds
 */
export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

/**
 * Expand bounds by a given amount
 */
export function expandBounds(bounds: Bounds, amount: number): Bounds {
  return {
    x: bounds.x - amount,
    y: bounds.y - amount,
    width: bounds.width + amount * 2,
    height: bounds.height + amount * 2,
  }
}

/**
 * Calculate distance between two points
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate the angle between two points (in radians)
 */
export function angle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Linear interpolation between two points
 */
export function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  }
}

/**
 * Calculate arrowhead points for drawing
 *
 * @param start - The start point of the line
 * @param end - The end point (tip of arrow)
 * @param headSize - The size of the arrowhead (default: 12)
 * @param headAngle - The angle of the arrowhead wings in radians (default: PI/6 = 30°)
 * @returns Array of two points forming the arrowhead wings
 */
export function calculateArrowhead(
  start: Point,
  end: Point,
  headSize: number = 12,
  headAngle: number = Math.PI / 6
): [Point, Point] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)

  return [
    {
      x: end.x - headSize * Math.cos(angle - headAngle),
      y: end.y - headSize * Math.sin(angle - headAngle),
    },
    {
      x: end.x - headSize * Math.cos(angle + headAngle),
      y: end.y - headSize * Math.sin(angle + headAngle),
    },
  ]
}

/**
 * Snap a point to the nearest angle increment from a start point
 * Useful for constraining lines/arrows to fixed angles (e.g., 45°)
 *
 * @param start - The origin point
 * @param end - The point to snap
 * @param snapDegrees - The angle increment in degrees (default: 45)
 * @returns The snapped point at the same distance but aligned to the nearest angle
 */
export function snapToAngle(start: Point, end: Point, snapDegrees: number = 45): Point {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const currentAngle = Math.atan2(dy, dx)
  const dist = Math.hypot(dx, dy)

  // Convert snap degrees to radians
  const snapRadians = (snapDegrees * Math.PI) / 180

  // Snap to nearest angle increment
  const snappedAngle = Math.round(currentAngle / snapRadians) * snapRadians

  return {
    x: start.x + Math.cos(snappedAngle) * dist,
    y: start.y + Math.sin(snappedAngle) * dist,
  }
}

/**
 * Cubic ease-out function for smooth animations
 * Starts fast and decelerates toward the end
 *
 * @param t Progress value (0-1)
 * @returns Eased value (0-1)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
