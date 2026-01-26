import { nanoid } from 'nanoid'
import type { WhiteboardStore } from '../core/store'
import type { TextShape, Point, Viewport } from '../types'
import type {
  ITool,
  ToolEventContext,
  ToolState,
  PointerDownResult,
  PointerMoveResult,
  PointerUpResult,
} from './types'
import { getShapeAtPoint } from '../utils/hitTest'
import { TextInputManager, DEFAULT_TEXT_PROPS } from './TextInputManager'

/**
 * Text tool - click to place text with inline editing
 */
export class TextTool implements ITool {
  readonly type = 'text' as const
  readonly cursor = 'text'
  readonly name = 'Text'

  private inputManager = new TextInputManager()
  private editingShapeId: string | null = null
  private currentStore: WhiteboardStore | null = null

  /**
   * Set the overlay container for text input positioning
   */
  setOverlayContainer(container: HTMLElement | null): void {
    this.inputManager.setOverlayContainer(container)
  }

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
    this.currentStore = store
  }

  onDeactivate(_store: WhiteboardStore): void {
    this.cancelEdit()
    this.currentStore = null
  }

  /**
   * Public method to start new text at a position
   */
  startTextAt(position: Point, viewport: Viewport, store: WhiteboardStore): void {
    if (this.inputManager.isActive()) {
      this.handleConfirm(this.inputManager.getValue())
    }
    this.startNewText(position, viewport, store)
  }

  /**
   * Public method to edit existing text shape
   */
  editText(shape: TextShape, viewport: Viewport, store: WhiteboardStore): void {
    if (this.inputManager.isActive()) {
      this.handleConfirm(this.inputManager.getValue())
    }
    this.startEditing(shape, viewport, store)
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    _state: ToolState
  ): PointerDownResult {
    const { canvasPoint } = ctx

    if (this.inputManager.isActive()) {
      this.handleConfirm(this.inputManager.getValue())
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
    _state: ToolState
  ): PointerMoveResult {
    return { handled: false, cursor: 'text' }
  }

  onPointerUp(
    _ctx: ToolEventContext,
    _store: WhiteboardStore,
    _state: ToolState
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

    this.inputManager.create(
      { x: shape.x, y: shape.y },
      shape.props.text,
      shape.props.fontSize,
      viewport,
      {
        onConfirm: (text) => this.handleConfirm(text),
        onCancel: () => this.cancelEdit(),
      }
    )
    this.inputManager.subscribeToViewport(() => store.viewport)
  }

  private startNewText(position: Point, viewport: Viewport, store: WhiteboardStore): void {
    this.editingShapeId = null
    this.currentStore = store

    this.inputManager.create(
      position,
      '',
      DEFAULT_TEXT_PROPS.fontSize,
      viewport,
      {
        onConfirm: (text) => this.handleConfirm(text),
        onCancel: () => this.cancelEdit(),
      }
    )
    this.inputManager.subscribeToViewport(() => store.viewport)
  }

  private handleConfirm(text: string): void {
    const store = this.currentStore
    const position = this.inputManager.getEditingPosition()

    if (!store || !position) {
      this.cleanup()
      return
    }

    if (text) {
      if (this.editingShapeId) {
        const existingShape = store.shapes.get(this.editingShapeId) as TextShape | undefined
        if (existingShape) {
          store.updateShape(
            this.editingShapeId,
            { opacity: 1, props: { ...existingShape.props, text } },
            true
          )
          store.select(this.editingShapeId)
        }
      } else {
        const shape = this.createShape(position, text)
        store.addShape(shape, true)
        store.select(shape.id)
      }
    } else if (this.editingShapeId) {
      const existingShape = store.shapes.get(this.editingShapeId)
      if (existingShape) {
        store.updateShape(this.editingShapeId, { opacity: 1 }, false)
      }
    }

    this.cleanup()
  }

  private cancelEdit(): void {
    if (this.editingShapeId && this.currentStore) {
      const existingShape = this.currentStore.shapes.get(this.editingShapeId)
      if (existingShape) {
        this.currentStore.updateShape(this.editingShapeId, { opacity: 1 }, false)
      }
    }
    this.cleanup()
  }

  private cleanup(): void {
    this.inputManager.destroy()
    this.editingShapeId = null
  }

  private createShape(position: Point, text: string): TextShape {
    const { fontSize, fontFamily, fontWeight, color, align } = DEFAULT_TEXT_PROPS

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    let width = 50
    const height = fontSize * 1.2

    if (ctx) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      const metrics = ctx.measureText(text)
      width = Math.max(metrics.width + 8, 50)
    }

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
      props: { text, fontSize, fontFamily, fontWeight, color, align },
    }
  }
}

export const textTool = new TextTool()
