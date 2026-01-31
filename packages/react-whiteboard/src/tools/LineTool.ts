import type { LineShape, Point } from '../types'
import { BaseLineTool } from './BaseLineTool'

/**
 * Line tool - draws lines by dragging
 * Shift+drag snaps to 45-degree angles
 */
export class LineTool extends BaseLineTool {
  readonly type = 'line' as const
  readonly cursor = 'crosshair'
  readonly name = 'Line'

  /**
   * Create line shape from two points
   */
  protected createShape(start: Point, end: Point): LineShape {
    const bounds = this.calculateBounds(start, end)

    return {
      id: this.generateId(),
      type: 'line',
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      seed: Math.floor(Math.random() * 2147483647),
      roughness: 1,
      props: {
        stroke: this.defaultStroke,
        strokeWidth: this.defaultStrokeWidth,
        strokeStyle: 'solid' as const,
        points: [bounds.normalizedStart, bounds.normalizedEnd],
      },
    }
  }
}

export const lineTool = new LineTool()
