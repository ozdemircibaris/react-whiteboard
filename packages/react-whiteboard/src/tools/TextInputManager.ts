import type { Point, Viewport, TextShapeProps } from '../types'
import { resolveFont, measureTextLines, DEFAULT_TEXT_PROPS } from '../utils/fonts'

export { DEFAULT_TEXT_PROPS }

export interface TextInputCallbacks {
  onConfirm: (text: string) => void
  onCancel: () => void
}

/** Minimum dimensions for the editing textarea */
const MIN_WIDTH = 100
const PADDING = 4

/**
 * Manages an HTML textarea for inline WYSIWYG text editing on the canvas.
 *
 * The textarea visually matches the final rendered shape:
 * same font, color, background, alignment, and line height.
 */
export class TextInputManager {
  private textareaElement: HTMLTextAreaElement | null = null
  private overlayContainer: HTMLElement | null = null
  private editingPosition: Point | null = null
  private blurTimeoutId: ReturnType<typeof setTimeout> | null = null
  private viewportUnsubscribe: (() => void) | null = null
  private callbacks: TextInputCallbacks | null = null
  private textProps: Omit<TextShapeProps, 'text'> = DEFAULT_TEXT_PROPS
  private isConfirming = false

  setOverlayContainer(container: HTMLElement | null): void {
    this.overlayContainer = container
  }

  isActive(): boolean {
    return this.textareaElement !== null
  }

  getEditingPosition(): Point | null {
    return this.editingPosition
  }

  getValue(): string {
    return this.textareaElement?.value.trim() ?? ''
  }

  /**
   * Create and show the textarea element for editing.
   * Accepts full text props for WYSIWYG styling.
   */
  create(
    position: Point,
    initialText: string,
    textProps: Omit<TextShapeProps, 'text'>,
    viewport: Viewport,
    callbacks: TextInputCallbacks,
  ): void {
    if (this.isActive()) {
      this.destroy()
    }

    this.editingPosition = position
    this.callbacks = callbacks
    this.textProps = textProps
    this.isConfirming = false

    const textarea = document.createElement('textarea')
    textarea.value = initialText
    textarea.placeholder = 'Type here...'
    textarea.rows = 1
    this.textareaElement = textarea

    this.applyStyles(textProps, viewport.zoom)
    this.updatePosition(viewport)
    this.autoResize()

    textarea.addEventListener('keydown', this.handleKeyDown)
    textarea.addEventListener('blur', this.handleBlur)
    textarea.addEventListener('input', this.handleInput)

    const container = this.overlayContainer ?? document.body
    container.appendChild(textarea)

    requestAnimationFrame(() => {
      textarea.focus()
      if (initialText) {
        textarea.select()
      }
    })
  }

  /**
   * Subscribe to viewport changes via Zustand store.subscribe().
   */
  subscribeToViewport(
    subscribe: (listener: (viewport: Viewport) => void) => () => void,
  ): void {
    if (this.viewportUnsubscribe) {
      this.viewportUnsubscribe()
    }

    this.viewportUnsubscribe = subscribe((viewport) => {
      this.updatePosition(viewport)
      if (this.textareaElement) {
        this.textareaElement.style.transform = `scale(${viewport.zoom})`
      }
    })
  }

  updatePosition(viewport: Viewport): void {
    if (!this.textareaElement || !this.editingPosition) return

    const containerRect = this.overlayContainer?.getBoundingClientRect() || { left: 0, top: 0 }
    const screenX = this.editingPosition.x * viewport.zoom + viewport.x + containerRect.left
    const screenY = this.editingPosition.y * viewport.zoom + viewport.y + containerRect.top

    this.textareaElement.style.left = `${screenX}px`
    this.textareaElement.style.top = `${screenY}px`
    this.textareaElement.style.transform = `scale(${viewport.zoom})`
  }

  destroy(): void {
    if (this.blurTimeoutId !== null) {
      clearTimeout(this.blurTimeoutId)
      this.blurTimeoutId = null
    }

    if (this.viewportUnsubscribe) {
      this.viewportUnsubscribe()
      this.viewportUnsubscribe = null
    }

    if (this.textareaElement) {
      this.textareaElement.removeEventListener('keydown', this.handleKeyDown)
      this.textareaElement.removeEventListener('blur', this.handleBlur)
      this.textareaElement.removeEventListener('input', this.handleInput)
      this.textareaElement.remove()
      this.textareaElement = null
    }

    this.editingPosition = null
    this.callbacks = null
    this.isConfirming = false
  }

  /**
   * Apply WYSIWYG styles — textarea matches the final canvas rendering.
   */
  private applyStyles(props: Omit<TextShapeProps, 'text'>, zoom: number): void {
    if (!this.textareaElement) return

    const hasBg = props.backgroundColor && props.backgroundColor !== 'transparent'

    Object.assign(this.textareaElement.style, {
      position: 'fixed',
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      border: '2px solid #0066ff',
      borderRadius: '4px',
      outline: 'none',
      background: hasBg ? props.backgroundColor : 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      font: resolveFont(props),
      color: props.color,
      textAlign: props.align,
      lineHeight: String(props.lineHeight),
      padding: `${PADDING}px`,
      minWidth: `${MIN_WIDTH}px`,
      zIndex: '10000',
      resize: 'none',
      overflow: 'hidden',
      whiteSpace: 'pre',
      boxSizing: 'border-box',
    })
  }

  private autoResize(): void {
    if (!this.textareaElement) return

    const { width, height } = measureTextLines(
      this.textareaElement.value || ' ',
      this.textProps,
    )

    this.textareaElement.style.width = `${width}px`
    this.textareaElement.style.height = `${height + PADDING * 2}px`
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.callbacks?.onCancel()
      return
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.stopPropagation()
      this.triggerConfirm()
      return
    }

    e.stopPropagation()
  }

  private handleBlur = (): void => {
    if (this.isConfirming) return

    if (this.blurTimeoutId !== null) {
      clearTimeout(this.blurTimeoutId)
    }

    this.blurTimeoutId = setTimeout(() => {
      this.blurTimeoutId = null
      if (this.textareaElement && !this.isConfirming) {
        this.triggerConfirm()
      }
    }, 150)
  }

  private handleInput = (): void => {
    this.autoResize()
  }

  private triggerConfirm(): void {
    if (this.isConfirming) return
    this.isConfirming = true

    if (this.blurTimeoutId !== null) {
      clearTimeout(this.blurTimeoutId)
      this.blurTimeoutId = null
    }

    this.callbacks?.onConfirm(this.getValue())
  }
}
