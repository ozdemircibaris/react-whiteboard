/**
 * In-memory blob store for image data.
 * Stores image blobs and provides short ObjectURLs for efficient shape storage.
 * This avoids storing multi-MB base64 strings in shape props, history, and clipboard.
 *
 * Usage:
 * - On paste/import: store blob → get short ObjectURL for shape.props.src
 * - On render: ObjectURL works directly as img.src (browser handles it)
 * - On export/serialize: resolve ObjectURL → base64 DataURL
 */

/** Map from ObjectURL to the underlying Blob */
const blobRegistry = new Map<string, Blob>()

/**
 * Store a blob and return an ObjectURL reference.
 * The ObjectURL is a short string (~50 chars) suitable for shape.props.src.
 */
export function storeBlobAsUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  blobRegistry.set(url, blob)
  return url
}

/**
 * Check if a src string is a managed blob URL.
 */
export function isBlobUrl(src: string): boolean {
  return src.startsWith('blob:')
}

/**
 * Get the blob for a managed URL. Returns undefined for non-blob URLs.
 */
export function getBlob(url: string): Blob | undefined {
  return blobRegistry.get(url)
}

/**
 * Revoke a blob URL and remove it from the registry.
 */
export function revokeBlob(url: string): void {
  if (blobRegistry.has(url)) {
    URL.revokeObjectURL(url)
    blobRegistry.delete(url)
  }
}

/**
 * Convert a base64 DataURL to a blob URL for efficient storage.
 * Returns the original string if it's not a data URL.
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) return dataUrl

  const [header, base64] = dataUrl.split(',')
  if (!header || !base64) return dataUrl

  const mimeMatch = header.match(/data:([^;]+)/)
  const mime = mimeMatch?.[1] ?? 'image/png'

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: mime })
  return storeBlobAsUrl(blob)
}

/**
 * Convert a blob URL back to a base64 DataURL for serialization.
 * Returns the original string if it's not a blob URL or not in the registry.
 */
export async function blobUrlToDataUrl(url: string): Promise<string> {
  const blob = blobRegistry.get(url)
  if (!blob) return url

  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve(url)
    reader.readAsDataURL(blob)
  })
}

/**
 * Clear all stored blobs and revoke their URLs.
 */
export function clearBlobStore(): void {
  for (const url of blobRegistry.keys()) {
    URL.revokeObjectURL(url)
  }
  blobRegistry.clear()
}
