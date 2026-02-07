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
    staticRendererRef, interactiveRendererRef, setupVersion,
  } = useDualCanvasSetup({ onReady, theme })

  const textOverlayRef = useRef<HTMLDivElement>(null)
  const renderFnRef = useRef<(() => void) | null>(null)
  const { store, toolManager, shapeRendererRegistry } = useWhiteboardContext()

  // ── Store selectors (minimal — only values that drive React rendering) ──
  const viewport = useWhiteboardStore((s) => s.viewport)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const isPanning = useWhiteboardStore((s) => s.isPanning)
  const pan = useWhiteboardStore((s) => s.pan)
  const zoom = useWhiteboardStore((s) => s.zoom)

  // ── Refs for render data (updated outside React render cycle) ─────
  // shapes/shapeIds are synced via store.subscribe below — NOT via React
  // subscriptions — to avoid component re-renders during drag operations.
  const shapesRef = useRef(store.getState().shapes)
  const shapeIdsRef = useRef(store.getState().shapeIds)
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  const hadTransientRef = useRef(false)
  const staticRafRef = useRef(0)
  const renderStaticRef = useRef<(() => void) | null>(null)
  const renderInteractiveRef = useRef<(() => void) | null>(null)

  // ── Sync shapes/shapeIds refs via store subscription (no React re-render) ──
  useEffect(() => {
    const scheduleStaticRender = () => {
      if (!toolManager.isDragging()) {
        cancelAnimationFrame(staticRafRef.current)
        staticRafRef.current = requestAnimationFrame(() => {
          renderStaticRef.current?.()
          renderInteractiveRef.current?.()
        })
      }
    }
    const unsubShapes = store.subscribe(
      (s) => s.shapes,
      (shapes) => { shapesRef.current = shapes; scheduleStaticRender() },
    )
    const unsubIds = store.subscribe(
      (s) => s.shapeIds,
      (ids) => { shapeIdsRef.current = ids; scheduleStaticRender() },
    )
    return () => { unsubShapes(); unsubIds() }
  }, [store, toolManager])

  // ── Wire shape renderer registry to both renderers ────────────────
  useEffect(() => {
    staticRendererRef.current?.setRegistry(shapeRendererRegistry)
    interactiveRendererRef.current?.setRegistry(shapeRendererRegistry)
  }, [shapeRendererRegistry, staticRendererRef, interactiveRendererRef, setupVersion])

  // ── Sync theme to both renderers + tool manager ───────────────────
  // setupVersion ensures this re-fires when renderers are recreated (e.g. on resize)
  useEffect(() => {
    if (theme) {
      const resolved = resolveTheme(theme)
      staticRendererRef.current?.setTheme(resolved)
      interactiveRendererRef.current?.setTheme(resolved)
      toolManager.setTheme(resolved)
    }
  }, [theme, toolManager, staticRendererRef, interactiveRendererRef, setupVersion])

  // ── Keyboard shortcuts (getState is stable — listener registered once) ──
  useKeyboardShortcuts({ getState: store.getState, readOnly })

  // ── Image paste handler (uses viewportRef to avoid re-registration) ──
  useEffect(() => {
    if (readOnly) return
    const onPaste = (e: ClipboardEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      handleImagePaste(e, store.getState(), viewportRef.current, rect.width, rect.height)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [readOnly, containerRef, store])

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

    // Detect drag-start: re-render static canvas to exclude transient shapes (fixes ghost)
    if (!hadTransientRef.current && transientIds.size > 0) {
      cancelAnimationFrame(staticRafRef.current)
      staticRafRef.current = requestAnimationFrame(() => renderStaticRef.current?.())
    }
    // Detect drag-end: re-render static canvas to include all shapes + clear cache
    if (hadTransientRef.current && transientIds.size === 0) {
      cancelAnimationFrame(staticRafRef.current)
      staticRafRef.current = requestAnimationFrame(() => renderStaticRef.current?.())
      renderer.clearDragCache()
    }
    hadTransientRef.current = transientIds.size > 0

    const rect = container.getBoundingClientRect()
    renderer.clear(rect.width, rect.height)
    renderer.applyViewport(viewport)

    // Draw transient shapes using bitmap cache (avoids RoughJS recomputation)
    // Shadow is applied only to the shape bitmaps, not to selection handles
    if (transientIds.size > 0) {
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 3
      for (const id of transientIds) {
        const shape = curShapes.get(id)
        if (shape) renderer.drawShapeCached(shape, false, viewport.zoom, curShapes)
      }
      ctx.restore()
    }

    // Draw selection outlines (both transient and non-transient)
    for (const id of selectedIds) {
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

  // ── Reactive interactive rendering (selection/overlay changes) ────
  useEffect(() => {
    const raf = requestAnimationFrame(renderInteractive)
    return () => cancelAnimationFrame(raf)
  }, [renderInteractive])

  // ── Render after canvas setup (setupVersion bumps when renderers are created) ──
  useEffect(() => {
    requestAnimationFrame(() => {
      renderStaticRef.current?.()
      renderInteractiveRef.current?.()
    })
  }, [setupVersion])

  // ── Wheel zoom (registered once — uses viewportRef for latest state) ──
  useEffect(() => {
    const canvas = interactiveCanvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const center = screenToCanvas({ x: e.clientX, y: e.clientY }, viewportRef.current, rect)
      zoom(-e.deltaY * 0.001, center)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [interactiveCanvasRef, containerRef, zoom])

  // ── Context menu (right-click) ────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!onContextMenu) return
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const screenPoint: Point = { x: e.clientX, y: e.clientY }
      const canvasPoint = screenToCanvas(screenPoint, viewportRef.current, rect)
      const { shapes, shapeIds, selectedIds: sel } = store.getState()
      const hitShape = getShapeAtPoint(canvasPoint, shapes, shapeIds, 2, shapeRendererRegistry)
      if (hitShape && !sel.has(hitShape.id)) {
        store.getState().select(hitShape.id)
      }
      onContextMenu({ screenPoint, canvasPoint, shapeId: hitShape?.id ?? null })
    },
    [onContextMenu, containerRef, store, shapeRendererRegistry],
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
