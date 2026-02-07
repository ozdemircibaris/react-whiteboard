import { useRef, useEffect, useCallback } from 'react'
import { CanvasRenderer } from '../core/renderer'
import { getDevicePixelRatio } from '../utils/canvas'

interface DualCanvasSetupOptions {
  onReady?: () => void
}

/**
 * Hook for dual-canvas initialization and resize handling.
 * Manages two stacked canvases (static + interactive) with matching DPI/size.
 */
export function useDualCanvasSetup({ onReady }: DualCanvasSetupOptions) {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null)
  const interactiveCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const staticRendererRef = useRef<CanvasRenderer | null>(null)
  const interactiveRendererRef = useRef<CanvasRenderer | null>(null)
  const readyFiredRef = useRef(false)

  const setupCanvases = useCallback(() => {
    const staticCanvas = staticCanvasRef.current
    const interactiveCanvas = interactiveCanvasRef.current
    const container = containerRef.current
    if (!staticCanvas || !interactiveCanvas || !container) return

    const staticCtx = staticCanvas.getContext('2d')
    const interactiveCtx = interactiveCanvas.getContext('2d')
    if (!staticCtx || !interactiveCtx) return

    const dpr = getDevicePixelRatio()
    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    // Size both canvases identically with DPI scaling
    for (const canvas of [staticCanvas, interactiveCanvas]) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    // Create renderer instances
    staticRendererRef.current = new CanvasRenderer(staticCtx)
    interactiveRendererRef.current = new CanvasRenderer(interactiveCtx)

    if (!readyFiredRef.current) {
      readyFiredRef.current = true
      onReady?.()
    }
  }, [onReady])

  // Setup on mount and resize via ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setupCanvases()
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [setupCanvases])

  return {
    staticCanvasRef,
    interactiveCanvasRef,
    containerRef,
    staticRendererRef,
    interactiveRendererRef,
    setupCanvases,
  }
}
