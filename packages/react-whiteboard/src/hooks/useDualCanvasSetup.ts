import { useRef, useState, useEffect, useCallback } from 'react'
import { CanvasRenderer } from '../core/renderer'
import { getDevicePixelRatio } from '../utils/canvas'
import type { ThemeColors } from '../types/theme'

export interface ContainerSize {
  width: number
  height: number
}

interface DualCanvasSetupOptions {
  onReady?: () => void
  theme?: Partial<ThemeColors>
}

/**
 * Hook for dual-canvas initialization and resize handling.
 * Manages two stacked canvases (static + interactive) with matching DPI/size.
 */
export function useDualCanvasSetup({ onReady, theme }: DualCanvasSetupOptions) {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null)
  const interactiveCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const staticRendererRef = useRef<CanvasRenderer | null>(null)
  const interactiveRendererRef = useRef<CanvasRenderer | null>(null)
  const readyFiredRef = useRef(false)
  const themeRef = useRef(theme)
  themeRef.current = theme

  // Cached container size — updated on resize, avoids getBoundingClientRect per frame
  const containerSizeRef = useRef<ContainerSize>({ width: 0, height: 0 })

  // Bumped on each setup so downstream effects (e.g. theme sync) can re-fire
  const [setupVersion, setSetupVersion] = useState(0)

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

    // Cache container size for render functions (avoids per-frame getBoundingClientRect)
    containerSizeRef.current = { width: w, height: h }

    // Size both canvases identically with DPI scaling
    for (const canvas of [staticCanvas, interactiveCanvas]) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    // Create renderer instances with the current theme
    staticRendererRef.current = new CanvasRenderer(staticCtx, themeRef.current)
    interactiveRendererRef.current = new CanvasRenderer(interactiveCtx, themeRef.current)

    setSetupVersion((v) => v + 1)

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
    containerSizeRef,
    staticRendererRef,
    interactiveRendererRef,
    setupCanvases,
    setupVersion,
  }
}
