import type { Point, Shape, ToolType, Viewport } from '../types'
import type { WhiteboardStore } from '../core/store'
import type { ResizeHandle } from '../utils/hitTest'

/**
 * Event context passed to tool handlers
 */
export interface ToolEventContext {
  /** Screen point (relative to canvas element) */
  screenPoint: Point
  /** Canvas point (world coordinates) */
  canvasPoint: Point
  /** Current viewport */
  viewport: Viewport
  /** Keyboard modifiers */
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  /** Pointer button (0 = left, 1 = middle, 2 = right) */
  button: number
  /** Pointer pressure (for pen input) */
  pressure: number
}

/**
 * Result from pointer down handler
 */
export interface PointerDownResult {
  /** Whether the tool handled this event */
  handled: boolean
  /** Whether to capture pointer events */
  capture?: boolean
  /** Cursor to display */
  cursor?: string
}

/**
 * Result from pointer move handler
 */
export interface PointerMoveResult {
  /** Whether the tool handled this event */
  handled: boolean
  /** Cursor to display */
  cursor?: string
}

/**
 * Result from pointer up handler
 */
export interface PointerUpResult {
  /** Whether the tool handled this event */
  handled: boolean
  /** Created shape(s), if any */
  createdShapes?: Shape[]
}

/**
 * Tool state for tracking drag operations
 */
export interface ToolState {
  /** Whether currently in a drag operation */
  isDragging: boolean
  /** Start point of drag (canvas coordinates) */
  dragStart: Point | null
  /** Current point of drag (canvas coordinates) */
  dragCurrent: Point | null
  /** Shape being created/modified */
  activeShapeId: string | null
  /** Resize handle being dragged */
  resizeHandle: ResizeHandle | null
  /** Whether currently rotating */
  isRotating: boolean
  /** Starting positions of selected shapes (for move/resize) */
  startPositions: Map<string, { x: number; y: number; width: number; height: number }>
  /** Starting rotations of selected shapes (for rotation) */
  startRotations: Map<string, number>
}

/**
 * Tool interface - all tools must implement this
 */
export interface ITool {
  /** Tool type identifier */
  readonly type: ToolType
  /** Default cursor for this tool */
  readonly cursor: string
  /** Display name for UI */
  readonly name: string

  /**
   * Called when the tool becomes active
   */
  onActivate?(store: WhiteboardStore): void

  /**
   * Called when the tool becomes inactive
   */
  onDeactivate?(store: WhiteboardStore): void

  /**
   * Handle pointer down event
   */
  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerDownResult

  /**
   * Handle pointer move event
   */
  onPointerMove(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerMoveResult

  /**
   * Handle pointer up event
   */
  onPointerUp(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ): PointerUpResult

  /**
   * Handle double click
   */
  onDoubleClick?(ctx: ToolEventContext, store: WhiteboardStore): void

  /**
   * Handle keyboard events
   */
  onKeyDown?(event: KeyboardEvent, store: WhiteboardStore): boolean

  /**
   * Render tool-specific overlay (e.g., preview shape while drawing)
   */
  renderOverlay?(
    ctx: CanvasRenderingContext2D,
    state: ToolState,
    viewport: Viewport
  ): void
}

/**
 * Tool configuration for registration
 */
export interface ToolConfig {
  type: ToolType
  cursor: string
  name: string
}

/**
 * Minimal interface for accessing tools by type.
 * Used by tools that need to reference other tools (e.g., SelectTool -> TextTool)
 * without importing ToolManager directly (avoids circular dependencies).
 */
export interface ToolProvider {
  getTool(type: ToolType): ITool | undefined
}

/**
 * Tool cursors mapping
 */
export const TOOL_CURSORS: Record<string, string> = {
  select: 'default',
  rectangle: 'crosshair',
  ellipse: 'crosshair',
  line: 'crosshair',
  arrow: 'crosshair',
  draw: 'crosshair',
  text: 'text',
  eraser: 'crosshair',
  hand: 'grab',
}

/**
 * Create initial tool state
 */
export function createToolState(): ToolState {
  return {
    isDragging: false,
    dragStart: null,
    dragCurrent: null,
    activeShapeId: null,
    resizeHandle: null,
    isRotating: false,
    startPositions: new Map(),
    startRotations: new Map(),
  }
}

/**
 * Reset tool state
 */
export function resetToolState(_state: ToolState): ToolState {
  return {
    isDragging: false,
    dragStart: null,
    dragCurrent: null,
    activeShapeId: null,
    resizeHandle: null,
    isRotating: false,
    startPositions: new Map(),
    startRotations: new Map(),
  }
}
