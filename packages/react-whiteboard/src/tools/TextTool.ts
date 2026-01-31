import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { TextShape, TextShapeProps, Point, Viewport } from '../types'
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

    if (text) {
      if (this.editingShapeId) {
        // Editing existing shape — wrap at existing width, update height
        const existing = store.shapes.get(this.editingShapeId) as TextShape | undefined
        if (existing) {
          const { height } = wrapTextLines(text, existing.width, existing.props)
          store.updateShape(
            this.editingShapeId,
            { opacity: 1, height, props: { ...existing.props, text } },
            true,
          )
          confirmedId = this.editingShapeId
        }
      } else {
        // New shape — shrink width to fit for short text
        const shape = this.createShape(position, text, store.currentTextProps, maxWidth)
        store.addShape(shape, true)
        confirmedId = shape.id
      }
    } else if (this.editingShapeId) {
      store.deleteShape(this.editingShapeId, true)
    }

    this.cleanup()

    // Switch to select tool with the confirmed shape selected
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
