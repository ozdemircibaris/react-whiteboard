import type { Options as RoughOptions } from 'roughjs/bin/core'
import type { StrokeStyle, FillStyle } from '../../../types'

/** Selection outline drawing callback type */
export type DrawSelectionOutlineFn = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void

/**
 * Build RoughJS options from shape seed/roughness + per-shape style overrides
 */
export function buildRoughOptions(
  seed: number,
  roughness: number,
  extra: RoughOptions = {},
): RoughOptions {
  return { seed, roughness, ...extra }
}

/**
 * Apply rotation transform around the center of a bounding box.
 * Must be paired with ctx.restore() after drawing.
 */
export function applyRotation(
  ctx: CanvasRenderingContext2D,
  rotation: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (rotation !== 0) {
    const cx = x + width / 2
    const cy = y + height / 2
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }
}

/**
 * Convert StrokeStyle to canvas lineDash array
 */
export function getStrokeLineDash(style: StrokeStyle | undefined, strokeWidth: number): number[] {
  switch (style) {
    case 'dashed': return [strokeWidth * 4, strokeWidth * 2]
    case 'dotted': return [strokeWidth, strokeWidth * 2]
    default: return []
  }
}

/**
 * Map FillStyle to RoughJS fillStyle string
 */
export function mapFillStyle(style: FillStyle | undefined): string {
  switch (style) {
    case 'hachure': return 'hachure'
    case 'cross-hatch': return 'cross-hatch'
    case 'dots': return 'dots'
    default: return 'solid'
  }
}

/**
 * Draw a rounded rectangle path on the canvas context
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
