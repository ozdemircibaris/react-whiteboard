import type { TextShape, RectangleShape, EllipseShape } from '../../types'
import type { WhiteboardStore } from '../../core/store'
import { getShapeAtPoint } from '../../utils/hitTest'
import { canContainBoundText, getBoundTextShape } from '../../utils/boundText'
import type { ToolEventContext } from '../types'
import type { TextTool } from '../TextTool'
import type { ToolProvider } from '../types'

/**
 * Double-click to enter text or bound-text edit mode.
 */

/**
 * Handle double-click: edit existing text shapes or create/edit bound text on containers.
 */
export function handleDoubleClick(
  ctx: ToolEventContext,
  store: WhiteboardStore,
  manager: ToolProvider,
): void {
  const hitShape = getShapeAtPoint(ctx.canvasPoint, store.shapes, store.shapeIds, 2)
  if (!hitShape) return

  const text = manager.getTool('text') as TextTool | undefined
  if (!text) return

  if (hitShape.type === 'text') {
    store.setTool('text')
    text.editText(hitShape as TextShape, ctx.viewport, store)
    return
  }

  if (canContainBoundText(hitShape.type)) {
    const container = hitShape as RectangleShape | EllipseShape
    const existingText = getBoundTextShape(container, store.shapes)

    if (existingText) {
      store.setTool('text')
      text.editBoundText(existingText, container, ctx.viewport, store)
    } else {
      const newText = store.createBoundText(hitShape.id)
      if (newText) {
        store.setTool('text')
        text.editBoundText(newText, container, ctx.viewport, store)
      }
    }
  }
}
