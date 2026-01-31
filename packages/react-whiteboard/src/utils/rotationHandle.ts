import type { Bounds, Point } from '../types'

/** Distance above the top-center of selection bounds for the rotation handle */
export const ROTATION_HANDLE_OFFSET = 25

/** Size of the rotation handle circle (radius) */
export const ROTATION_HANDLE_RADIUS = 5

/**
 * Get the canvas position of the rotation handle, relative to selection bounds.
 */
export function getRotationHandlePosition(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y - ROTATION_HANDLE_OFFSET,
  }
}

/**
 * Hit test whether a point is on the rotation handle.
 */
export function hitTestRotationHandle(
  point: Point,
  bounds: Bounds,
  tolerance: number = 8,
): boolean {
  const pos = getRotationHandlePosition(bounds)
  const dx = point.x - pos.x
  const dy = point.y - pos.y
  return dx * dx + dy * dy <= tolerance * tolerance
}

/**
 * Calculate the angle from center to a point (in radians).
 * Used to get both the initial angle and the current angle during rotation.
 */
export function angleFromCenter(center: Point, point: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x) + Math.PI / 2
}

/**
 * Calculate the delta rotation angle from an initial angle to the current cursor position.
 * When shiftKey is held, snaps the total result to 15-degree increments.
 */
export function calculateRotation(
  center: Point,
  point: Point,
  shiftKey: boolean,
  initialAngle: number = 0,
): number {
  let delta = angleFromCenter(center, point) - initialAngle
  if (shiftKey) {
    const snap = Math.PI / 12 // 15 degrees
    delta = Math.round(delta / snap) * snap
  }
  return delta
}

/**
 * Draw the rotation handle on the canvas context.
 */
export function drawRotationHandle(
  ctx: CanvasRenderingContext2D,
  bounds: Bounds,
): void {
  const pos = getRotationHandlePosition(bounds)
  const topCenter = { x: bounds.x + bounds.width / 2, y: bounds.y }

  // Draw connecting line
  ctx.beginPath()
  ctx.strokeStyle = '#0066ff'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.moveTo(topCenter.x, topCenter.y)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()

  // Draw circle
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, ROTATION_HANDLE_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#0066ff'
  ctx.lineWidth = 1.5
  ctx.stroke()
}
