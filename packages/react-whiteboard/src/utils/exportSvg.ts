import rough from 'roughjs'
import type {
  Shape,
  RectangleShape,
  EllipseShape,
  LineShape,
  ArrowShape,
  TextShape,
  PathShape,
  ImageShape,
} from '../types'
import type { ShapeRendererRegistry } from '../core/renderer/ShapeRendererRegistry'
import {
  renderRectangle,
  renderEllipse,
  renderLine,
  renderArrow,
  renderPath,
  renderText,
  renderImage,
} from './svgShapeRenderers'
import { isBlobUrl, blobUrlToDataUrl } from './imageBlobStore'
import { getShapesBounds } from './shapeBounds'

// ============================================================================
// Types
// ============================================================================

export interface ExportSvgOptions {
  /** Padding around content in pixels (default: 32) */
  padding?: number
  /** Background color (default: '#ffffff'). Set to 'transparent' for none. */
  backgroundColor?: string
  /** Custom shape renderer registry for SVG export of custom shapes */
  registry?: ShapeRendererRegistry
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Resolve blob URLs in image shapes to base64 DataURLs so the SVG is self-contained.
 */
async function resolveImageSrcs(
  shapes: Map<string, Shape>,
  shapeIds: string[],
): Promise<Map<string, Shape>> {
  const resolved = new Map(shapes)
  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (!shape || shape.type !== 'image') continue
    const imgShape = shape as ImageShape
    if (!isBlobUrl(imgShape.props.src)) continue
    const dataUrl = await blobUrlToDataUrl(imgShape.props.src)
    resolved.set(id, { ...imgShape, props: { ...imgShape.props, src: dataUrl } } as Shape)
  }
  return resolved
}

/**
 * Export all shapes to an SVG string using RoughJS SVG mode for hand-drawn aesthetics.
 * Async because blob URLs in image shapes must be resolved to base64 DataURLs.
 * Returns null if there are no shapes to export.
 */
export async function exportToSvg(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  options: ExportSvgOptions = {},
): Promise<string | null> {
  const { padding = 32, backgroundColor = '#ffffff' } = options

  const bounds = getShapesBounds(shapes, shapeIds)
  if (!bounds) return null

  // Resolve blob URLs in image shapes to base64 DataURLs for self-contained SVG
  const resolvedShapes = await resolveImageSrcs(shapes, shapeIds)

  const contentWidth = bounds.maxX - bounds.minX
  const contentHeight = bounds.maxY - bounds.minY
  const svgWidth = contentWidth + padding * 2
  const svgHeight = contentHeight + padding * 2
  const offsetX = padding - bounds.minX
  const offsetY = padding - bounds.minY

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('width', String(svgWidth))
  svg.setAttribute('height', String(svgHeight))
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)

  if (backgroundColor && backgroundColor !== 'transparent') {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('width', String(svgWidth))
    bg.setAttribute('height', String(svgHeight))
    bg.setAttribute('fill', backgroundColor)
    svg.appendChild(bg)
  }

  const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  contentGroup.setAttribute('transform', `translate(${offsetX} ${offsetY})`)
  svg.appendChild(contentGroup)

  const rs = rough.svg(svg)

  // Collect bound text IDs to skip standalone rendering
  const boundTextIds = new Set<string>()
  for (const id of shapeIds) {
    const shape = resolvedShapes.get(id)
    if (!shape) continue
    if ((shape.type === 'rectangle' || shape.type === 'ellipse') && 'boundTextId' in shape.props) {
      const btId = (shape as RectangleShape | EllipseShape).props.boundTextId
      if (btId) boundTextIds.add(btId)
    }
  }

  for (const id of shapeIds) {
    const shape = resolvedShapes.get(id)
    if (!shape) continue
    if (shape.type === 'text' && boundTextIds.has(shape.id)) continue

    let el: SVGGElement | null = null

    switch (shape.type) {
      case 'rectangle':
        el = renderRectangle(rs, shape as RectangleShape, resolvedShapes)
        break
      case 'ellipse':
        el = renderEllipse(rs, shape as EllipseShape, resolvedShapes)
        break
      case 'line':
        el = renderLine(rs, shape as LineShape)
        break
      case 'arrow':
        el = renderArrow(rs, shape as ArrowShape)
        break
      case 'path':
        el = renderPath(shape as PathShape)
        break
      case 'text':
        el = renderText(shape as TextShape)
        break
      case 'image':
        el = renderImage(shape as ImageShape)
        break
      default: {
        const custom = options.registry?.getRenderer(shape.type)
        if (custom?.svgRender) {
          el = custom.svgRender({ roughSvg: rs, shape, allShapes: resolvedShapes })
        }
        break
      }
    }

    if (el) contentGroup.appendChild(el)
  }

  return new XMLSerializer().serializeToString(svg)
}

/**
 * Export shapes to SVG and trigger a download.
 * Returns false if there are no shapes.
 */
export async function downloadSvg(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  filename: string = 'whiteboard.svg',
  options: ExportSvgOptions = {},
): Promise<boolean> {
  const svgString = await exportToSvg(shapes, shapeIds, options)
  if (!svgString) return false

  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return true
}
