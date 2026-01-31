import { nanoid } from 'nanoid'
import type { Shape, TextShape, RectangleShape, EllipseShape } from '../../types'
import type { StoreApi } from './types'
import { wrapTextLines } from '../../utils/fonts'
import {
  canContainBoundText,
  getBoundTextShape,
  BOUND_TEXT_PADDING,
} from '../../utils/boundText'
import { createHistoryEntry, pushHistory } from './historyHelpers'

/**
 * Bound text actions: create, sync, and remove text inside container shapes.
 */
export function createBoundTextActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    /**
     * Create or return existing bound text for a container shape.
     * The text shape is added to `shapes` but NOT to `shapeIds` (hidden from z-order).
     */
    createBoundText: (parentId: string): TextShape | null => {
      const state = get()
      const parent = state.shapes.get(parentId)
      if (!parent || !canContainBoundText(parent.type)) return null

      const container = parent as RectangleShape | EllipseShape

      // Return existing bound text
      const existing = getBoundTextShape(container, state.shapes)
      if (existing) return existing

      const pad = BOUND_TEXT_PADDING
      const textProps = state.currentTextProps

      const textShape: TextShape = {
        id: nanoid(),
        type: 'text',
        x: parent.x + pad,
        y: parent.y + pad,
        width: Math.max(parent.width - pad * 2, 20),
        height: textProps.fontSize * textProps.lineHeight,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        parentId,
        seed: Math.floor(Math.random() * 2147483647),
        roughness: 0,
        props: { text: '', ...textProps },
      }

      // Add text shape to map (not to shapeIds) and link to parent
      set((s) => {
        const newShapes = new Map(s.shapes)
        newShapes.set(textShape.id, textShape)

        // Update parent's boundTextId
        const updatedParent = {
          ...container,
          props: { ...container.props, boundTextId: textShape.id },
        } as Shape
        newShapes.set(parentId, updatedParent)

        return { shapes: newShapes }
      })

      return textShape
    },

    /**
     * Sync bound text position and width when parent is moved or resized.
     */
    syncBoundTextToParent: (parentId: string): void => {
      const state = get()
      const parent = state.shapes.get(parentId)
      if (!parent || !canContainBoundText(parent.type)) return

      const container = parent as RectangleShape | EllipseShape
      const textShape = getBoundTextShape(container, state.shapes)
      if (!textShape) return

      const pad = BOUND_TEXT_PADDING
      const newWidth = Math.max(parent.width - pad * 2, 20)
      const { height } = wrapTextLines(textShape.props.text, newWidth, textShape.props)

      set((s) => {
        const newShapes = new Map(s.shapes)
        newShapes.set(textShape.id, {
          ...textShape,
          x: parent.x + pad,
          y: parent.y + pad,
          width: newWidth,
          height,
        })
        return { shapes: newShapes }
      })
    },

    /**
     * Remove bound text from a container shape.
     */
    removeBoundText: (parentId: string, recordHistory = true): void => {
      const state = get()
      const parent = state.shapes.get(parentId)
      if (!parent || !canContainBoundText(parent.type)) return

      const container = parent as RectangleShape | EllipseShape
      const textShape = getBoundTextShape(container, state.shapes)
      if (!textShape) return

      set((s) => {
        const newShapes = new Map(s.shapes)
        newShapes.delete(textShape.id)

        // Clear parent's boundTextId
        const updatedParent = {
          ...container,
          props: { ...container.props, boundTextId: null },
        } as Shape
        newShapes.set(parentId, updatedParent)

        const historyUpdate = recordHistory
          ? pushHistory(
              s.history,
              s.historyIndex,
              createHistoryEntry({ type: 'delete', shapes: [textShape] }),
            )
          : {}

        return { shapes: newShapes, ...historyUpdate }
      })
    },
  }
}
