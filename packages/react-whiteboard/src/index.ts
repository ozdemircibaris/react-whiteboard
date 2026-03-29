/**
 * @ozdemircibaris/react-whiteboard
 *
 * A high-performance whiteboard library for React with Canvas rendering
 * and React component support.
 *
 * @packageDocumentation
 */

// ============================================================================
// @public — Types & Interfaces
// All exported types are part of the stable public API.
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

  // Theme
  ThemeColors,
} from './types'

// ============================================================================
// @public — Theme Constants
// ============================================================================

export { LIGHT_THEME, DARK_THEME, resolveTheme } from './types'

// ============================================================================
// @public — Components
// Primary building blocks for rendering whiteboards.
// ============================================================================

export { Canvas, Minimap, Whiteboard, WhiteboardErrorBoundary } from './components'
export type { CanvasProps, CanvasContextMenuEvent, MinimapProps, WhiteboardProps, WhiteboardErrorBoundaryProps } from './components'

// ============================================================================
// @public — Context Provider & Hooks
// WhiteboardProvider creates an isolated store; hooks access it.
// ============================================================================

export {
  WhiteboardProvider,
  useWhiteboardStore,
  useToolManager,
  useShapeRendererRegistry,
} from './context'
export type { WhiteboardProviderProps } from './context'

// ============================================================================
// @public — Hooks
// Composable hooks for tools, events, input, and rendering.
// ============================================================================

export {
  useDualCanvasSetup,
  useKeyboardShortcuts,
  useTouchGestures,
  useTools,
  useTextProperties,
  useShapeProperties,
  useWhiteboardEvents,
} from './hooks'
export type { WhiteboardEventCallbacks } from './hooks'

// ============================================================================
// @public — Store & Constants
// WhiteboardStore interface and zoom limit constants.
// ============================================================================

export type { WhiteboardStore } from './core'
export { MIN_ZOOM, MAX_ZOOM } from './core/store/viewportActions'

// ============================================================================
// @internal — Core Internals (advanced / escape-hatch)
// createWhiteboardStore and CanvasRenderer are exported for advanced use
// cases but are not covered by semver guarantees.
// ============================================================================

export { createWhiteboardStore, CanvasRenderer } from './core'

// ============================================================================
// @public — Custom Shape Renderer Registry
// Register custom shape types with canvas draw, hit-test, and SVG export.
// ============================================================================

export { ShapeRendererRegistry } from './core'
export type {
  CustomShapeRenderer,
  CustomShapeDrawContext,
  CustomShapeSvgContext,
} from './core'

// ============================================================================
// @public — Tool System (custom tool API)
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
// @public — Persistence
// ============================================================================

export type { PersistenceAdapter, LocalStorageAdapterOptions } from './persistence'
export { LocalStorageAdapter } from './persistence'

// ============================================================================
// @public — Serialization Utilities
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
// @public — Export Utilities (PNG, SVG)
// ============================================================================

export { exportToPng, downloadPng } from './utils/exportPng'
export type { ExportPngOptions } from './utils/exportPng'
export { exportToSvg, downloadSvg } from './utils/exportSvg'
export type { ExportSvgOptions } from './utils/exportSvg'
export { clearImageCache } from './core/renderer/imageRenderer'

// ============================================================================
// @public — Image Blob Store
// Efficient in-memory blob storage for image shape data.
// ============================================================================

export {
  storeBlobAsUrl,
  isBlobUrl,
  dataUrlToBlobUrl,
  blobUrlToDataUrl,
  clearBlobStore,
} from './utils/imageBlobStore'

// ============================================================================
// @public — Font Utilities
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
// @public — Coordinate & Geometry Utilities
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
// @public — Hit Testing Utilities
// ============================================================================

export {
  getShapeBounds,
  getShapeAtPoint,
  getShapesAtPoint,
  getShapesInBounds,
  getSelectionBounds,
} from './utils/hitTest'

// ============================================================================
// @public — Snapping Utilities
// ============================================================================

export { snapToGrid, snapToShapes } from './utils/snapping'
export type { SnapLine, SnapResult } from './utils/snapping'

// ============================================================================
// @public — Shape Bounds
// ============================================================================

export { getShapesBounds } from './utils/shapeBounds'
export type { ShapesBounds } from './utils/shapeBounds'
