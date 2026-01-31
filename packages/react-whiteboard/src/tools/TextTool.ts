import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { TextShape, TextShapeProps, RectangleShape, EllipseShape, Point, Viewport } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'
import { getShapeAtPoint } from '../utils/hitTest'
import { wrapTextLines, measureTextLines, DEFAULT_TEXT_MAX_WIDTH } from '../utils/fonts'
import { BOUND_TEXT_PADDING } from '../utils/boundText'
import { TextInputManager } from './TextInputManager'
import { useWhiteboardStore } from '../core/store'

/**
 * Text tool — click to place text with inline multiline WYSIWYG editing.
 *
 * Editing flow:
 * 1. Click canvas → textarea appears (300px default width, word-wrapping)
 * 2. Click existing text → textarea over shape, wraps at shape.width
 * 3. Type → text wraps, height auto-grows, Enter creates newlines
 * 4. Cmd/Ctrl+Enter or click outside → confirm
 * 5. Escape → cancel
 */
export class TextTool implements ITool {
  readonly type = 'text' as const
  readonly cursor = 'text'
  readonly name = 'Text'

  private inputManager = new TextInputManager()
  private editingShapeId: string | null = null
  private boundParentId: string | null = null
  private currentStore: WhiteboardStore | null = null

  setOverlayContainer(container: HTMLElement | null): void {
    this.inputManager.setOverlayContainer(container)
  }

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
    this.currentStore = store
  }

  onDeactivate(store: WhiteboardStore): void {
    this.cancelEdit()

    // Safety net: restore any shapes accidentally left with opacity=0
    for (const [id, shape] of store.shapes) {
      if (shape.type === 'text' && shape.opacity === 0) {
        store.updateShape(id, { opacity: 1 }, false)
      }
    }

    this.currentStore = null
  }

  startTextAt(position: Point, viewport: Viewport, store: WhiteboardStore): void {
    if (this.inputManager.isActive()) {
      this.handleConfirm(this.inputManager.getValue())
    }
    this.startNewText(position, viewport, store)
  }

  editText(shape: TextShape, viewport: Viewport, store: WhiteboardStore): void {
    if (this.inputManager.isActive()) {
      this.handleConfirm(this.inputManager.getValue())
    }
    this.startEditing(shape, viewport, store)
  }

  editBoundText(
    textShape: TextShape,
    parent: RectangleShape | EllipseShape,
    viewport: Viewport,
    store: WhiteboardStore,
  ): void {
    if (this.inputManager.isActive()) {
      this.handleConfirm(this.inputManager.getValue())
    }
    this.boundParentId = parent.id
    this.startBoundEditing(textShape, parent, viewport, store)
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    _state: ToolState,
  ): PointerDownResult {
    const { canvasPoint } = ctx
    const wasEditing = this.inputManager.isActive()

    if (wasEditing) {
      this.handleConfirm(this.inputManager.getValue())
      // Just confirmed — don't start a new text on the same click
      return { handled: true, capture: false, cursor: 'text' }
    }

    const hitShape = getShapeAtPoint(canvasPoint, store.shapes, store.shapeIds, 2)

    if (hitShape && hitShape.type === 'text') {
      this.startEditing(hitShape as TextShape, ctx.viewport, store)
      return { handled: true, capture: true, cursor: 'text' }
    }

    this.startNewText(canvasPoint, ctx.viewport, store)
    return { handled: true, capture: true, cursor: 'text' }
  }

  onPointerMove(
    _ctx: ToolEventContext,
    _store: WhiteboardStore,
    _state: ToolState,
  ): PointerMoveResult {
    return { handled: false, cursor: 'text' }
  }

  onPointerUp(
    _ctx: ToolEventContext,
    _store: WhiteboardStore,
    _state: ToolState,
  ): PointerUpResult {
    return { handled: false }
  }

  onDoubleClick(ctx: ToolEventContext, store: WhiteboardStore): void {
    const hitShape = getShapeAtPoint(ctx.canvasPoint, store.shapes, store.shapeIds, 2)
    if (hitShape && hitShape.type === 'text') {
      this.startEditing(hitShape as TextShape, ctx.viewport, store)
    }
  }

  onKeyDown(_event: KeyboardEvent, _store: WhiteboardStore): boolean {
    return false
  }

  private startEditing(shape: TextShape, viewport: Viewport, store: WhiteboardStore): void {
    this.editingShapeId = shape.id
    this.currentStore = store

    store.updateShape(shape.id, { opacity: 0 }, false)

    const { text, ...styleProps } = shape.props
    this.inputManager.create(
      { x: shape.x, y: shape.y },
      text,
      styleProps,
      viewport,
      {
        onConfirm: (t) => this.handleConfirm(t),
        onCancel: () => this.cancelEdit(),
      },
      shape.width,
    )

    this.inputManager.subscribeToViewport((listener) =>
      useWhiteboardStore.subscribe((s) => s.viewport, listener),
    )
  }

  private startBoundEditing(
    textShape: TextShape,
    parent: RectangleShape | EllipseShape,
    viewport: Viewport,
    store: WhiteboardStore,
  ): void {
    this.editingShapeId = textShape.id
    this.currentStore = store

    // Hide the bound text during editing (rendered by parent shape)
    store.updateShape(textShape.id, { opacity: 0 }, false)

    const pad = BOUND_TEXT_PADDING
    const maxWidth = Math.max(parent.width - pad * 2, 20)
    const position = { x: parent.x + pad, y: parent.y + pad }

    const { text, ...styleProps } = textShape.props
    this.inputManager.create(
      position,
      text,
      styleProps,
      viewport,
      {
        onConfirm: (t) => this.handleConfirm(t),
        onCancel: () => this.cancelEdit(),
      },
      maxWidth,
    )

    this.inputManager.subscribeToViewport((listener) =>
      useWhiteboardStore.subscribe((s) => s.viewport, listener),
    )
  }

  private startNewText(position: Point, viewport: Viewport, store: WhiteboardStore): void {
    this.editingShapeId = null
    this.currentStore = store

    const textProps = store.currentTextProps
    this.inputManager.create(
      position,
      '',
      textProps,
      viewport,
      {
        onConfirm: (t) => this.handleConfirm(t),
        onCancel: () => this.cancelEdit(),
      },
      DEFAULT_TEXT_MAX_WIDTH,
    )

    this.inputManager.subscribeToViewport((listener) =>
      useWhiteboardStore.subscribe((s) => s.viewport, listener),
    )
  }

  private handleConfirm(text: string): void {
    const store = this.currentStore
    const position = this.inputManager.getEditingPosition()
    const maxWidth = this.inputManager.getMaxWidth()

    if (!store || !position) {
      this.cleanup()
      return
    }

    let confirmedId: string | null = null
    const isBound = this.boundParentId !== null

    if (text) {
      if (this.editingShapeId) {
        const existing = store.shapes.get(this.editingShapeId) as TextShape | undefined
        if (existing) {
          const wrapWidth = isBound ? maxWidth : existing.width
          const { height } = wrapTextLines(text, wrapWidth, existing.props)
          store.updateShape(
            this.editingShapeId,
            { opacity: 1, width: wrapWidth, height, props: { ...existing.props, text } },
            true,
          )
          confirmedId = isBound ? this.boundParentId : this.editingShapeId
        }
      } else {
        const shape = this.createShape(position, text, store.currentTextProps, maxWidth)
        store.addShape(shape, true)
        confirmedId = shape.id
      }
    } else if (this.editingShapeId) {
      if (isBound) {
        // Empty bound text — remove it and clear parent's boundTextId
        store.removeBoundText(this.boundParentId!, false)
        confirmedId = this.boundParentId
      } else {
        store.deleteShape(this.editingShapeId, true)
      }
    }

    this.cleanup()

    if (confirmedId) {
      store.setTool('select')
      store.select(confirmedId)
    }
  }

  private cancelEdit(): void {
    if (this.editingShapeId && this.currentStore) {
      this.currentStore.updateShape(this.editingShapeId, { opacity: 1 }, false)
    }
    this.cleanup()
  }

  private cleanup(): void {
    this.inputManager.destroy()
    this.editingShapeId = null
    this.boundParentId = null
  }

  private createShape(
    position: Point,
    text: string,
    styleProps: Omit<TextShapeProps, 'text'>,
    maxWidth: number,
  ): TextShape {
    // Measure natural width (no wrap) to shrink short text
    const natural = measureTextLines(text, styleProps)
    // Measure wrapped dimensions at the given maxWidth
    const wrapped = wrapTextLines(text, maxWidth, styleProps)

    // Use the smaller of natural width and maxWidth (shrink to fit for short text)
    const width = natural.width <= maxWidth ? natural.width : maxWidth
    const height = natural.width <= maxWidth ? natural.height : wrapped.height

    return {
      id: nanoid(),
      type: 'text',
      x: position.x,
      y: position.y,
      width,
      height,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      seed: Math.floor(Math.random() * 2147483647),
      roughness: 0,
      props: { text, ...styleProps },
    }
  }
}

export const textTool = new TextTool()
