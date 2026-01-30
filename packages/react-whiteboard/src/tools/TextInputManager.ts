import type { Point, Viewport } from '../types'

/**
 * Default text styling properties
 */
export const DEFAULT_TEXT_PROPS = {
  fontSize: 16,
  fontFamily: 'sans-serif',
  fontWeight: 400,
  color: '#333333',
  align: 'left' as const,
}

export interface TextInputCallbacks {
  onConfirm: (text: string) => void
  onCancel: () => void
}

interface MeasureTextOptions {
  fontSize: number
  fontFamily: string
  fontWeight: number
}

/** Minimum dimensions for the editing textarea */
const MIN_WIDTH = 100
const MIN_HEIGHT_LINES = 1
const PADDING = 4

/**
 * Measures text dimensions using an offscreen canvas context.
 * Returns { width, height } accounting for multiline text.
 */
function measureText(
  text: string,
  options: MeasureTextOptions,
): { width: number; height: number } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { width: MIN_WIDTH, height: options.fontSize * 1.2 }

  ctx.font = `${options.fontWeight} ${options.fontSize}px ${options.fontFamily}`
  const lines = text.split('\n')
  const lineHeight = options.fontSize * 1.2

  let maxWidth = 0
  for (const line of lines) {
    const metrics = ctx.measureText(line || ' ')
    maxWidth = Math.max(maxWidth, metrics.width)
  }

  return {
    width: Math.max(maxWidth + PADDING * 2, MIN_WIDTH),
    height: Math.max(lines.length, MIN_HEIGHT_LINES) * lineHeight,
  }
}

/**
 * Manages an HTML textarea for inline text editing on the canvas.
 *
 * Improvements over previous implementation:
 * - Uses <textarea> instead of <input> for multiline support
 * - Appends to overlay container instead of document.body
 * - Uses Zustand store.subscribe() instead of RAF polling for viewport sync
 * - Auto-resizes as user types
 * - Proper event listener cleanup
 * - No blur race conditions
 */
export class TextInputManager {
  private textareaElement: HTMLTextAreaElement | null = null
  private overlayContainer: HTMLElement | null = null
  private editingPosition: Point | null = null
  private blurTimeoutId: ReturnType<typeof setTimeout> | null = null
  private viewportUnsubscribe: (() => void) | null = null
  private callbacks: TextInputCallbacks | null = null
  private fontSize = DEFAULT_TEXT_PROPS.fontSize
  private isConfirming = false

  /**
   * Set the overlay container for positioning reference.
   * Textarea is appended here instead of document.body.
   */
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
   */
  create(
    position: Point,
    initialText: string,
    fontSize: number,
    viewport: Viewport,
    callbacks: TextInputCallbacks,
  ): void {
    // Clean up any existing textarea first
    if (this.isActive()) {
      this.destroy()
    }

    this.editingPosition = position
    this.callbacks = callbacks
    this.fontSize = fontSize
    this.isConfirming = false

    const textarea = document.createElement('textarea')
    textarea.value = initialText
    textarea.placeholder = 'Type here...'
    textarea.rows = 1
    this.textareaElement = textarea

    this.applyStyles(fontSize, viewport.zoom)
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
   * Much more efficient than RAF polling — only fires when viewport actually changes.
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

  /**
   * Update textarea position based on viewport transform.
   */
  updatePosition(viewport: Viewport): void {
    if (!this.textareaElement || !this.editingPosition) return

    const containerRect = this.overlayContainer?.getBoundingClientRect() || { left: 0, top: 0 }
    const screenX = this.editingPosition.x * viewport.zoom + viewport.x + containerRect.left
    const screenY = this.editingPosition.y * viewport.zoom + viewport.y + containerRect.top

    this.textareaElement.style.left = `${screenX}px`
    this.textareaElement.style.top = `${screenY}px`
    this.textareaElement.style.transform = `scale(${viewport.zoom})`
  }

  /**
   * Clean up and remove the textarea element.
   */
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

  private applyStyles(fontSize: number, zoom: number): void {
    if (!this.textareaElement) return

    Object.assign(this.textareaElement.style, {
      position: 'fixed',
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      border: '2px solid #0066ff',
      borderRadius: '4px',
      outline: 'none',
      background: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      font: `${DEFAULT_TEXT_PROPS.fontWeight} ${fontSize}px ${DEFAULT_TEXT_PROPS.fontFamily}`,
      color: DEFAULT_TEXT_PROPS.color,
      padding: `${PADDING}px`,
      minWidth: `${MIN_WIDTH}px`,
      zIndex: '10000',
      resize: 'none',
      overflow: 'hidden',
      lineHeight: '1.2',
      whiteSpace: 'pre',
      boxSizing: 'border-box',
    })
  }

  /**
   * Auto-resize textarea to fit content.
   */
  private autoResize(): void {
    if (!this.textareaElement) return

    const { width, height } = measureText(this.textareaElement.value || ' ', {
      fontSize: this.fontSize,
      fontFamily: DEFAULT_TEXT_PROPS.fontFamily,
      fontWeight: DEFAULT_TEXT_PROPS.fontWeight,
    })

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

    // Cmd/Ctrl+Enter → confirm
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.stopPropagation()
      this.triggerConfirm()
      return
    }

    // Regular Enter → newline (natural textarea behavior, no preventDefault)
    // Stop propagation to prevent canvas keyboard shortcuts
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
