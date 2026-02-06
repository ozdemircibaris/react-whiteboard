import type { WhiteboardStore } from '../core/store'
import type { Shape, TextShape, LineShape, ArrowShape, PathShape } from '../types'
import { calculateResizedBounds } from '../utils/hitTest'
import type { ToolState } from './types'
import { wrapTextLines } from '../utils/fonts'
import { getBoundTextIdFromShape } from '../utils/boundText'

/**
 * Handle resize operations for selected shapes.
 * Extracted from SelectTool to keep file sizes manageable.
 */
export function applyResize(
  store: WhiteboardStore,
  state: ToolState,
  moveBeforeStates: Shape[],
  resizeStartFontSizes: Map<string, number>,
  shiftKey: boolean = false,
): void {
  if (!state.dragStart || !state.dragCurrent || !state.resizeHandle) return

  const dx = state.dragCurrent.x - state.dragStart.x
  const dy = state.dragCurrent.y - state.dragStart.y
  const isCornerHandle = !state.resizeHandle.includes('center')

  state.startPositions.forEach((startBounds, id) => {
    const shape = store.shapes.get(id)
    if (!shape || shape.isLocked) return

    let newBounds = calculateResizedBounds(startBounds, state.resizeHandle!, dx, dy)

    // Aspect ratio lock: Shift for normal shapes, always for images
    const shouldLockRatio = (shiftKey || shape.type === 'image') && isCornerHandle
    if (shouldLockRatio && startBounds.width > 0 && startBounds.height > 0) {
      newBounds = constrainAspectRatio(startBounds, newBounds, state.resizeHandle!)
    }

    switch (shape.type) {
      case 'text':
        resizeText(store, id, shape as TextShape, newBounds, startBounds, isCornerHandle, resizeStartFontSizes)
        break
      case 'line':
        resizeLine(store, id, newBounds, startBounds, moveBeforeStates)
        break
      case 'arrow':
        resizeArrow(store, id, shape as ArrowShape, newBounds, startBounds, moveBeforeStates)
        break
      case 'path':
        resizePath(store, id, shape as PathShape, newBounds, startBounds, moveBeforeStates)
        break
      default:
        store.updateShape(id, newBounds, false)
    }

    // Sync bound text when container shape is resized
    if (getBoundTextIdFromShape(shape)) {
      store.syncBoundTextToParent(id)
    }
  })
}

/**
 * Constrain new bounds to maintain the original aspect ratio.
 */
function constrainAspectRatio(
  startBounds: ResizeBounds,
  newBounds: ResizeBounds,
  handle: string,
): ResizeBounds {
  const ratio = startBounds.width / startBounds.height
  let { x, y, width, height } = newBounds

  // Use the dominant axis delta to drive the other
  const scaleX = width / startBounds.width
  const scaleY = height / startBounds.height
  const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY))
  width = startBounds.width * scale
  height = startBounds.height * scale

  // Adjust origin for top/left handles
  if (handle.includes('left')) {
    x = startBounds.x + startBounds.width - width
  }
  if (handle.includes('top')) {
    y = startBounds.y + startBounds.height - height
  }

  // Enforce minimum size
  if (width < 10) { width = 10; height = 10 / ratio }
  if (height < 10) { height = 10; width = 10 * ratio }

  return { x, y, width, height }
}

interface ResizeBounds {
  x: number
  y: number
  width: number
  height: number
}

function resizeText(
  store: WhiteboardStore,
  id: string,
  textShape: TextShape,
  newBounds: ResizeBounds,
  startBounds: ResizeBounds,
  isCornerHandle: boolean,
  resizeStartFontSizes: Map<string, number>,
): void {
  if (isCornerHandle && startBounds.width > 0) {
    const originalFontSize = resizeStartFontSizes.get(id) ?? textShape.props.fontSize
    const scaleFactor = newBounds.width / startBounds.width
    const newFontSize = Math.max(8, Math.min(200, Math.round(originalFontSize * scaleFactor)))
    const newProps = { ...textShape.props, fontSize: newFontSize }
    const { height } = wrapTextLines(textShape.props.text, newBounds.width, newProps)
    newBounds.height = height
    store.updateShape(id, { ...newBounds, props: newProps }, false)
  } else {
    const { height } = wrapTextLines(textShape.props.text, Math.max(newBounds.width, 20), textShape.props)
    newBounds.height = height
    store.updateShape(id, newBounds, false)
  }
}

function resizeLine(
  store: WhiteboardStore,
  id: string,
  newBounds: ResizeBounds,
  startBounds: ResizeBounds,
  moveBeforeStates: Shape[],
): void {
  const original = moveBeforeStates.find((s) => s.id === id) as LineShape | undefined
  const safeScaleX = startBounds.width > 0 ? newBounds.width / startBounds.width : 1
  const safeScaleY = startBounds.height > 0 ? newBounds.height / startBounds.height : 1
  if (original) {
    const newPoints = original.props.points.map((p) => ({ x: p.x * safeScaleX, y: p.y * safeScaleY }))
    store.updateShape(id, { ...newBounds, props: { ...original.props, points: newPoints } }, false)
  } else {
    store.updateShape(id, newBounds, false)
  }
}

function resizeArrow(
  store: WhiteboardStore,
  id: string,
  shape: ArrowShape,
  newBounds: ResizeBounds,
  startBounds: ResizeBounds,
  moveBeforeStates: Shape[],
): void {
  const original = moveBeforeStates.find((s) => s.id === id) as ArrowShape | undefined
  const safeScaleX = startBounds.width > 0 ? newBounds.width / startBounds.width : 1
  const safeScaleY = startBounds.height > 0 ? newBounds.height / startBounds.height : 1
  if (original) {
    const newStart = { x: original.props.start.x * safeScaleX, y: original.props.start.y * safeScaleY }
    const newEnd = { x: original.props.end.x * safeScaleX, y: original.props.end.y * safeScaleY }
    store.updateShape(id, { ...newBounds, props: { ...shape.props, start: newStart, end: newEnd } }, false)
  } else {
    store.updateShape(id, newBounds, false)
  }
}

function resizePath(
  store: WhiteboardStore,
  id: string,
  shape: PathShape,
  newBounds: ResizeBounds,
  startBounds: ResizeBounds,
  moveBeforeStates: Shape[],
): void {
  const original = moveBeforeStates.find((s) => s.id === id) as PathShape | undefined
  const safeScaleX = startBounds.width > 0 ? newBounds.width / startBounds.width : 1
  const safeScaleY = startBounds.height > 0 ? newBounds.height / startBounds.height : 1
  if (original) {
    const newPoints = original.props.points.map((p) => ({
      x: p.x * safeScaleX,
      y: p.y * safeScaleY,
      pressure: p.pressure,
    }))
    store.updateShape(id, { ...newBounds, props: { ...shape.props, points: newPoints } }, false)
  } else {
    store.updateShape(id, newBounds, false)
  }
}
