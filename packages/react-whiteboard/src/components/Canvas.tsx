import { useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore, useWhiteboardContext } from '../context'
import { screenToCanvas, getVisibleBounds, expandBounds, boundsIntersect } from '../utils/canvas'
import { handleImagePaste } from '../core/store/imagePasteActions'
import { useCanvasSetup } from '../hooks/useCanvasSetup'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useTouchGestures } from '../hooks/useTouchGestures'
import { useTools } from '../hooks/useTools'
import { resolveTheme } from '../types/theme'
import type { ThemeColors } from '../types/theme'

export interface CanvasProps {
  /** Show grid */
  showGrid?: boolean
  /** Grid size in pixels */
  gridSize?: number
  /** Background color */
  backgroundColor?: string
  /** Class name for the canvas container */
  className?: string
  /** Called when canvas is ready */
  onReady?: () => void
  /** Read-only mode — disables editing, allows pan/zoom */
  readOnly?: boolean
  /** Theme colors for canvas rendering (grid, selection, etc.) */
  theme?: Partial<ThemeColors>
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  touchAction: 'none',
}

const textOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
}

export function Canvas({
  showGrid = true,
  gridSize = 20,
  backgroundColor,
  className = '',
  onReady,
  readOnly = false,
  theme,
}: CanvasProps) {
  const resolvedBg = backgroundColor ?? theme?.canvasBackground ?? '#fafafa'
  // ── Canvas setup (init + resize) ──────────────────────────────────
  const { canvasRef, containerRef, rendererRef, setupCanvas } = useCanvasSetup({ onReady })
  const textOverlayRef = useRef<HTMLDivElement>(null)
  const renderFnRef = useRef<(() => void) | null>(null)
  const { store, toolManager } = useWhiteboardContext()

  // ── Store selectors (render dependencies) ─────────────────────────
  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const isPanning = useWhiteboardStore((s) => s.isPanning)

  // Store actions (for hooks)
  const pan = useWhiteboardStore((s) => s.pan)
  const zoom = useWhiteboardStore((s) => s.zoom)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const deleteShapes = useWhiteboardStore((s) => s.deleteShapes)
  const clearSelection = useWhiteboardStore((s) => s.clearSelection)
  const selectMultiple = useWhiteboardStore((s) => s.selectMultiple)
  const updateShape = useWhiteboardStore((s) => s.updateShape)
  const recordBatchUpdate = useWhiteboardStore((s) => s.recordBatchUpdate)
  const copySelectedShapes = useWhiteboardStore((s) => s.copySelectedShapes)
  const cutSelectedShapes = useWhiteboardStore((s) => s.cutSelectedShapes)
  const pasteShapes = useWhiteboardStore((s) => s.pasteShapes)
  const duplicateSelectedShapes = useWhiteboardStore((s) => s.duplicateSelectedShapes)
  const bringToFront = useWhiteboardStore((s) => s.bringToFront)
  const sendToBack = useWhiteboardStore((s) => s.sendToBack)
  const bringForward = useWhiteboardStore((s) => s.bringForward)
  const sendBackward = useWhiteboardStore((s) => s.sendBackward)
  const lockSelectedShapes = useWhiteboardStore((s) => s.lockSelectedShapes)
  const unlockSelectedShapes = useWhiteboardStore((s) => s.unlockSelectedShapes)
  const groupSelectedShapes = useWhiteboardStore((s) => s.groupSelectedShapes)
  const ungroupSelectedShapes = useWhiteboardStore((s) => s.ungroupSelectedShapes)
  const setTool = useWhiteboardStore((s) => s.setTool)

  // ── Sync theme to renderer + tool manager ────────────────────────
  useEffect(() => {
    if (theme) {
      const resolved = resolveTheme(theme)
      rendererRef.current?.setTheme(resolved)
      toolManager.setTheme(resolved)
    }
  }, [theme, toolManager, rendererRef])

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useKeyboardShortcuts({
    shapes,
    shapeIds,
    selectedIds,
    undo,
    redo,
    deleteShapes,
    clearSelection,
    selectMultiple,
    updateShape,
    recordBatchUpdate,
    copySelectedShapes,
    cutSelectedShapes,
    pasteShapes,
    duplicateSelectedShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    lockSelectedShapes,
    unlockSelectedShapes,
    groupSelectedShapes,
    ungroupSelectedShapes,
    setTool,
    readOnly,
  })

  // ── Image paste handler (clipboard event, disabled in readOnly) ──
  useEffect(() => {
    if (readOnly) return

    const onPaste = (e: ClipboardEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      handleImagePaste(e, store.getState(), viewport, rect.width, rect.height)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [readOnly, viewport, containerRef])

  // ── Tool system (pointer events, overlay, cursor) ─────────────────
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    renderOverlay,
    cursorStyle,
    setTextOverlayContainer,
    isPanningRef,
  } = useTools({ containerRef, canvasRef, renderFnRef, readOnly })

  // ── Touch gestures (pinch zoom, two-finger pan) ───────────────────
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    containerRef,
    viewport,
    pan,
    zoom,
  })

  // ── Text overlay setup (disabled in readOnly) ────────────────────
  useEffect(() => {
    if (readOnly) return
    setTextOverlayContainer(textOverlayRef.current)
    return () => setTextOverlayContainer(null)
  }, [setTextOverlayContainer, readOnly])

  // ── Render function ───────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const renderer = rendererRef.current
    if (!canvas || !container || !renderer) return

    const rect = container.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and fill background
    renderer.clear(rect.width, rect.height)
    ctx.save()
    ctx.fillStyle = resolvedBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Grid
    if (showGrid) {
      renderer.drawGrid(viewport, rect.width, rect.height, gridSize)
    }

    // Draw shapes in z-order (with viewport culling)
    renderer.applyViewport(viewport)
    const visibleBounds = getVisibleBounds(viewport, rect.width, rect.height)
    const cullingBounds = expandBounds(visibleBounds, 100 / viewport.zoom)
    for (const id of shapeIds) {
      const shape = shapes.get(id)
      if (shape && boundsIntersect(shape, cullingBounds)) {
        renderer.drawShape(shape, selectedIds.has(id), shapes)
      }
    }

    // Tool overlay (preview shapes while drawing)
    renderOverlay(ctx)

    renderer.resetTransform()
  }, [shapes, shapeIds, viewport, selectedIds, showGrid, gridSize, resolvedBg, renderOverlay, canvasRef, containerRef, rendererRef])

  // Keep renderFnRef updated (in useEffect, not component body — StrictMode safe)
  useEffect(() => {
    renderFnRef.current = render
  }, [render])

  // ── Reactive rendering (re-render when state changes) ─────────────
  useEffect(() => {
    const raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [render])

  // ── Initial render after canvas setup ─────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => renderFnRef.current?.())
  }, [setupCanvas])

  // ── Wheel zoom (needs passive: false for preventDefault) ──────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const center = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)
      zoom(-e.deltaY * 0.001, center)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [canvasRef, containerRef, viewport, zoom])

  // ── JSX ───────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Whiteboard canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          display: 'block',
          cursor: isPanning || isPanningRef.current ? 'grabbing' : cursorStyle,
        }}
      />
      {!readOnly && <div ref={textOverlayRef} style={textOverlayStyle} />}
    </div>
  )
}
