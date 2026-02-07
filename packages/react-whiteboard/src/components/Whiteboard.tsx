import { useEffect, useRef, type ReactNode } from 'react'
import { WhiteboardProvider, useWhiteboardContext } from '../context'
import { Canvas } from './Canvas'
import { Minimap } from './Minimap'
import { useWhiteboardEvents } from '../hooks/useWhiteboardEvents'
import type { Shape, Viewport } from '../types'
import type { ThemeColors } from '../types/theme'
import type { CustomShapeRenderer } from '../core/renderer/ShapeRendererRegistry'
import type { ITool } from '../tools/types'

// ============================================================================
// Props
// ============================================================================

export interface WhiteboardProps {
  /** Initial data to load on mount */
  initialData?: {
    shapes: Shape[]
    shapeIds: string[]
    viewport?: Viewport
  }

  /** Called when shapes or shape order changes */
  onChange?: (shapes: Map<string, Shape>, shapeIds: string[]) => void

  /** Read-only mode — disables editing, allows pan/zoom */
  readOnly?: boolean

  /** Show grid (default: true) */
  showGrid?: boolean
  /** Grid size in pixels (default: 20) */
  gridSize?: number
  /** Background color (default: '#fafafa') */
  backgroundColor?: string
  /** Class name for the canvas container */
  className?: string
  /** Called when canvas is ready */
  onReady?: () => void

  /** Show minimap. Pass `true` for defaults or an object for custom size. */
  minimap?: boolean | { width?: number; height?: number }

  /** Theme colors for canvas and minimap rendering */
  theme?: Partial<ThemeColors>

  /** Fired when a new shape is added to the canvas */
  onShapeCreate?: (shape: Shape) => void
  /** Fired when an existing shape is modified */
  onShapeUpdate?: (shape: Shape, previous: Shape) => void
  /** Fired when a shape is removed from the canvas */
  onShapeDelete?: (shape: Shape) => void
  /** Fired when the viewport (pan/zoom) changes */
  onViewportChange?: (viewport: Viewport) => void

  /** Custom shape renderers (additive to built-in shapes) */
  customShapes?: CustomShapeRenderer[]
  /** Custom tools (additive to default tools) */
  tools?: ITool[]

  /** Overlay content rendered on top of the canvas (toolbars, panels, etc.) */
  children?: ReactNode
}

// ============================================================================
// Inner component (needs context)
// ============================================================================

function WhiteboardInner({
  initialData,
  onChange,
  readOnly = false,
  showGrid,
  gridSize,
  backgroundColor,
  className,
  onReady,
  minimap,
  theme,
  onShapeCreate,
  onShapeUpdate,
  onShapeDelete,
  onViewportChange,
  children,
}: WhiteboardProps) {
  const { store } = useWhiteboardContext()
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Granular event callbacks
  useWhiteboardEvents({ onShapeCreate, onShapeUpdate, onShapeDelete, onViewportChange })

  // Load initial data on mount (intentionally runs once — initialData is treated like defaultValue)
  const initialDataRef = useRef(initialData)
  useEffect(() => {
    const data = initialDataRef.current
    if (!data) return

    const shapesMap = new Map(data.shapes.map((s) => [s.id, s]))
    const viewport = data.viewport ?? { x: 0, y: 0, zoom: 1 }
    store.getState().loadDocument(shapesMap, data.shapeIds, viewport)
  }, [store])

  // Subscribe to shape changes and fire onChange
  useEffect(() => {
    if (!onChangeRef.current) return

    let prevShapes = store.getState().shapes
    let prevShapeIds = store.getState().shapeIds

    const unsubscribe = store.subscribe((state) => {
      const { shapes, shapeIds } = state
      if (shapes !== prevShapes || shapeIds !== prevShapeIds) {
        prevShapes = shapes
        prevShapeIds = shapeIds
        onChangeRef.current?.(shapes, shapeIds)
      }
    })

    return unsubscribe
  }, [store])

  // Resolve minimap props
  const showMinimap = !!minimap
  const minimapWidth = typeof minimap === 'object' ? minimap.width ?? 200 : 200
  const minimapHeight = typeof minimap === 'object' ? minimap.height ?? 150 : 150

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        readOnly={readOnly}
        showGrid={showGrid}
        gridSize={gridSize}
        backgroundColor={backgroundColor}
        className={className}
        onReady={onReady}
        theme={theme}
      />
      {showMinimap && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
          <Minimap width={minimapWidth} height={minimapHeight} theme={theme} />
        </div>
      )}
      {children}
    </div>
  )
}

// ============================================================================
// Public component
// ============================================================================

/**
 * Drop-in whiteboard component. Wraps `WhiteboardProvider` + `Canvas` with
 * optional minimap, `onChange` callback, `initialData` loading, and `readOnly` mode.
 *
 * For full control, use `<WhiteboardProvider>` + `<Canvas>` directly.
 */
export function Whiteboard(props: WhiteboardProps) {
  return (
    <WhiteboardProvider customShapes={props.customShapes} tools={props.tools}>
      <WhiteboardInner {...props} />
    </WhiteboardProvider>
  )
}
