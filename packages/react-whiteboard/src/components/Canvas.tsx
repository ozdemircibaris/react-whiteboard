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

  /**
   * Setup canvas and renderer
   */
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = getDevicePixelRatio()
    const rect = container.getBoundingClientRect()

    // Set canvas size with DPI scaling
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Create renderer
    rendererRef.current = new CanvasRenderer(ctx)

    onReady?.()
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

  /**
   * Animation loop
   */
  useEffect(() => {
    const loop = () => {
      render()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [render])

  /**
   * Setup canvas on mount and resize
   */
  useEffect(() => {
    setupCanvas()

    const handleResize = () => {
      setupCanvas()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvas])

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{
          display: 'block',
          cursor: isPanning ? 'grabbing' : 'default',
        }}
      />
    </div>
  )
}
