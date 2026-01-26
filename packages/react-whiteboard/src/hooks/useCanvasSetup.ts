import { useRef, useEffect, useCallback } from 'react'
import { CanvasRenderer } from '../core/renderer'
import { getDevicePixelRatio } from '../utils/canvas'

interface CanvasSetupOptions {
  onReady?: () => void
}

/**
 * Hook for canvas initialization and resize handling
 */
export function useCanvasSetup({ onReady }: CanvasSetupOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)

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

  // Setup canvas on mount and resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setupCanvas()
      }
    })

    resizeObserver.observe(container)

    const handleResize = () => setupCanvas()
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [setupCanvas])

  return {
    canvasRef,
    containerRef,
    rendererRef,
    setupCanvas,
  }
}
