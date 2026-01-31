import { nanoid } from 'nanoid'
import type { ImageShape, Viewport } from '../../types'
import type { WhiteboardStore } from './createStore'

/**
 * Handle pasting images from the clipboard.
 * Returns true if an image was found and handled.
 */
export function handleImagePaste(
  event: ClipboardEvent,
  store: WhiteboardStore,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
): boolean {
  const items = event.clipboardData?.items
  if (!items) return false

  for (const item of Array.from(items)) {
    if (!item.type.startsWith('image/')) continue

    const blob = item.getAsFile()
    if (!blob) continue

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Calculate center of current viewport in canvas coordinates
        const centerX = (canvasWidth / 2 - viewport.x) / viewport.zoom
        const centerY = (canvasHeight / 2 - viewport.y) / viewport.zoom

        // Scale image to fit reasonably on canvas (max 400px)
        const maxSize = 400
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > maxSize || h > maxSize) {
          const scale = maxSize / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }

        const shape: ImageShape = {
          id: nanoid(),
          type: 'image',
          x: centerX - w / 2,
          y: centerY - h / 2,
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          parentId: null,
          seed: 0,
          roughness: 0,
          props: {
            src: reader.result as string,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          },
        }

        store.addShape(shape, true)
        store.select(shape.id)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(blob)
    return true
  }

  return false
}
