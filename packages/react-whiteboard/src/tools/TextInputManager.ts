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

/**
 * Manages the HTML input element for text editing
 * Handles creation, positioning, events, and cleanup
 */
export class TextInputManager {
  private inputElement: HTMLInputElement | null = null
  private overlayContainer: HTMLElement | null = null
  private editingPosition: Point | null = null
  private blurTimeoutId: ReturnType<typeof setTimeout> | null = null
  private viewportUnsubscribe: (() => void) | null = null
  private callbacks: TextInputCallbacks | null = null

  /**
   * Set the overlay container for positioning reference
   */
  setOverlayContainer(container: HTMLElement | null): void {
    this.overlayContainer = container
  }

  /**
   * Check if currently editing
   */
  isActive(): boolean {
    return this.inputElement !== null
  }

  /**
   * Get the current editing position
   */
  getEditingPosition(): Point | null {
    return this.editingPosition
  }

  /**
   * Create and show the input element
   */
  create(
    position: Point,
    initialText: string,
    fontSize: number,
    viewport: Viewport,
    callbacks: TextInputCallbacks
  ): void {
    this.editingPosition = position
    this.callbacks = callbacks

    this.inputElement = document.createElement('input')
    this.inputElement.type = 'text'
    this.inputElement.value = initialText
    this.inputElement.placeholder = 'Type here...'

    this.updatePosition(viewport)
    this.applyStyles(fontSize, viewport.zoom)

    this.inputElement.addEventListener('keydown', this.handleKeyDown)
    this.inputElement.addEventListener('blur', this.handleBlur)

    document.body.appendChild(this.inputElement)

    requestAnimationFrame(() => {
      this.inputElement?.focus()
      this.inputElement?.select()
    })
  }

  /**
   * Get the current input value
   */
  getValue(): string {
    return this.inputElement?.value.trim() ?? ''
  }

  /**
   * Update input position based on viewport
   */
  updatePosition(viewport: Viewport): void {
    if (!this.inputElement || !this.editingPosition) return

    const containerRect = this.overlayContainer?.getBoundingClientRect() || { left: 0, top: 0 }
    const screenX = this.editingPosition.x * viewport.zoom + viewport.x + containerRect.left
    const screenY = this.editingPosition.y * viewport.zoom + viewport.y + containerRect.top

    this.inputElement.style.left = `${screenX}px`
    this.inputElement.style.top = `${screenY}px`
    this.inputElement.style.transform = `scale(${viewport.zoom})`
  }

  /**
   * Subscribe to viewport changes for position sync
   */
  subscribeToViewport(getViewport: () => Viewport): void {
    let prevViewport = getViewport()
    let animFrameId: number | null = null

    const checkViewport = (): void => {
      if (!this.inputElement || !this.editingPosition) {
        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId)
          animFrameId = null
        }
        return
      }

      const viewport = getViewport()
      if (
        viewport.x !== prevViewport.x ||
        viewport.y !== prevViewport.y ||
        viewport.zoom !== prevViewport.zoom
      ) {
        this.updatePosition(viewport)
        prevViewport = viewport
      }

      animFrameId = requestAnimationFrame(checkViewport)
    }

    animFrameId = requestAnimationFrame(checkViewport)

    this.viewportUnsubscribe = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId)
        animFrameId = null
      }
    }
  }

  /**
   * Clean up and remove the input element
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

    if (this.inputElement) {
      this.inputElement.removeEventListener('keydown', this.handleKeyDown)
      this.inputElement.removeEventListener('blur', this.handleBlur)
      this.inputElement.remove()
      this.inputElement = null
    }

    this.editingPosition = null
    this.callbacks = null
  }

  /**
   * Apply styles to the input element
   */
  private applyStyles(fontSize: number, zoom: number): void {
    if (!this.inputElement) return

    Object.assign(this.inputElement.style, {
      position: 'fixed',
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      border: '2px solid #0066ff',
      borderRadius: '4px',
      outline: 'none',
      background: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      font: `${DEFAULT_TEXT_PROPS.fontWeight} ${fontSize}px ${DEFAULT_TEXT_PROPS.fontFamily}`,
      color: DEFAULT_TEXT_PROPS.color,
      padding: '4px 8px',
      minWidth: '150px',
      zIndex: '10000',
    })
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      this.triggerConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.callbacks?.onCancel()
    }
  }

  /**
   * Handle blur event with debounce
   */
  private handleBlur = (): void => {
    if (this.blurTimeoutId !== null) {
      clearTimeout(this.blurTimeoutId)
    }

    this.blurTimeoutId = setTimeout(() => {
      this.blurTimeoutId = null
      if (this.inputElement) {
        this.triggerConfirm()
      }
    }, 100)
  }

  /**
   * Trigger confirm callback
   */
  private triggerConfirm(): void {
    if (this.blurTimeoutId !== null) {
      clearTimeout(this.blurTimeoutId)
      this.blurTimeoutId = null
    }
    this.callbacks?.onConfirm(this.getValue())
  }
}
