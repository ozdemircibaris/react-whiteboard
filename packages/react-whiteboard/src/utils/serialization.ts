import type { Shape, ImageShape, Viewport } from '../types'
import { collectBoundTextIds } from './boundText'
import { isBlobUrl, blobUrlToDataUrl, dataUrlToBlobUrl } from './imageBlobStore'

/** Current file format version */
const FORMAT_VERSION = 1

/**
 * Serialized whiteboard document format
 */
export interface WhiteboardDocument {
  version: number
  source: 'react-whiteboard'
  viewport: Viewport
  shapes: Shape[]
  shapeIds: string[]
}

/**
 * Serialize whiteboard state to a JSON-compatible document object.
 */
export function serializeDocument(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  viewport: Viewport,
): WhiteboardDocument {
  const shapeArray: Shape[] = []
  const addedIds = new Set<string>()
  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (shape) {
      shapeArray.push(shape)
      addedIds.add(id)
    }
  }

  // Include bound text shapes (they live in shapes Map but not in shapeIds)
  for (const btId of collectBoundTextIds(shapeIds, shapes)) {
    if (!addedIds.has(btId)) {
      const btShape = shapes.get(btId)
      if (btShape) shapeArray.push(btShape)
    }
  }

  return {
    version: FORMAT_VERSION,
    source: 'react-whiteboard',
    viewport: { ...viewport },
    shapes: shapeArray,
    shapeIds: [...shapeIds],
  }
}

/**
 * Resolve blob URLs in image shapes to base64 DataURLs for persistence.
 */
async function resolveImageBlobUrls(shapes: Shape[]): Promise<Shape[]> {
  const resolved: Shape[] = []
  for (const shape of shapes) {
    if (shape.type === 'image' && isBlobUrl((shape as ImageShape).props.src)) {
      const imgShape = shape as ImageShape
      const dataUrl = await blobUrlToDataUrl(imgShape.props.src)
      resolved.push({ ...imgShape, props: { ...imgShape.props, src: dataUrl } } as Shape)
    } else {
      resolved.push(shape)
    }
  }
  return resolved
}

/**
 * Serialize whiteboard state to a JSON string.
 * Async because blob URLs must be resolved to base64 DataURLs for persistence.
 */
export async function exportToJSON(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  viewport: Viewport,
): Promise<string> {
  const doc = serializeDocument(shapes, shapeIds, viewport)
  doc.shapes = await resolveImageBlobUrls(doc.shapes)
  return JSON.stringify(doc, null, 2)
}

/**
 * Parse and validate a JSON string into a WhiteboardDocument.
 * Throws on invalid input.
 */
export function parseDocument(json: string): WhiteboardDocument {
  const raw: unknown = JSON.parse(json)

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid document: not an object')
  }

  const data = raw as Record<string, unknown>

  if (data.source !== 'react-whiteboard') {
    throw new Error('Invalid document: unrecognized source')
  }

  if (typeof data.version !== 'number' || data.version > FORMAT_VERSION) {
    throw new Error(`Unsupported document version: ${data.version}`)
  }

  if (!Array.isArray(data.shapes) || !Array.isArray(data.shapeIds)) {
    throw new Error('Invalid document: missing shapes or shapeIds')
  }

  const viewport = data.viewport as Viewport | undefined
  if (!viewport || typeof viewport.x !== 'number' || typeof viewport.y !== 'number' || typeof viewport.zoom !== 'number') {
    throw new Error('Invalid document: invalid viewport')
  }

  return {
    version: data.version,
    source: data.source as 'react-whiteboard',
    viewport,
    shapes: data.shapes as Shape[],
    shapeIds: data.shapeIds as string[],
  }
}

/**
 * Convert a parsed document into store-ready data structures.
 * Converts base64 DataURL image sources to efficient blob URLs.
 */
export function documentToStoreData(doc: WhiteboardDocument): {
  shapes: Map<string, Shape>
  shapeIds: string[]
  viewport: Viewport
} {
  const shapes = new Map<string, Shape>()
  for (const shape of doc.shapes) {
    if (shape.type === 'image') {
      const imgShape = shape as ImageShape
      const src = imgShape.props.src
      // Convert base64 DataURLs to blob URLs for efficient in-memory storage
      if (src.startsWith('data:')) {
        const blobUrl = dataUrlToBlobUrl(src)
        shapes.set(shape.id, {
          ...imgShape,
          props: { ...imgShape.props, src: blobUrl },
        } as Shape)
        continue
      }
    }
    shapes.set(shape.id, shape)
  }

  return {
    shapes,
    shapeIds: doc.shapeIds,
    viewport: doc.viewport,
  }
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Open a file picker and read the selected file as text.
 * Returns null if the user cancels.
 */
export function pickAndReadFile(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }
    input.click()
  })
}
