import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { RectangleShape, Shape } from '../types'
import { BaseShapeTool, type ShapeBounds } from './BaseShapeTool'
import { buildRoughOptions } from '../core/renderer/shapeRenderers'

import type { FillStyle, StrokeStyle } from '../types'

const DEFAULT_RECTANGLE_PROPS = {
  fill: '#e0e0e0',
  fillStyle: 'hachure' as FillStyle,
  stroke: '#333333',
  strokeWidth: 2,
  strokeStyle: 'solid' as StrokeStyle,
  cornerRadius: 0,
}

/**
 * Rectangle tool — draws rectangles by dragging.
 * Shift constrains to square.
 */
export class RectangleTool extends BaseShapeTool {
  readonly type = 'rectangle' as const
  readonly name = 'Rectangle'

  protected createShapeInstance(bounds: ShapeBounds, seed: number): RectangleShape {
    return {
      id: this.generateId(),
      type: 'rectangle',
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
      props: { ...DEFAULT_RECTANGLE_PROPS },
    }
  }

  protected renderPreview(_ctx: CanvasRenderingContext2D, rc: RoughCanvas, shape: Shape): void {
    const s = shape as RectangleShape
    const { x, y, width, height, props } = s
    const { fill, fillStyle, stroke, strokeWidth } = props

    rc.rectangle(x, y, width, height, buildRoughOptions(s.seed, s.roughness, {
      stroke,
      strokeWidth,
      fill: fill && fill !== 'transparent' ? fill : undefined,
      fillStyle: fillStyle || 'solid',
    }))
  }
}
