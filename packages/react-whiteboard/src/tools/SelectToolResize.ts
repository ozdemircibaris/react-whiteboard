import type { WhiteboardStore } from '../core/store'
import type { Shape, TextShape, LineShape, ArrowShape, PathShape } from '../types'
import { calculateResizedBounds } from '../utils/hitTest'
import type { ToolState } from './types'
import { wrapTextLines } from '../utils/fonts'

/**
 * Handle resize operations for selected shapes.
 * Extracted from SelectTool to keep file sizes manageable.
 */
export function applyResize(
  store: WhiteboardStore,
  state: ToolState,
  moveBeforeStates: Shape[],
  resizeStartFontSizes: Map<string, number>,
): void {
  if (!state.dragStart || !state.dragCurrent || !state.resizeHandle) return

  const dx = state.dragCurrent.x - state.dragStart.x
  const dy = state.dragCurrent.y - state.dragStart.y
  const isCornerHandle = !state.resizeHandle.includes('center')

  state.startPositions.forEach((startBounds, id) => {
    const newBounds = calculateResizedBounds(startBounds, state.resizeHandle!, dx, dy)
    const shape = store.shapes.get(id)
    if (!shape) return

    switch (shape.type) {
      case 'text':
        resizeText(store, id, shape as TextShape, newBounds, startBounds, isCornerHandle, resizeStartFontSizes)
        break
      case 'line':
        resizeLine(store, id, shape as LineShape, newBounds, startBounds, moveBeforeStates)
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
  })
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
    const newFontSize = Math.max(8, Math.round(originalFontSize * scaleFactor))
    const newProps = { ...textShape.props, fontSize: newFontSize }
    const { height } = wrapTextLines(textShape.props.text, newBounds.width, newProps)
    newBounds.height = height
    store.updateShape(id, { ...newBounds, props: newProps }, false)
  } else {
    const { height } = wrapTextLines(textShape.props.text, newBounds.width, textShape.props)
    newBounds.height = height
    store.updateShape(id, newBounds, false)
  }
}

function resizeLine(
  store: WhiteboardStore,
  id: string,
  shape: LineShape,
  newBounds: ResizeBounds,
  startBounds: ResizeBounds,
  moveBeforeStates: Shape[],
): void {
  const original = moveBeforeStates.find((s) => s.id === id) as LineShape | undefined
  if (original && startBounds.width > 0 && startBounds.height > 0) {
    const scaleX = newBounds.width / startBounds.width
    const scaleY = newBounds.height / startBounds.height
    const newPoints = original.props.points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }))
    store.updateShape(id, { ...newBounds, props: { ...shape.props, points: newPoints } }, false)
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
  if (original && startBounds.width > 0 && startBounds.height > 0) {
    const scaleX = newBounds.width / startBounds.width
    const scaleY = newBounds.height / startBounds.height
    const newStart = { x: original.props.start.x * scaleX, y: original.props.start.y * scaleY }
    const newEnd = { x: original.props.end.x * scaleX, y: original.props.end.y * scaleY }
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
  if (original && startBounds.width > 0 && startBounds.height > 0) {
    const scaleX = newBounds.width / startBounds.width
    const scaleY = newBounds.height / startBounds.height
    const newPoints = original.props.points.map((p) => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
      pressure: p.pressure,
    }))
    store.updateShape(id, { ...newBounds, props: { ...shape.props, points: newPoints } }, false)
  } else {
    store.updateShape(id, newBounds, false)
  }
}
