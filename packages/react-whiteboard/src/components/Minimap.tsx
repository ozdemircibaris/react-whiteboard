import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useWhiteboardStore, useWhiteboardContext } from '../context'
import type { Shape } from '../types'
import type { ThemeColors } from '../types/theme'
import { resolveTheme } from '../types/theme'
import { getShapesBounds } from '../utils/shapeBounds'

export interface MinimapProps {
  width?: number
  height?: number
  className?: string
  /** Theme colors for minimap rendering */
  theme?: Partial<ThemeColors>
  /** Actual canvas width for accurate viewport indicator (defaults to window.innerWidth) */
  canvasWidth?: number
  /** Actual canvas height for accurate viewport indicator (defaults to window.innerHeight) */
  canvasHeight?: number
}

const DEFAULT_WORLD = { x: 0, y: 0, width: 1000, height: 800 } as const
const WORLD_PAD = 100

function getWorldBounds(shapes: Map<string, Shape>, shapeIds: string[]) {
  const bounds = getShapesBounds(shapes, shapeIds)
  if (!bounds) return DEFAULT_WORLD
  return {
    x: bounds.minX - WORLD_PAD,
    y: bounds.minY - WORLD_PAD,
    width: bounds.maxX - bounds.minX + WORLD_PAD * 2,
    height: bounds.maxY - bounds.minY + WORLD_PAD * 2,
  }
}

export function Minimap({ width = 200, height = 150, className, theme: themeProp, canvasWidth, canvasHeight }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const { store } = useWhiteboardContext()

  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const setViewport = useWhiteboardStore((s) => s.setViewport)
  const theme = useMemo(() => resolveTheme(themeProp), [themeProp])

  // Track viewport in a ref — updated via store subscription (no React re-render).
  // This avoids 60fps re-renders during pan/zoom.
  const viewportRef = useRef(store.getState().viewport)

  // Memoize world bounds + transform so render and handleClick share the same result
  const world = useMemo(() => getWorldBounds(shapes, shapeIds), [shapes, shapeIds])
  const transform = useMemo(() => {
    const scaleX = width / world.width
    const scaleY = height / world.height
    const scale = Math.min(scaleX, scaleY) * 0.9
    return {
      scale,
      offsetX: (width - world.width * scale) / 2,
      offsetY: (height - world.height * scale) / 2,
    }
  }, [world, width, height])

  const renderMinimap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const viewport = viewportRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = theme.minimapBackground
    ctx.fillRect(0, 0, width, height)

    const { scale, offsetX, offsetY } = transform

    // Draw shapes as simplified rectangles
    ctx.fillStyle = theme.minimapShapeFill
    ctx.strokeStyle = theme.minimapShapeStroke
    ctx.lineWidth = 1

    for (const id of shapeIds) {
      const s = shapes.get(id)
      if (!s) continue
      const x = (s.x - world.x) * scale + offsetX
      const y = (s.y - world.y) * scale + offsetY
      const w = Math.max(s.width * scale, 2)
      const h = Math.max(s.height * scale, 2)
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
    }

    // Draw viewport rectangle
    const actualWidth = canvasWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1200)
    const actualHeight = canvasHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800)
    const vpWidth = actualWidth / viewport.zoom
    const vpHeight = actualHeight / viewport.zoom
    const vpX = -viewport.x / viewport.zoom
    const vpY = -viewport.y / viewport.zoom

    const rx = (vpX - world.x) * scale + offsetX
    const ry = (vpY - world.y) * scale + offsetY
    const rw = vpWidth * scale
    const rh = vpHeight * scale

    ctx.fillStyle = theme.minimapViewportFill
    ctx.fillRect(rx, ry, rw, rh)
    ctx.strokeStyle = theme.minimapViewportStroke
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)
  }, [shapes, shapeIds, width, height, theme, world, transform, canvasWidth, canvasHeight])

  // RAF-throttled render: schedule at most one render per frame
  const scheduleRender = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(renderMinimap)
  }, [renderMinimap])

  // Subscribe to viewport changes outside React to avoid re-renders on every pan/zoom
  useEffect(() => {
    const unsub = store.subscribe(
      (s) => s.viewport,
      (viewport) => {
        viewportRef.current = viewport
        scheduleRender()
      },
    )
    return () => { unsub(); cancelAnimationFrame(rafRef.current) }
  }, [store, scheduleRender])

  // Render when shapes/world/theme change (React-driven, infrequent)
  useEffect(() => {
    scheduleRender()
  }, [scheduleRender])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const { scale, offsetX, offsetY } = transform
      const viewport = viewportRef.current

      // Convert click to world coordinates
      const worldX = (clickX - offsetX) / scale + world.x
      const worldY = (clickY - offsetY) / scale + world.y

      // Center viewport on clicked point
      const actualW = canvasWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1200)
      const actualH = canvasHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800)
      const vpWidth = actualW / viewport.zoom
      const vpHeight = actualH / viewport.zoom
      setViewport({
        x: -(worldX - vpWidth / 2) * viewport.zoom,
        y: -(worldY - vpHeight / 2) * viewport.zoom,
      })
    },
    [world, transform, setViewport, canvasWidth, canvasHeight],
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      aria-label="Minimap"
      className={className}
      style={{
        width,
        height,
        borderRadius: 8,
        border: `1px solid ${theme.minimapBorder}`,
        cursor: 'pointer',
      }}
    />
  )
}
