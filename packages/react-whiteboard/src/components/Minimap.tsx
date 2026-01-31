import { useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore } from '../core/store'
import type { Shape } from '../types'

export interface MinimapProps {
  width?: number
  height?: number
  className?: string
}

const MINIMAP_BG = '#f8f8f8'
const SHAPE_FILL = '#cbd5e1'
const SHAPE_STROKE = '#94a3b8'
const VIEWPORT_STROKE = '#3b82f6'
const VIEWPORT_FILL = 'rgba(59, 130, 246, 0.08)'

function getWorldBounds(shapes: Map<string, Shape>, shapeIds: string[]) {
  if (shapeIds.length === 0) return { x: 0, y: 0, width: 1000, height: 800 }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const id of shapeIds) {
    const s = shapes.get(id)
    if (!s) continue
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }

  // Add padding
  const pad = 100
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  }
}

export function Minimap({ width = 200, height = 150, className }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const setViewport = useWhiteboardStore((s) => s.setViewport)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = MINIMAP_BG
    ctx.fillRect(0, 0, width, height)

    const world = getWorldBounds(shapes, shapeIds)
    const scaleX = width / world.width
    const scaleY = height / world.height
    const scale = Math.min(scaleX, scaleY) * 0.9
    const offsetX = (width - world.width * scale) / 2
    const offsetY = (height - world.height * scale) / 2

    // Draw shapes as simplified rectangles
    ctx.fillStyle = SHAPE_FILL
    ctx.strokeStyle = SHAPE_STROKE
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
    // Viewport in canvas coords: top-left is (-viewport.x / zoom, -viewport.y / zoom)
    // Size is (canvasDisplayWidth / zoom, canvasDisplayHeight / zoom)
    // We don't know canvasDisplayWidth here, estimate from viewport
    const vpWidth = 1200 / viewport.zoom // approximate canvas width
    const vpHeight = 800 / viewport.zoom  // approximate canvas height
    const vpX = -viewport.x / viewport.zoom
    const vpY = -viewport.y / viewport.zoom

    const rx = (vpX - world.x) * scale + offsetX
    const ry = (vpY - world.y) * scale + offsetY
    const rw = vpWidth * scale
    const rh = vpHeight * scale

    ctx.fillStyle = VIEWPORT_FILL
    ctx.fillRect(rx, ry, rw, rh)
    ctx.strokeStyle = VIEWPORT_STROKE
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)
  }, [shapes, shapeIds, viewport, width, height])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const world = getWorldBounds(shapes, shapeIds)
      const scaleX = width / world.width
      const scaleY = height / world.height
      const scale = Math.min(scaleX, scaleY) * 0.9
      const offsetX = (width - world.width * scale) / 2
      const offsetY = (height - world.height * scale) / 2

      // Convert click to world coordinates
      const worldX = (clickX - offsetX) / scale + world.x
      const worldY = (clickY - offsetY) / scale + world.y

      // Center viewport on clicked point
      const vpWidth = 1200 / viewport.zoom
      const vpHeight = 800 / viewport.zoom
      setViewport({
        x: -(worldX - vpWidth / 2) * viewport.zoom,
        y: -(worldY - vpHeight / 2) * viewport.zoom,
      })
    },
    [shapes, shapeIds, viewport, width, height, setViewport],
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className={className}
      style={{
        width,
        height,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
      }}
    />
  )
}
