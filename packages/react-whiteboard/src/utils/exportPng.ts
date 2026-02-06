import type { Shape } from '../types'
import { CanvasRenderer } from '../core/renderer'

/** Options for PNG export */
export interface ExportPngOptions {
  /** Padding around content in pixels (default: 32) */
  padding?: number
  /** Background color (default: '#ffffff') */
  backgroundColor?: string
  /** Device pixel ratio for export resolution (default: 2) */
  scale?: number
}

/**
 * Calculate the bounding box of all shapes.
 * Returns null if there are no shapes.
 */
function getShapesBounds(
  shapes: Map<string, Shape>,
  shapeIds: string[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (shapeIds.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const id of shapeIds) {
    const s = shapes.get(id)
    if (!s) continue
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }

  if (!isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/**
 * Export all shapes to a PNG data URL.
 * Creates an offscreen canvas, renders all shapes using the real renderer,
 * and returns a data URL.
 *
 * Returns null if there are no shapes to export.
 */
export function exportToPng(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  selectedIds: Set<string>,
  options: ExportPngOptions = {},
): string | null {
  const { padding = 32, backgroundColor = '#ffffff', scale = 2 } = options

  const bounds = getShapesBounds(shapes, shapeIds)
  if (!bounds) return null

  const contentWidth = bounds.maxX - bounds.minX
  const contentHeight = bounds.maxY - bounds.minY
  const canvasWidth = contentWidth + padding * 2
  const canvasHeight = contentHeight + padding * 2

  // Create offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth * scale
  canvas.height = canvasHeight * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Set up transform: scale for DPI, then translate so shapes are centered
  const offsetX = padding - bounds.minX
  const offsetY = padding - bounds.minY
  ctx.setTransform(scale, 0, 0, scale, offsetX * scale, offsetY * scale)

  // Render shapes using the real renderer (pass allShapes for bound text)
  const renderer = new CanvasRenderer(ctx)
  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (shape) {
      renderer.drawShape(shape, selectedIds.has(id), shapes)
    }
  }

  return canvas.toDataURL('image/png')
}

/**
 * Export shapes to PNG and trigger a download.
 * Returns false if there are no shapes.
 */
export function downloadPng(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  selectedIds: Set<string>,
  filename: string = 'whiteboard.png',
  options: ExportPngOptions = {},
): boolean {
  const dataUrl = exportToPng(shapes, shapeIds, selectedIds, options)
  if (!dataUrl) return false

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
  return true
}
