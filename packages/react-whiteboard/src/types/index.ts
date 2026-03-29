/**
 * Core types for the whiteboard library
 */

export type { ThemeColors } from './theme'
export { LIGHT_THEME, DARK_THEME, resolveTheme } from './theme'

// ============================================================================
// Geometry Types
// ============================================================================

/**
 * A 2D point with x and y coordinates.
 * @public
 */
export interface Point {
  x: number
  y: number
}

/**
 * Width and height dimensions.
 * @public
 */
export interface Size {
  width: number
  height: number
}

/**
 * Axis-aligned bounding box with position and size.
 * @public
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 2D transform with position, rotation, and scale.
 * @public
 */
export interface Transform {
  x: number
  y: number
  rotation: number
  scale: number
}

// ============================================================================
// Viewport Types
// ============================================================================

/**
 * Camera viewport state: pan offset and zoom level.
 * @public
 */
export interface Viewport {
  /** Pan offset X */
  x: number
  /** Pan offset Y */
  y: number
  /** Zoom level (1 = 100%) */
  zoom: number
}

/**
 * Min/max extent of the visible viewport area in canvas coordinates.
 * @public
 */
export interface ViewportBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

// ============================================================================
// Shape Types
// ============================================================================

// ============================================================================
// Style Types
// ============================================================================

/**
 * Fill style — maps to RoughJS fillStyle option.
 * @public
 */
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'dots'

/**
 * Stroke style — solid, dashed, or dotted.
 * @public
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'

/**
 * Discriminated union of built-in shape type strings, extensible via `string`.
 * @public
 */
export type ShapeType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'path'
  | 'image'
  | 'group'
  | 'react-component'
  | string // Allow custom shape types

/**
 * Common properties shared by all shape types.
 * @public
 */
export interface BaseShape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  isLocked: boolean
  parentId: string | null
  meta?: Record<string, unknown>
  /** Deterministic randomization seed for consistent hand-drawn rendering */
  seed: number
  /** Sketchiness level: 0 = clean, 1 = normal, 2 = very sketchy */
  roughness: number
}

/** @public */
export interface RectangleShape extends BaseShape {
  type: 'rectangle'
  props: {
    fill: string
    fillStyle: FillStyle
    stroke: string
    strokeWidth: number
    strokeStyle: StrokeStyle
    cornerRadius: number
    boundTextId?: string | null
  }
}

/** @public */
export interface EllipseShape extends BaseShape {
  type: 'ellipse'
  props: {
    fill: string
    fillStyle: FillStyle
    stroke: string
    strokeWidth: number
    strokeStyle: StrokeStyle
    boundTextId?: string | null
  }
}

/** @public */
export interface LineShape extends BaseShape {
  type: 'line'
  props: {
    stroke: string
    strokeWidth: number
    strokeStyle: StrokeStyle
    points: Point[]
  }
}

/** @public */
export interface ArrowShape extends BaseShape {
  type: 'arrow'
  props: {
    stroke: string
    strokeWidth: number
    strokeStyle: StrokeStyle
    start: Point
    end: Point
    startArrowhead: 'none' | 'arrow' | 'triangle'
    endArrowhead: 'none' | 'arrow' | 'triangle'
  }
}

/** @public */
export type TextFontFamily = 'hand' | 'sans' | 'serif' | 'mono'

/** @public */
export interface TextShapeProps {
  text: string
  fontSize: number
  fontFamily: TextFontFamily
  fontWeight: number
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor: string
  align: 'left' | 'center' | 'right'
  lineHeight: number
}

/** @public */
export interface TextShape extends BaseShape {
  type: 'text'
  props: TextShapeProps
}

/** @public */
export interface PathPoint {
  x: number
  y: number
  /** Pen pressure (0-1). Defaults to 0.5 when not available */
  pressure?: number
}

/** @public */
export interface PathShape extends BaseShape {
  type: 'path'
  props: {
    stroke: string
    strokeWidth: number
    strokeStyle: StrokeStyle
    points: PathPoint[]
    isComplete: boolean
  }
}

/** @public */
export interface ImageShape extends BaseShape {
  type: 'image'
  props: {
    src: string
    naturalWidth: number
    naturalHeight: number
  }
}

/** @public */
export interface GroupShape extends BaseShape {
  type: 'group'
  props: {
    childIds: string[]
  }
}

/** @public */
export interface ReactComponentShape extends BaseShape {
  type: 'react-component'
  props: {
    componentType: string
    componentProps: Record<string, unknown>
  }
}

/**
 * Discriminated union of all built-in shape types.
 * @public
 */
export type Shape =
  | RectangleShape
  | EllipseShape
  | LineShape
  | ArrowShape
  | TextShape
  | PathShape
  | ImageShape
  | GroupShape
  | ReactComponentShape

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Discriminated union of built-in tool type strings, extensible via `string`.
 * @public
 */
export type ToolType =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'draw'
  | 'text'
  | 'eraser'
  | 'hand'
  | string // Allow custom tools

/** @public */
export interface Tool {
  type: ToolType
  cursor: string
}

// ============================================================================
// Selection Types
// ============================================================================

/** @public */
export interface Selection {
  shapeIds: string[]
  bounds: Bounds | null
}

// ============================================================================
// History Types
// ============================================================================

/** @public */
export type HistoryAction =
  | { type: 'create'; shapes: Shape[] }
  | { type: 'update'; before: Shape[]; after: Shape[] }
  | { type: 'delete'; shapes: Shape[] }
  | { type: 'reorder'; previousShapeIds: string[]; newShapeIds: string[] }

/** @public */
export interface HistoryEntry {
  id: string
  timestamp: number
  action: HistoryAction
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Read-only snapshot of the whiteboard store state.
 * @public
 */
export interface WhiteboardState {
  // Shapes
  shapes: Map<string, Shape>
  shapeIds: string[] // Ordered array for z-index

  // Viewport
  viewport: Viewport

  // Selection
  selectedIds: Set<string>

  // Tools
  currentTool: ToolType

  // History
  history: HistoryEntry[]
  historyIndex: number

  // UI State
  isDrawing: boolean
  isPanning: boolean
}

// ============================================================================
// Event Types
// ============================================================================

/** @public */
export interface PointerState {
  isDown: boolean
  startPoint: Point | null
  currentPoint: Point | null
  button: number
  pressure: number
}

/** @public */
export interface WhiteboardEvent {
  point: Point
  canvasPoint: Point
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

// ============================================================================
// Config Types
// ============================================================================

/**
 * Configuration options for whiteboard behavior.
 * @public
 */
export interface WhiteboardConfig {
  /** Initial viewport */
  initialViewport?: Partial<Viewport>

  /** Minimum zoom level */
  minZoom?: number

  /** Maximum zoom level */
  maxZoom?: number

  /** Grid size for snapping (0 = disabled) */
  gridSize?: number

  /** Enable touch support */
  enableTouch?: boolean

  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean

  /** Snap shapes to grid when moving/creating */
  snapToGrid?: boolean

  /** Snap shapes to other shape edges/centers (smart guides) */
  snapToShapes?: boolean
}
