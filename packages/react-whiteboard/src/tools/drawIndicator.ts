/**
 * Draw a dimension/angle indicator label on the canvas overlay.
 * Used by shape and line tools during drag-to-draw.
 */
export function drawIndicatorLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  zoom: number,
): void {
  const fontSize = 12 / zoom
  ctx.save()
  ctx.font = `${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const metrics = ctx.measureText(label)
  const padX = 4 / zoom
  const padY = 2 / zoom
  const bgWidth = metrics.width + padX * 2
  const bgHeight = fontSize + padY * 2

  // Semi-transparent background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.beginPath()
  const r = 3 / zoom
  const bx = x - bgWidth / 2
  const by = y
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bgWidth - r, by)
  ctx.quadraticCurveTo(bx + bgWidth, by, bx + bgWidth, by + r)
  ctx.lineTo(bx + bgWidth, by + bgHeight - r)
  ctx.quadraticCurveTo(bx + bgWidth, by + bgHeight, bx + bgWidth - r, by + bgHeight)
  ctx.lineTo(bx + r, by + bgHeight)
  ctx.quadraticCurveTo(bx, by + bgHeight, bx, by + bgHeight - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
  ctx.fill()

  // White text
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, x, y + padY)
  ctx.restore()
}
