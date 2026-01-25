import { useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore } from '../core/store'
import { CanvasRenderer } from '../core/renderer'
import { getDevicePixelRatio, screenToCanvas } from '../utils/canvas'
import type { Point } from '../types'

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
}

export function Canvas({
  showGrid = true,
  gridSize = 20,
  backgroundColor = '#fafafa',
  className = '',
  onReady,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const rafRef = useRef<number>(0)
  const lastPointerRef = useRef<Point | null>(null)
  const renderFnRef = useRef<(() => void) | null>(null)

  // Touch gesture tracking
  const touchesRef = useRef<Map<number, Point>>(new Map())
  const lastPinchDistanceRef = useRef<number | null>(null)
  const lastPinchCenterRef = useRef<Point | null>(null)

  // Store selectors
  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const isPanning = useWhiteboardStore((s) => s.isPanning)

  // Store actions
  const pan = useWhiteboardStore((s) => s.pan)
  const zoom = useWhiteboardStore((s) => s.zoom)
  const setIsPanning = useWhiteboardStore((s) => s.setIsPanning)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const deleteShapes = useWhiteboardStore((s) => s.deleteShapes)
  const clearSelection = useWhiteboardStore((s) => s.clearSelection)
  const selectMultiple = useWhiteboardStore((s) => s.selectMultiple)
  const updateShape = useWhiteboardStore((s) => s.updateShape)

  /**
   * Setup canvas and renderer
   */
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) {
      console.log('[Canvas] setupCanvas: canvas or container is null', { canvas: !!canvas, container: !!container })
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('[Canvas] setupCanvas: ctx is null')
      return
    }

    const dpr = getDevicePixelRatio()
    const rect = container.getBoundingClientRect()

    console.log('[Canvas] setupCanvas called:', {
      containerRect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
      dpr,
      containerStyle: {
        width: container.style.width,
        height: container.style.height,
        position: getComputedStyle(container).position,
        display: getComputedStyle(container).display,
      },
      parentElement: container.parentElement?.tagName,
      parentRect: container.parentElement?.getBoundingClientRect(),
    })

    // Set canvas size with DPI scaling
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    console.log('[Canvas] canvas size set:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasStyleWidth: canvas.style.width,
      canvasStyleHeight: canvas.style.height,
    })

    // Create renderer
    rendererRef.current = new CanvasRenderer(ctx)

    onReady?.()

    // Trigger initial render after setup
    requestAnimationFrame(() => {
      renderFnRef.current?.()
    })
  }, [onReady])

  /**
   * Render frame
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const renderer = rendererRef.current
    if (!canvas || !container || !renderer) return

    const rect = container.getBoundingClientRect()

    // Clear canvas
    renderer.clear(rect.width, rect.height)

    // Draw background
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.save()
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    // Draw grid
    if (showGrid) {
      renderer.drawGrid(viewport, rect.width, rect.height, gridSize)
    }

    // Apply viewport transform and draw shapes
    renderer.applyViewport(viewport)

    // Draw shapes in order
    shapeIds.forEach((id) => {
      const shape = shapes.get(id)
      if (shape) {
        const isSelected = selectedIds.has(id)
        renderer.drawShape(shape, isSelected)
      }
    })

    // Reset transform
    renderer.resetTransform()
  }, [shapes, shapeIds, viewport, selectedIds, showGrid, gridSize, backgroundColor])

  // Keep render function ref up to date
  renderFnRef.current = render

  /**
   * Render when state changes (reactive rendering instead of continuous loop)
   */
  useEffect(() => {
    // Use RAF for smooth rendering, but only when state changes
    rafRef.current = requestAnimationFrame(render)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [render])

  /**
   * Setup canvas on mount and resize using ResizeObserver
   */
  useEffect(() => {
    const container = containerRef.current
    console.log('[Canvas] useEffect mount, container:', !!container)
    if (!container) return

    // Use ResizeObserver to detect when container actually has dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      console.log('[Canvas] ResizeObserver fired:', {
        contentRect: entry?.contentRect,
        width: entry?.contentRect.width,
        height: entry?.contentRect.height,
      })
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setupCanvas()
      }
    })

    resizeObserver.observe(container)

    // Also listen for window resize as fallback
    const handleResize = () => setupCanvas()
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [setupCanvas])

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const moveAmount = e.shiftKey ? 10 : 1 // Shift for larger steps

      // Undo: Cmd/Ctrl+Z
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if ((isMod && e.key === 'z' && e.shiftKey) || (isMod && e.key === 'y')) {
        e.preventDefault()
        redo()
        return
      }

      // Select All: Cmd/Ctrl+A
      if (isMod && e.key === 'a') {
        e.preventDefault()
        selectMultiple(shapeIds)
        return
      }

      // Delete selected: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault()
        deleteShapes(Array.from(selectedIds))
        return
      }

      // Clear selection: Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
        return
      }

      // Move selected shapes with arrow keys
      if (selectedIds.size > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const delta = { x: 0, y: 0 }

        switch (e.key) {
          case 'ArrowUp':
            delta.y = -moveAmount
            break
          case 'ArrowDown':
            delta.y = moveAmount
            break
          case 'ArrowLeft':
            delta.x = -moveAmount
            break
          case 'ArrowRight':
            delta.x = moveAmount
            break
        }

        // Move all selected shapes
        selectedIds.forEach((id) => {
          const shape = shapes.get(id)
          if (shape) {
            updateShape(id, { x: shape.x + delta.x, y: shape.y + delta.y })
          }
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedIds, shapeIds, shapes, deleteShapes, clearSelection, selectMultiple, updateShape])

  /**
   * Handle pointer down
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.setPointerCapture(e.pointerId)
      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      // Middle mouse button or space+click for panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true)
        e.preventDefault()
      }
    },
    [setIsPanning]
  )

  /**
   * Handle pointer move
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!lastPointerRef.current) return

      const currentPoint = { x: e.clientX, y: e.clientY }

      if (isPanning) {
        const deltaX = currentPoint.x - lastPointerRef.current.x
        const deltaY = currentPoint.y - lastPointerRef.current.y
        pan(deltaX, deltaY)
      }

      lastPointerRef.current = currentPoint
    },
    [isPanning, pan]
  )

  /**
   * Handle pointer up
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId)
      }

      lastPointerRef.current = null
      setIsPanning(false)
    },
    [setIsPanning]
  )

  /**
   * Handle wheel for zoom
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const center = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport, rect)

      // Zoom with wheel
      const delta = -e.deltaY * 0.001
      zoom(delta, center)
    },
    [viewport, zoom]
  )

  /**
   * Calculate distance between two points
   */
  const getDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate center point between two points
   */
  const getCenter = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  })

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Store all touch points
    Array.from(e.touches).forEach((touch) => {
      touchesRef.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
    })

    // Initialize pinch tracking if two fingers
    if (e.touches.length === 2) {
      const touch0 = e.touches[0]
      const touch1 = e.touches[1]
      if (!touch0 || !touch1) return

      const t1 = { x: touch0.clientX, y: touch0.clientY }
      const t2 = { x: touch1.clientX, y: touch1.clientY }
      lastPinchDistanceRef.current = getDistance(t1, t2)
      lastPinchCenterRef.current = getCenter(t1, t2)
    }
  }, [])

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      // Two-finger gesture: pinch zoom and pan
      if (e.touches.length === 2) {
        const touch0 = e.touches[0]
        const touch1 = e.touches[1]
        if (!touch0 || !touch1) return

        const t1 = { x: touch0.clientX, y: touch0.clientY }
        const t2 = { x: touch1.clientX, y: touch1.clientY }

        const currentDistance = getDistance(t1, t2)
        const currentCenter = getCenter(t1, t2)

        // Pinch zoom
        if (lastPinchDistanceRef.current !== null) {
          const rect = container.getBoundingClientRect()
          const canvasCenter = screenToCanvas(currentCenter, viewport, rect)

          // Calculate zoom delta from pinch
          const scale = currentDistance / lastPinchDistanceRef.current
          const newZoom = viewport.zoom * scale
          const zoomDelta = newZoom - viewport.zoom

          zoom(zoomDelta, canvasCenter)
        }

        // Two-finger pan
        if (lastPinchCenterRef.current !== null) {
          const deltaX = currentCenter.x - lastPinchCenterRef.current.x
          const deltaY = currentCenter.y - lastPinchCenterRef.current.y
          pan(deltaX, deltaY)
        }

        lastPinchDistanceRef.current = currentDistance
        lastPinchCenterRef.current = currentCenter
      }
      // Single finger: update touch position (for future single-touch interactions)
      else if (e.touches.length === 1) {
        const touch = e.touches[0]
        if (touch) {
          touchesRef.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
        }
      }
    },
    [viewport, zoom, pan]
  )

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Remove ended touches
    Array.from(e.changedTouches).forEach((touch) => {
      touchesRef.current.delete(touch.identifier)
    })

    // Reset pinch tracking if less than 2 fingers
    if (e.touches.length < 2) {
      lastPinchDistanceRef.current = null
      lastPinchCenterRef.current = null
    }

    // Reinitialize pinch tracking if still 2 fingers
    if (e.touches.length === 2) {
      const touch0 = e.touches[0]
      const touch1 = e.touches[1]
      if (!touch0 || !touch1) return

      const t1 = { x: touch0.clientX, y: touch0.clientY }
      const t2 = { x: touch1.clientX, y: touch1.clientY }
      lastPinchDistanceRef.current = getDistance(t1, t2)
      lastPinchCenterRef.current = getCenter(t1, t2)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          display: 'block',
          cursor: isPanning ? 'grabbing' : 'default',
        }}
      />
    </div>
  )
}
