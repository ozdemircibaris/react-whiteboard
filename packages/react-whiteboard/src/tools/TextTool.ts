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

/**
 * Default text properties
 */
const DEFAULT_TEXT_PROPS = {
  fontSize: 16,
  fontFamily: 'sans-serif',
  fontWeight: 400,
  color: '#333333',
  align: 'left' as const,
}

/**
 * Text tool - click to place text with inline editing
 */
export class TextTool implements ITool {
  readonly type = 'text' as const
  readonly cursor = 'text'
  readonly name = 'Text'

  private isEditing = false
  private editingShapeId: string | null = null
  private editingPosition: Point | null = null
  private inputElement: HTMLInputElement | null = null
  private currentStore: WhiteboardStore | null = null

  /** Overlay container set by Canvas component */
  private static overlayContainer: HTMLElement | null = null

  /** Viewport update callback for syncing input position */
  private viewportUnsubscribe: (() => void) | null = null

  /**
   * Set the overlay container for text input
   * Called by Canvas component
   */
  static setOverlayContainer(container: HTMLElement | null): void {
    TextTool.overlayContainer = container
  }

  onActivate(store: WhiteboardStore): void {
    store.clearSelection()
    this.currentStore = store
  }

  onDeactivate(_store: WhiteboardStore): void {
    this.cancelEdit()
    this.currentStore = null
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    _state: ToolState
  ): PointerDownResult {
    const { canvasPoint } = ctx

    // If already editing, confirm the edit first
    if (this.isEditing) {
      this.confirmEdit()
    }

    // Check if clicking on existing text shape
    const hitShape = getShapeAtPoint(canvasPoint, store.shapes, store.shapeIds, 2)

    if (hitShape && hitShape.type === 'text') {
      // Edit existing text
      this.startEditing(hitShape as TextShape, ctx.viewport, store)
      return { handled: true, capture: true, cursor: 'text' }
    }

    // Create new text at click position
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
    // Let the input handle keyboard events when editing
    if (this.isEditing) {
      return false // Don't consume, let input handle it
    }
    return false
  }

  /**
   * Start editing an existing text shape
   */
  private startEditing(
    shape: TextShape,
    viewport: Viewport,
    store: WhiteboardStore
  ): void {
    this.isEditing = true
    this.editingShapeId = shape.id
    this.editingPosition = { x: shape.x, y: shape.y }
    this.currentStore = store

    // Hide the shape while editing
    store.updateShape(shape.id, { opacity: 0 }, false)

    this.createInputElement(shape.props.text, shape.props.fontSize, viewport)
    this.subscribeToViewport(store)
  }

  /**
   * Start creating new text
   */
  private startNewText(
    position: Point,
    viewport: Viewport,
    store: WhiteboardStore
  ): void {
    this.isEditing = true
    this.editingShapeId = null
    this.editingPosition = position
    this.currentStore = store

    this.createInputElement('', DEFAULT_TEXT_PROPS.fontSize, viewport)
    this.subscribeToViewport(store)
  }

  /**
   * Create the HTML input element for text editing
   */
  private createInputElement(
    initialText: string,
    fontSize: number,
    viewport: Viewport
  ): void {
    if (!TextTool.overlayContainer || !this.editingPosition) return

    this.inputElement = document.createElement('input')
    this.inputElement.type = 'text'
    this.inputElement.value = initialText
    this.inputElement.placeholder = 'Type here...'

    // Calculate screen position
    const screenX = this.editingPosition.x * viewport.zoom + viewport.x
    const screenY = this.editingPosition.y * viewport.zoom + viewport.y

    Object.assign(this.inputElement.style, {
      position: 'absolute',
      left: `${screenX}px`,
      top: `${screenY}px`,
      transform: `scale(${viewport.zoom})`,
      transformOrigin: 'top left',
      border: '2px solid #0066ff',
      borderRadius: '2px',
      outline: 'none',
      background: 'white',
      font: `${DEFAULT_TEXT_PROPS.fontWeight} ${fontSize}px ${DEFAULT_TEXT_PROPS.fontFamily}`,
      color: DEFAULT_TEXT_PROPS.color,
      padding: '2px 4px',
      minWidth: '100px',
      zIndex: '1000',
      pointerEvents: 'auto',
    })

    // Event handlers
    this.inputElement.addEventListener('keydown', this.handleInputKeyDown)
    this.inputElement.addEventListener('blur', this.handleInputBlur)

    TextTool.overlayContainer.appendChild(this.inputElement)

    // Focus and select all text
    requestAnimationFrame(() => {
      this.inputElement?.focus()
      this.inputElement?.select()
    })
  }

  /**
   * Handle keyboard events in the input
   */
  private handleInputKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      this.confirmEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.cancelEdit()
    }
  }

  /**
   * Handle input blur (click outside)
   */
  private handleInputBlur = (): void => {
    // Small delay to allow click events to process first
    setTimeout(() => {
      if (this.isEditing) {
        this.confirmEdit()
      }
    }, 100)
  }

  /**
   * Confirm the edit and create/update shape
   */
  private confirmEdit(): void {
    if (!this.inputElement || !this.currentStore || !this.editingPosition) {
      this.cleanupEdit()
      return
    }

    const text = this.inputElement.value.trim()
    const store = this.currentStore

    if (text) {
      if (this.editingShapeId) {
        // Update existing shape - merge with existing props
        const existingShape = store.shapes.get(this.editingShapeId) as TextShape | undefined
        if (existingShape) {
          store.updateShape(
            this.editingShapeId,
            {
              opacity: 1,
              props: { ...existingShape.props, text },
            },
            true
          )
          store.select(this.editingShapeId)
        }
      } else {
        // Create new shape
        const shape = this.createShape(this.editingPosition, text)
        store.addShape(shape, true)
        store.select(shape.id)
      }
    } else if (this.editingShapeId) {
      // Empty text on existing shape - restore opacity
      store.updateShape(this.editingShapeId, { opacity: 1 }, false)
    }

    this.cleanupEdit()
  }

  /**
   * Cancel the edit without saving
   */
  private cancelEdit(): void {
    if (this.editingShapeId && this.currentStore) {
      // Restore the original shape's opacity
      this.currentStore.updateShape(this.editingShapeId, { opacity: 1 }, false)
    }
    this.cleanupEdit()
  }

  /**
   * Clean up editing state
   */
  private cleanupEdit(): void {
    if (this.inputElement) {
      this.inputElement.removeEventListener('keydown', this.handleInputKeyDown)
      this.inputElement.removeEventListener('blur', this.handleInputBlur)
      this.inputElement.remove()
      this.inputElement = null
    }

    if (this.viewportUnsubscribe) {
      this.viewportUnsubscribe()
      this.viewportUnsubscribe = null
    }

    this.isEditing = false
    this.editingShapeId = null
    this.editingPosition = null
  }

  /**
   * Subscribe to viewport changes to update input position
   */
  private subscribeToViewport(store: WhiteboardStore): void {
    // Simple polling approach - check viewport every 100ms
    // A more sophisticated approach would use store subscription
    const checkViewport = (): void => {
      if (!this.isEditing || !this.inputElement || !this.editingPosition) return

      const viewport = store.viewport
      this.syncInputPosition(viewport)
    }

    const intervalId = setInterval(checkViewport, 100)
    this.viewportUnsubscribe = () => clearInterval(intervalId)
  }

  /**
   * Update input position to match viewport
   */
  private syncInputPosition(viewport: Viewport): void {
    if (!this.inputElement || !this.editingPosition) return

    const screenX = this.editingPosition.x * viewport.zoom + viewport.x
    const screenY = this.editingPosition.y * viewport.zoom + viewport.y

    this.inputElement.style.left = `${screenX}px`
    this.inputElement.style.top = `${screenY}px`
    this.inputElement.style.transform = `scale(${viewport.zoom})`
  }

  /**
   * Create text shape
   */
  private createShape(position: Point, text: string): TextShape {
    const { fontSize, fontFamily, fontWeight, color, align } = DEFAULT_TEXT_PROPS

    // Measure text for bounds (approximate)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    let width = 50
    let height = fontSize * 1.2

    if (ctx) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      const metrics = ctx.measureText(text)
      width = Math.max(metrics.width + 8, 50) // Add padding
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
      props: {
        text,
        fontSize,
        fontFamily,
        fontWeight,
        color,
        align,
      },
    }
  }
}

export const textTool = new TextTool()
