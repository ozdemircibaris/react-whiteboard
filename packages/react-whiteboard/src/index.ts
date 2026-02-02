/**
 * @ozdemircibaris/react-whiteboard
 *
 * A high-performance whiteboard library for React with Canvas rendering
 * and React component support.
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Geometry
  Point,
  Size,
  Bounds,
  Transform,

  // Viewport
  Viewport,
  ViewportBounds,

  // Shapes
  FillStyle,
  StrokeStyle,
  ShapeType,
  BaseShape,
  RectangleShape,
  EllipseShape,
  LineShape,
  ArrowShape,
  TextFontFamily,
  TextShapeProps,
  TextShape,
  PathPoint,
  PathShape,
  ImageShape,
  GroupShape,
  ReactComponentShape,
  Shape,

  // Tools
  ToolType,
  Tool,

  // Selection
  Selection,

  // History
  HistoryAction,
  HistoryEntry,

  // Store
  WhiteboardState,

  // Events
  PointerState,
  WhiteboardEvent,

  // Config
  WhiteboardConfig,
} from './types'

// ============================================================================
// Context (provider + hooks)
// ============================================================================

export {
  WhiteboardProvider,
  useWhiteboardStore,
  useToolManager,
} from './context'
export type { WhiteboardProviderProps } from './context'

// ============================================================================
// Core
// ============================================================================

export { createWhiteboardStore, CanvasRenderer } from './core'
export type { WhiteboardStore } from './core'
export { MIN_ZOOM, MAX_ZOOM } from './core/store/viewportActions'

// ============================================================================
// Components
// ============================================================================

export { Canvas, Minimap, Whiteboard } from './components'
export type { CanvasProps, MinimapProps, WhiteboardProps } from './components'

// ============================================================================
// Hooks
// ============================================================================

export {
  useCanvasSetup,
  useKeyboardShortcuts,
  useTouchGestures,
  useTools,
  useTextProperties,
  useShapeProperties,
} from './hooks'

// ============================================================================
// Tools (advanced — custom tool API)
// ============================================================================

export { ToolManager } from './tools'
export type {
  ITool,
  ToolEventContext,
  ToolState,
  ToolProvider,
  ToolConfig,
} from './tools'
export { TOOL_CURSORS } from './tools'

// ============================================================================
// Utils — Serialization
// ============================================================================

export {
  serializeDocument,
  exportToJSON,
  parseDocument,
  documentToStoreData,
  downloadFile,
  pickAndReadFile,
} from './utils/serialization'
export type { WhiteboardDocument } from './utils/serialization'

// ============================================================================
// Utils — PNG Export
// ============================================================================

export { exportToPng, downloadPng } from './utils/exportPng'
export type { ExportPngOptions } from './utils/exportPng'

// ============================================================================
// Utils — Fonts
// ============================================================================

export {
  FONT_FAMILIES,
  FONT_SIZE_PRESETS,
  DEFAULT_TEXT_PROPS,
  DEFAULT_TEXT_MAX_WIDTH,
  resolveFont,
  loadFonts,
  measureTextLines,
  wrapTextLines,
} from './utils/fonts'
export type { FontSizePreset } from './utils/fonts'

// ============================================================================
// Utils — Coordinates & Geometry
// ============================================================================

export {
  screenToCanvas,
  canvasToScreen,
  getVisibleBounds,
  boundsIntersect,
  expandBounds,
  getBoundsCenter,
  isPointInBounds,
  distance,
  angle,
  clamp,
  lerp,
  lerpPoint,
} from './utils/canvas'

// ============================================================================
// Utils — Hit Testing
// ============================================================================

export {
  getShapeBounds,
  getShapeAtPoint,
  getShapesAtPoint,
  getShapesInBounds,
  getSelectionBounds,
} from './utils/hitTest'

// ============================================================================
// Utils — Snapping
// ============================================================================

export { snapToGrid, snapToShapes } from './utils/snapping'
export type { SnapLine, SnapResult } from './utils/snapping'
