import type { ArrowShape, Point } from '../types'
import { BaseLineTool } from './BaseLineTool'

/**
 * Arrow tool - draws arrows by dragging
 * Shift+drag snaps to 45-degree angles
 */
export class ArrowTool extends BaseLineTool {
  readonly type = 'arrow' as const
  readonly cursor = 'crosshair'
  readonly name = 'Arrow'

  private readonly startArrowhead: 'none' | 'arrow' | 'triangle' = 'none'
  private readonly endArrowhead: 'none' | 'arrow' | 'triangle' = 'arrow'

  /**
   * Create arrow shape from two points
   */
  protected createShape(start: Point, end: Point): ArrowShape {
    const bounds = this.calculateBounds(start, end)

    return {
      id: this.generateId(),
      type: 'arrow',
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
        start: bounds.normalizedStart,
        end: bounds.normalizedEnd,
        startArrowhead: this.startArrowhead,
        endArrowhead: this.endArrowhead,
      },
    }
  }

  /**
   * Render arrowhead on preview overlay
   */
  protected override renderAdditionalOverlay(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ): void {
    const size = this.defaultStrokeWidth * 4
    ctx.fillStyle = this.defaultStroke
    this.drawArrowhead(ctx, start, end, size)
  }

  /**
   * Draw arrowhead at the end point
   */
  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    size: number
  ): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const headAngle = Math.PI / 6 // 30 degrees

    ctx.beginPath()
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(
      to.x - size * Math.cos(angle - headAngle),
      to.y - size * Math.sin(angle - headAngle)
    )
    ctx.lineTo(
      to.x - size * Math.cos(angle + headAngle),
      to.y - size * Math.sin(angle + headAngle)
    )
    ctx.closePath()
    ctx.fill()
  }
}

export const arrowTool = new ArrowTool()
