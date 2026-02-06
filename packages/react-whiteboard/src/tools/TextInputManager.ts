import type { Point, Viewport, TextShapeProps } from '../types'
import { resolveFont, wrapTextLines, DEFAULT_TEXT_PROPS } from '../utils/fonts'

export { DEFAULT_TEXT_PROPS }

export interface TextInputCallbacks {
  onConfirm: (text: string) => void
  onCancel: () => void
  /** Called when bold/italic is toggled via keyboard shortcut during editing */
  onStyleChange?: (props: Partial<Omit<TextShapeProps, 'text'>>) => void
}

/** Minimum dimensions for the editing textarea */
const MIN_WIDTH = 20

/**
 * Manages an HTML textarea for inline WYSIWYG text editing on the canvas.
 *
 * The textarea visually matches the final rendered shape:
 * same font, color, background, alignment, and line height.
 * Text wraps at the given maxWidth, only height auto-grows.
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
  private maxWidth = 300

  setOverlayContainer(container: HTMLElement | null): void {
    this.overlayContainer = container
  }

  isActive(): boolean {
    return this.textareaElement !== null
  }

  getEditingPosition(): Point | null {
    return this.editingPosition
  }

  getMaxWidth(): number {
    return this.maxWidth
  }

  getValue(): string {
    return this.textareaElement?.value.trimEnd() ?? ''
  }

  /**
   * Create and show the textarea element for editing.
   * @param maxWidth - Fixed width for word-wrapping (in canvas units).
   */
  create(
    position: Point,
    initialText: string,
    textProps: Omit<TextShapeProps, 'text'>,
    viewport: Viewport,
    callbacks: TextInputCallbacks,
    maxWidth: number,
  ): void {
    if (this.isActive()) {
      this.destroy()
    }

    this.editingPosition = position
    this.callbacks = callbacks
    this.textProps = textProps
    this.isConfirming = false
    this.maxWidth = maxWidth

    const textarea = document.createElement('textarea')
    textarea.value = initialText
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
   * Apply WYSIWYG styles — textarea is invisible except for text and cursor.
   * Fixed width with word-wrap; only height auto-grows.
   */
  private applyStyles(props: Omit<TextShapeProps, 'text'>, zoom: number): void {
    if (!this.textareaElement) return

    const hasBg = props.backgroundColor && props.backgroundColor !== 'transparent'

    Object.assign(this.textareaElement.style, {
      position: 'fixed',
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      border: 'none',
      outline: 'none',
      background: hasBg ? props.backgroundColor : 'transparent',
      boxShadow: 'none',
      font: resolveFont(props),
      color: props.color,
      textAlign: props.align,
      lineHeight: String(props.lineHeight),
      padding: '0',
      margin: '0',
      width: `${this.maxWidth}px`,
      minWidth: `${MIN_WIDTH}px`,
      minHeight: `${Math.ceil(props.fontSize * props.lineHeight)}px`,
      zIndex: '10000',
      resize: 'none',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      boxSizing: 'border-box',
      caretColor: props.color || '#1e1e1e',
      pointerEvents: 'auto',
    })
  }

  /** Only adjust height — width is fixed at maxWidth for word-wrapping. */
  private autoResize(): void {
    if (!this.textareaElement) return

    const { height } = wrapTextLines(
      this.textareaElement.value || ' ',
      this.maxWidth,
      this.textProps,
    )

    this.textareaElement.style.height = `${Math.ceil(height)}px`
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

    // Bold toggle: Cmd+B / Ctrl+B
    if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.stopPropagation()
      this.toggleBold()
      return
    }

    // Italic toggle: Cmd+I / Ctrl+I
    if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.stopPropagation()
      this.toggleItalic()
      return
    }

    e.stopPropagation()
  }

  private toggleBold(): void {
    const next = this.textProps.fontWeight === 700 ? 400 : 700
    this.textProps = { ...this.textProps, fontWeight: next }
    this.refreshStyles()
    this.callbacks?.onStyleChange?.({ fontWeight: next })
  }

  private toggleItalic(): void {
    const next = this.textProps.fontStyle === 'italic' ? 'normal' as const : 'italic' as const
    this.textProps = { ...this.textProps, fontStyle: next }
    this.refreshStyles()
    this.callbacks?.onStyleChange?.({ fontStyle: next })
  }

  private refreshStyles(): void {
    if (!this.textareaElement) return
    this.textareaElement.style.font = resolveFont(this.textProps)
    this.autoResize()
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
