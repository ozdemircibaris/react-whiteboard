/**
 * Pluggable persistence adapter interface.
 *
 * Implement `save` and `load` to persist whiteboard state to any backend.
 * The optional `clear` method removes persisted data.
 */
export interface PersistenceAdapter {
  save(data: string): Promise<void>
  load(): Promise<string | null>
  clear?(): Promise<void>
}

// ============================================================================
// LocalStorageAdapter
// ============================================================================

export interface LocalStorageAdapterOptions {
  /** localStorage key (default: 'react-whiteboard-document') */
  key?: string
  /** Called when a storage operation fails (e.g. quota exceeded) */
  onError?: (error: Error) => void
}

/**
 * Default persistence adapter backed by `localStorage`.
 *
 * Handles SSR (no `window`), quota-exceeded errors, and private-browsing
 * restrictions gracefully — errors are forwarded to `onError` instead of thrown.
 */
export class LocalStorageAdapter implements PersistenceAdapter {
  private readonly key: string
  private readonly onError?: (error: Error) => void

  constructor(options?: LocalStorageAdapterOptions) {
    this.key = options?.key ?? 'react-whiteboard-document'
    this.onError = options?.onError
  }

  async save(data: string): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(this.key, data)
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  async load(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(this.key)
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(this.key)
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }
}
