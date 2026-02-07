import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { RoughSVG } from 'roughjs/bin/svg'
import type { Point, Shape } from '../../types'

// ============================================================================
// Custom Shape Renderer Types
// ============================================================================

/**
 * Context provided to custom shape canvas draw functions.
 * Wraps all rendering dependencies into a single discoverable object.
 */
export interface CustomShapeDrawContext {
  /** The 2D canvas rendering context */
  ctx: CanvasRenderingContext2D
  /** RoughJS canvas instance for hand-drawn rendering */
  roughCanvas: RoughCanvas
  /** The shape to render */
  shape: Shape
  /** Whether the shape is currently selected */
  isSelected: boolean
  /** Call with shape bounds to draw the standard selection outline + handles */
  drawSelection: (x: number, y: number, width: number, height: number) => void
  /** All shapes in the document (for referencing related shapes) */
  allShapes: Map<string, Shape>
}

/**
 * Context provided to custom shape SVG render functions.
 */
export interface CustomShapeSvgContext {
  /** RoughJS SVG instance for hand-drawn SVG rendering */
  roughSvg: RoughSVG
  /** The shape to render */
  shape: Shape
  /** All shapes in the document */
  allShapes: Map<string, Shape>
}

/**
 * Registration object for a custom shape renderer.
 *
 * Only `type` and `draw` are required. `hitTest` defaults to bounding-box
 * rectangle test, and `svgRender` defaults to skipping the shape in SVG export.
 */
export interface CustomShapeRenderer {
  /** Shape type string this renderer handles (must match shape.type) */
  type: string
  /** Canvas draw function (required) */
  draw: (context: CustomShapeDrawContext) => void
  /** Hit test function. Defaults to bounding-box rectangle if omitted. */
  hitTest?: (point: Point, shape: Shape, tolerance: number) => boolean
  /** SVG render function. Return null to skip. Defaults to skip if omitted. */
  svgRender?: (context: CustomShapeSvgContext) => SVGGElement | null
}

// ============================================================================
// Registry
// ============================================================================

/**
 * Per-instance registry for custom shape renderers.
 * Created by WhiteboardProvider and shared via context.
 */
export class ShapeRendererRegistry {
  private renderers = new Map<string, CustomShapeRenderer>()

  /** Register a custom shape renderer */
  registerRenderer(renderer: CustomShapeRenderer): void {
    this.renderers.set(renderer.type, renderer)
  }

  /** Unregister a custom shape renderer by type */
  unregisterRenderer(type: string): void {
    this.renderers.delete(type)
  }

  /** Get a registered renderer by shape type */
  getRenderer(type: string): CustomShapeRenderer | undefined {
    return this.renderers.get(type)
  }

  /** Check if a renderer exists for a shape type */
  hasRenderer(type: string): boolean {
    return this.renderers.has(type)
  }
}
