import type { Shape } from '../../types'
import type { WhiteboardStore } from '../../core/store'
import { getShapesInBounds } from '../../utils/hitTest'
import type { ToolState, PointerDownResult } from '../types'
import type { ThemeColors } from '../../types/theme'

/**
 * Selection state transitions: click-select, Shift+multi-select, and rubber-band marquee.
 */

/**
 * Handle click selection (single or shift+toggle).
 * Returns a PointerDownResult if the event is fully handled (shift-deselect),
 * or null if the caller should proceed with move logic.
 */
export function handleClickSelection(
  hitShape: Shape,
  shiftKey: boolean,
  store: WhiteboardStore,
): PointerDownResult | null {
  if (shiftKey) {
    store.toggleSelection(hitShape.id)
    if (!store.selectedIds.has(hitShape.id)) {
      return { handled: true, capture: false, cursor: 'default' }
    }
    return null // shape is now selected, proceed to move
  }

  if (!store.selectedIds.has(hitShape.id)) {
    store.select(hitShape.id)
  }
  return null
}

/**
 * Start a marquee (rubber-band) selection.
 */
export function startMarquee(
  canvasPoint: { x: number; y: number },
  shiftKey: boolean,
  store: WhiteboardStore,
  state: ToolState,
): PointerDownResult {
  if (!shiftKey) store.clearSelection()
  state.isDragging = true
  state.dragStart = canvasPoint
  state.dragCurrent = canvasPoint
  return { handled: true, capture: true, cursor: 'crosshair' }
}

/**
 * Complete a marquee selection: find shapes within the dragged rectangle.
 */
export function completeMarquee(store: WhiteboardStore, state: ToolState): void {
  if (!state.dragStart || !state.dragCurrent) return

  const x = Math.min(state.dragStart.x, state.dragCurrent.x)
  const y = Math.min(state.dragStart.y, state.dragCurrent.y)
  const w = Math.abs(state.dragCurrent.x - state.dragStart.x)
  const h = Math.abs(state.dragCurrent.y - state.dragStart.y)

  if (w > 3 || h > 3) {
    const found = getShapesInBounds(
      { x, y, width: w, height: h },
      store.shapes,
      store.shapeIds,
    )
    if (found.length > 0) store.selectMultiple(found.map((s) => s.id))
  }
}

/**
 * Draw the marquee selection rectangle overlay.
 */
export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  state: ToolState,
  theme: ThemeColors,
): void {
  if (!state.dragStart || !state.dragCurrent) return

  const x = Math.min(state.dragStart.x, state.dragCurrent.x)
  const y = Math.min(state.dragStart.y, state.dragCurrent.y)
  const w = Math.abs(state.dragCurrent.x - state.dragStart.x)
  const h = Math.abs(state.dragCurrent.y - state.dragStart.y)

  ctx.save()
  ctx.fillStyle = theme.marqueeFill
  ctx.strokeStyle = theme.marqueeStroke
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}
