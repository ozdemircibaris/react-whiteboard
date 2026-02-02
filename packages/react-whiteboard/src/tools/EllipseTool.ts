import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { EllipseShape, Shape, FillStyle, StrokeStyle } from '../types'
import { BaseShapeTool, type ShapeBounds } from './BaseShapeTool'
import { buildRoughOptions } from '../core/renderer/shapeRenderers'

const DEFAULT_ELLIPSE_PROPS = {
  fill: '#e0e0e0',
  fillStyle: 'hachure' as FillStyle,
  stroke: '#333333',
  strokeWidth: 2,
  strokeStyle: 'solid' as StrokeStyle,
}

/**
 * Ellipse tool — draws ellipses by dragging.
 * Shift constrains to circle.
 */
export class EllipseTool extends BaseShapeTool {
  readonly type = 'ellipse' as const
  readonly name = 'Ellipse'

  protected createShapeInstance(bounds: ShapeBounds, seed: number): EllipseShape {
    return {
      id: this.generateId(),
      type: 'ellipse',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      seed,
      roughness: 1,
      props: { ...DEFAULT_ELLIPSE_PROPS },
    }
  }

  protected renderPreview(_ctx: CanvasRenderingContext2D, rc: RoughCanvas, shape: Shape): void {
    const s = shape as EllipseShape
    const { x, y, width, height, props } = s
    const { fill, fillStyle, stroke, strokeWidth } = props

    const cx = x + width / 2
    const cy = y + height / 2

    rc.ellipse(cx, cy, width, height, buildRoughOptions(s.seed, s.roughness, {
      stroke,
      strokeWidth,
      fill: fill && fill !== 'transparent' ? fill : undefined,
      fillStyle: fillStyle || 'solid',
    }))
  }
}
