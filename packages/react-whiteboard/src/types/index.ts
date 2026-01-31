/**
 * Core types for the whiteboard library
 */

// ============================================================================
// Geometry Types
// ============================================================================

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Transform {
  x: number
  y: number
  rotation: number
  scale: number
}

// ============================================================================
// Viewport Types
// ============================================================================

export interface Viewport {
  /** Pan offset X */
  x: number
  /** Pan offset Y */
  y: number
  /** Zoom level (1 = 100%) */
  zoom: number
}

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

/** Fill style — maps to RoughJS fillStyle option */
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'dots'

/** Stroke style — solid, dashed, or dotted */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'

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

export interface LineShape extends BaseShape {
  type: 'line'
  props: {
    stroke: string
    strokeWidth: number
    strokeStyle: StrokeStyle
    points: Point[]
  }
}

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

export type TextFontFamily = 'hand' | 'sans' | 'serif' | 'mono'

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

export interface TextShape extends BaseShape {
  type: 'text'
  props: TextShapeProps
}

export interface PathPoint {
  x: number
  y: number
  /** Pen pressure (0-1). Defaults to 0.5 when not available */
  pressure?: number
}

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

export interface ImageShape extends BaseShape {
  type: 'image'
  props: {
    src: string
    naturalWidth: number
    naturalHeight: number
  }
}

export interface GroupShape extends BaseShape {
  type: 'group'
  props: {
    childIds: string[]
  }
}

export interface ReactComponentShape extends BaseShape {
  type: 'react-component'
  props: {
    componentType: string
    componentProps: Record<string, unknown>
  }
}

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

export interface Tool {
  type: ToolType
  cursor: string
}

// ============================================================================
// Selection Types
// ============================================================================

export interface Selection {
  shapeIds: string[]
  bounds: Bounds | null
}

// ============================================================================
// History Types
// ============================================================================

export type HistoryAction =
  | { type: 'create'; shapes: Shape[] }
  | { type: 'update'; before: Shape[]; after: Shape[] }
  | { type: 'delete'; shapes: Shape[] }
  | { type: 'reorder'; previousShapeIds: string[]; newShapeIds: string[] }

export interface HistoryEntry {
  id: string
  timestamp: number
  action: HistoryAction
}

// ============================================================================
// Store Types
// ============================================================================

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

export interface PointerState {
  isDown: boolean
  startPoint: Point | null
  currentPoint: Point | null
  button: number
  pressure: number
}

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
