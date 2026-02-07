import { useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore, useWhiteboardContext } from '../context'
import { screenToCanvas, getVisibleBounds, expandBounds, boundsIntersect } from '../utils/canvas'
import { handleImagePaste } from '../core/store/imagePasteActions'
import { getShapeAtPoint } from '../utils/hitTest'
import { useDualCanvasSetup } from '../hooks/useDualCanvasSetup'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useTouchGestures } from '../hooks/useTouchGestures'
import { useTools } from '../hooks/useTools'
import { resolveTheme } from '../types/theme'
import type { ThemeColors } from '../types/theme'
import type { Point } from '../types'

/** Event data passed to the onContextMenu callback */
export interface CanvasContextMenuEvent {
  /** Screen-space position (use for menu placement) */
  screenPoint: Point
  /** Canvas-space position */
  canvasPoint: Point
  /** Shape under the cursor, or null if empty space */
  shapeId: string | null
}

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
  /** Called on right-click. Prevents browser context menu automatically. */
  onContextMenu?: (event: CanvasContextMenuEvent) => void
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  overflow: 'hidden',
  touchAction: 'none',
}

const canvasBaseStyle: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  top: 0, left: 0,
}

const textOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
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
  onContextMenu,
}: CanvasProps) {
  const resolvedBg = backgroundColor ?? theme?.canvasBackground ?? '#fafafa'

  // ── Dual canvas setup (static + interactive) ──────────────────────
  const {
    staticCanvasRef, interactiveCanvasRef, containerRef,
    staticRendererRef, interactiveRendererRef, setupCanvases,
  } = useDualCanvasSetup({ onReady })

  const textOverlayRef = useRef<HTMLDivElement>(null)
  const renderFnRef = useRef<(() => void) | null>(null)
  const { store, toolManager, shapeRendererRegistry } = useWhiteboardContext()

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

  // ── Refs for render data (avoid stale closures in render fns) ─────
  const shapesRef = useRef(shapes)
  const shapeIdsRef = useRef(shapeIds)
  shapesRef.current = shapes
  shapeIdsRef.current = shapeIds

  const hadTransientRef = useRef(false)
  const staticRafRef = useRef(0)
  const renderStaticRef = useRef<(() => void) | null>(null)
  const renderInteractiveRef = useRef<(() => void) | null>(null)

  // ── Wire shape renderer registry to both renderers ────────────────
  useEffect(() => {
    staticRendererRef.current?.setRegistry(shapeRendererRegistry)
    interactiveRendererRef.current?.setRegistry(shapeRendererRegistry)
  }, [shapeRendererRegistry, staticRendererRef, interactiveRendererRef])

  // ── Sync theme to both renderers + tool manager ───────────────────
  useEffect(() => {
    if (theme) {
      const resolved = resolveTheme(theme)
      staticRendererRef.current?.setTheme(resolved)
      interactiveRendererRef.current?.setTheme(resolved)
      toolManager.setTheme(resolved)
    }
  }, [theme, toolManager, staticRendererRef, interactiveRendererRef])

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useKeyboardShortcuts({
    shapes, shapeIds, selectedIds,
    undo, redo, deleteShapes, clearSelection, selectMultiple,
    updateShape, recordBatchUpdate,
    copySelectedShapes, cutSelectedShapes, pasteShapes, duplicateSelectedShapes,
    bringToFront, sendToBack, bringForward, sendBackward,
    lockSelectedShapes, unlockSelectedShapes,
    groupSelectedShapes, ungroupSelectedShapes,
    setTool, readOnly,
  })

  // ── Image paste handler (clipboard event, disabled in readOnly) ───
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

  // ── Tool system (pointer events bound to interactive canvas) ──────
  const {
    handlePointerDown, handlePointerMove, handlePointerUp,
    handleDoubleClick, renderOverlay, cursorStyle,
    setTextOverlayContainer, isPanningRef,
  } = useTools({ containerRef, canvasRef: interactiveCanvasRef, renderFnRef, readOnly })

  // ── Touch gestures (pinch zoom, two-finger pan) ──────────────────
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    containerRef, viewport, pan, zoom,
  })

  // ── Text overlay setup (disabled in readOnly) ────────────────────
  useEffect(() => {
    if (readOnly) return
    setTextOverlayContainer(textOverlayRef.current)
    return () => setTextOverlayContainer(null)
  }, [setTextOverlayContainer, readOnly])

  // ── Static render: background, grid, committed shapes ────────────
  const renderStatic = useCallback(() => {
    const canvas = staticCanvasRef.current
    const container = containerRef.current
    const renderer = staticRendererRef.current
    if (!canvas || !container || !renderer) return

    const rect = container.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const curShapes = shapesRef.current
    const curShapeIds = shapeIdsRef.current
    const transientIds = toolManager.getTransientShapeIds()

    renderer.clear(rect.width, rect.height)
    ctx.save()
    ctx.fillStyle = resolvedBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    if (showGrid) {
      renderer.drawGrid(viewport, rect.width, rect.height, gridSize)
    }

    renderer.applyViewport(viewport)
    const visibleBounds = getVisibleBounds(viewport, rect.width, rect.height)
    const cullingBounds = expandBounds(visibleBounds, 100 / viewport.zoom)

    for (const id of curShapeIds) {
      if (transientIds.has(id)) continue
      const shape = curShapes.get(id)
      if (shape && boundsIntersect(shape, cullingBounds)) {
        renderer.drawShape(shape, false, curShapes, true)
      }
    }
    renderer.resetTransform()
  }, [viewport, showGrid, gridSize, resolvedBg, staticCanvasRef, containerRef, staticRendererRef, toolManager])

  // ── Interactive render: selection UI, transient shapes, overlays ──
  const renderInteractive = useCallback(() => {
    const canvas = interactiveCanvasRef.current
    const container = containerRef.current
    const renderer = interactiveRendererRef.current
    if (!canvas || !container || !renderer) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const curShapes = shapesRef.current
    const transientIds = toolManager.getTransientShapeIds()

    // Detect drag-end: transient set was populated, now empty -> sync static canvas
    if (hadTransientRef.current && transientIds.size === 0) {
      cancelAnimationFrame(staticRafRef.current)
      staticRafRef.current = requestAnimationFrame(() => renderStaticRef.current?.())
    }
    hadTransientRef.current = transientIds.size > 0

    const rect = container.getBoundingClientRect()
    renderer.clear(rect.width, rect.height)
    renderer.applyViewport(viewport)

    // Draw transient shapes (being moved/resized/rotated) with selection
    for (const id of transientIds) {
      const shape = curShapes.get(id)
      if (shape) renderer.drawShape(shape, selectedIds.has(id), curShapes)
    }

    // Draw selection outlines for non-transient selected shapes
    for (const id of selectedIds) {
      if (transientIds.has(id)) continue
      const shape = curShapes.get(id)
      if (shape) renderer.drawSelectionForShape(shape)
    }

    renderOverlay(ctx)
    renderer.resetTransform()
  }, [selectedIds, viewport, renderOverlay, interactiveCanvasRef, containerRef, interactiveRendererRef, toolManager])

  // ── Keep render refs current (StrictMode safe) ────────────────────
  useEffect(() => {
    renderStaticRef.current = renderStatic
    renderInteractiveRef.current = renderInteractive
    renderFnRef.current = renderInteractive
  }, [renderStatic, renderInteractive])

  // ── Reactive static rendering (viewport/grid/bg changes) ─────────
  useEffect(() => {
    const raf = requestAnimationFrame(renderStatic)
    return () => cancelAnimationFrame(raf)
  }, [renderStatic])

  // ── Re-render when shapes change outside drag ─────────────────────
  // Note: on drag-end, renderInteractive also schedules a static re-render
  // (via hadTransientRef detection). Both paths use staticRafRef so the last
  // one wins via cancelAnimationFrame — no double-render occurs.
  useEffect(() => {
    if (!toolManager.isDragging()) {
      cancelAnimationFrame(staticRafRef.current)
      staticRafRef.current = requestAnimationFrame(() => {
        renderStaticRef.current?.()
        renderInteractiveRef.current?.()
      })
    }
  }, [shapes, shapeIds, toolManager])

  // ── Reactive interactive rendering (selection/overlay changes) ────
  useEffect(() => {
    const raf = requestAnimationFrame(renderInteractive)
    return () => cancelAnimationFrame(raf)
  }, [renderInteractive])

  // ── Initial render after canvas setup ─────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => {
      renderStaticRef.current?.()
      renderInteractiveRef.current?.()
    })
  }, [setupCanvases])

  // ── Wheel zoom (bound to interactive canvas, passive: false) ──────
  useEffect(() => {
    const canvas = interactiveCanvasRef.current
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
  }, [interactiveCanvasRef, containerRef, viewport, zoom])

  // ── Context menu (right-click) ────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!onContextMenu) return
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const screenPoint: Point = { x: e.clientX, y: e.clientY }
      const canvasPoint = screenToCanvas(screenPoint, viewport, rect)
      const hitShape = getShapeAtPoint(canvasPoint, shapes, shapeIds, 2, shapeRendererRegistry)
      if (hitShape && !selectedIds.has(hitShape.id)) {
        store.getState().select(hitShape.id)
      }
      onContextMenu({ screenPoint, canvasPoint, shapeId: hitShape?.id ?? null })
    },
    [onContextMenu, containerRef, viewport, shapes, shapeIds, selectedIds, store, shapeRendererRegistry],
  )

  // ── JSX ───────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <canvas ref={staticCanvasRef} style={canvasBaseStyle} />
      <canvas
        ref={interactiveCanvasRef}
        role="application"
        aria-label="Whiteboard canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          ...canvasBaseStyle,
          cursor: isPanning || isPanningRef.current ? 'grabbing' : cursorStyle,
        }}
      />
      {!readOnly && <div ref={textOverlayRef} style={textOverlayStyle} />}
    </div>
  )
}
