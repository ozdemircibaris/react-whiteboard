import type { Shape, Viewport } from '../types'

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
  for (const id of shapeIds) {
    const shape = shapes.get(id)
    if (shape) shapeArray.push(shape)
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
 * Serialize whiteboard state to a JSON string.
 */
export function exportToJSON(
  shapes: Map<string, Shape>,
  shapeIds: string[],
  viewport: Viewport,
): string {
  return JSON.stringify(serializeDocument(shapes, shapeIds, viewport), null, 2)
}

/**
 * Parse and validate a JSON string into a WhiteboardDocument.
 * Throws on invalid input.
 */
export function parseDocument(json: string): WhiteboardDocument {
  const data = JSON.parse(json) as Record<string, unknown>

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid document: not an object')
  }

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

  return data as unknown as WhiteboardDocument
}

/**
 * Convert a parsed document into store-ready data structures.
 */
export function documentToStoreData(doc: WhiteboardDocument): {
  shapes: Map<string, Shape>
  shapeIds: string[]
  viewport: Viewport
} {
  const shapes = new Map<string, Shape>()
  for (const shape of doc.shapes) {
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
