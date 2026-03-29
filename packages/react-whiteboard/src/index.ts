/**
 * @ozdemircibaris/react-whiteboard
 *
 * A high-performance whiteboard library for React with Canvas rendering
 * and React component support.
 *
 * @packageDocumentation
 */

// ============================================================================
// Types & Interfaces
// All exported types are part of the stable public API.
// ============================================================================

/** @public */
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

  // Theme
  ThemeColors,
} from './types'

// ============================================================================
// Theme Constants
// ============================================================================

/** @public */
export { LIGHT_THEME, DARK_THEME, resolveTheme } from './types'

// ============================================================================
// Components
// Primary building blocks for rendering whiteboards.
// ============================================================================

/** @public */
export { Canvas, Minimap, Whiteboard, WhiteboardErrorBoundary } from './components'
/** @public */
export type { CanvasProps, CanvasContextMenuEvent, MinimapProps, WhiteboardProps, WhiteboardErrorBoundaryProps } from './components'

// ============================================================================
// Context Provider & Hooks
// WhiteboardProvider creates an isolated store; hooks access it.
// ============================================================================

/** @public */
export {
  WhiteboardProvider,
  useWhiteboardStore,
  useToolManager,
  useShapeRendererRegistry,
} from './context'
/** @public */
export type { WhiteboardProviderProps } from './context'

// ============================================================================
// Hooks
// Composable hooks for tools, events, input, and rendering.
// ============================================================================

/** @public */
export {
  useDualCanvasSetup,
  useKeyboardShortcuts,
  useTouchGestures,
  useTools,
  useTextProperties,
  useShapeProperties,
  useWhiteboardEvents,
} from './hooks'
/** @public */
export type { WhiteboardEventCallbacks } from './hooks'

// ============================================================================
// Store & Constants
// WhiteboardStore interface and zoom limit constants.
// ============================================================================

/** @public */
export type { WhiteboardStore } from './core'
/** @public */
export { MIN_ZOOM, MAX_ZOOM } from './core/store/viewportActions'

// ============================================================================
// Core Internals (advanced / escape-hatch)
// createWhiteboardStore and CanvasRenderer are exported for advanced use
// cases but are not covered by semver guarantees.
// ============================================================================

/** @internal */
export { createWhiteboardStore, CanvasRenderer } from './core'

// ============================================================================
// Custom Shape Renderer Registry
// Register custom shape types with canvas draw, hit-test, and SVG export.
// ============================================================================

/** @public */
export { ShapeRendererRegistry } from './core'
/** @public */
export type {
  CustomShapeRenderer,
  CustomShapeDrawContext,
  CustomShapeSvgContext,
} from './core'

// ============================================================================
// Tool System (custom tool API)
// ============================================================================

/** @public */
export { ToolManager } from './tools'
/** @public */
export type {
  ITool,
  ToolEventContext,
  ToolState,
  ToolProvider,
  ToolConfig,
} from './tools'
/** @public */
export { TOOL_CURSORS } from './tools'

// ============================================================================
// Persistence
// ============================================================================

/** @public */
export type { PersistenceAdapter, LocalStorageAdapterOptions } from './persistence'
/** @public */
export { LocalStorageAdapter } from './persistence'

// ============================================================================
// Serialization Utilities
// ============================================================================

/** @public */
export {
  serializeDocument,
  exportToJSON,
  parseDocument,
  documentToStoreData,
  downloadFile,
  pickAndReadFile,
} from './utils/serialization'
/** @public */
export type { WhiteboardDocument } from './utils/serialization'

// ============================================================================
// Export Utilities (PNG, SVG)
// ============================================================================

/** @public */
export { exportToPng, downloadPng } from './utils/exportPng'
/** @public */
export type { ExportPngOptions } from './utils/exportPng'
/** @public */
export { exportToSvg, downloadSvg } from './utils/exportSvg'
/** @public */
export type { ExportSvgOptions } from './utils/exportSvg'
/** @public */
export { clearImageCache } from './core/renderer/imageRenderer'

// ============================================================================
// Image Blob Store
// Efficient in-memory blob storage for image shape data.
// ============================================================================

/** @public */
export {
  storeBlobAsUrl,
  isBlobUrl,
  dataUrlToBlobUrl,
  blobUrlToDataUrl,
  clearBlobStore,
} from './utils/imageBlobStore'

// ============================================================================
// Font Utilities
// ============================================================================

/** @public */
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
/** @public */
export type { FontSizePreset } from './utils/fonts'

// ============================================================================
// Coordinate & Geometry Utilities
// ============================================================================

/** @public */
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
// Hit Testing Utilities
// ============================================================================

/** @public */
export {
  getShapeBounds,
  getShapeAtPoint,
  getShapesAtPoint,
  getShapesInBounds,
  getSelectionBounds,
} from './utils/hitTest'

// ============================================================================
// Snapping Utilities
// ============================================================================

/** @public */
export { snapToGrid, snapToShapes } from './utils/snapping'
/** @public */
export type { SnapLine, SnapResult } from './utils/snapping'

// ============================================================================
// Shape Bounds
// ============================================================================

/** @public */
export { getShapesBounds } from './utils/shapeBounds'
/** @public */
export type { ShapesBounds } from './utils/shapeBounds'
