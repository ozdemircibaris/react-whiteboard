import type { ImageShape } from '../../types'
import type { DrawSelectionOutlineFn } from './shapeRenderers'

/** Cache loaded HTMLImageElement instances to avoid re-decoding each frame */
const imageCache = new Map<string, HTMLImageElement>()

function getOrLoadImage(src: string): HTMLImageElement | null {
  const cached = imageCache.get(src)
  if (cached && cached.complete) return cached

  if (!cached) {
    const img = new Image()
    img.src = src
    imageCache.set(src, img)
    // Return null on first frame — image will render next frame after loading
    return img.complete ? img : null
  }

  return null
}

/**
 * Draw an image shape on the canvas.
 */
export function drawImage(
  ctx: CanvasRenderingContext2D,
  shape: ImageShape,
  isSelected: boolean,
  drawSelection: DrawSelectionOutlineFn,
): void {
  const { x, y, width, height, rotation, opacity, props } = shape

  const img = getOrLoadImage(props.src)
  if (!img) return

  ctx.save()
  ctx.globalAlpha = opacity

  if (rotation !== 0) {
    const cx = x + width / 2
    const cy = y + height / 2
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }

  ctx.drawImage(img, x, y, width, height)

  if (isSelected) drawSelection(x, y, width, height)
  ctx.restore()
}
