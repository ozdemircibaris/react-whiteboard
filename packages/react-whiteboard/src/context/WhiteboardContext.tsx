import { createContext, useContext, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createWhiteboardStore } from '../core/store/createStore'
import type { WhiteboardStore } from '../core/store/createStore'
import { ToolManager } from '../tools/ToolManager'
import type { TextTool } from '../tools/TextTool'
import { loadFonts } from '../utils/fonts'

// ============================================================================
// Context
// ============================================================================

/** Store API type that includes subscribeWithSelector overloads */
type WhiteboardStoreApi = ReturnType<typeof createWhiteboardStore>

interface WhiteboardContextValue {
  store: WhiteboardStoreApi
  toolManager: ToolManager
}

const WhiteboardContext = createContext<WhiteboardContextValue | null>(null)

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the raw context value (store + toolManager).
 * Throws if used outside <WhiteboardProvider>.
 */
export function useWhiteboardContext(): WhiteboardContextValue {
  const ctx = useContext(WhiteboardContext)
  if (!ctx) {
    throw new Error('useWhiteboardContext must be used within a <WhiteboardProvider>')
  }
  return ctx
}

/**
 * Zustand selector hook — drop-in replacement for the old global useWhiteboardStore.
 *
 * Usage: `const shapes = useWhiteboardStore((s) => s.shapes)`
 */
export function useWhiteboardStore<T>(selector: (state: WhiteboardStore) => T): T {
  const { store } = useWhiteboardContext()
  return useStore(store, selector)
}

/**
 * Access the ToolManager instance for the current whiteboard.
 */
export function useToolManager(): ToolManager {
  const { toolManager } = useWhiteboardContext()
  return toolManager
}

// ============================================================================
// Provider
// ============================================================================

export interface WhiteboardProviderProps {
  children: ReactNode
  /** Custom font URLs to override the default CDN-hosted Virgil + Cascadia Code fonts. */
  fontUrls?: Record<string, string>
}

/**
 * Provides an isolated whiteboard store + tool manager.
 * Multiple <WhiteboardProvider> instances on the same page are fully independent.
 */
export function WhiteboardProvider({ children, fontUrls }: WhiteboardProviderProps) {
  const storeRef = useRef<WhiteboardStoreApi | null>(null)
  const toolManagerRef = useRef<ToolManager | null>(null)

  // Lazy init (runs once per mount, no re-creation on re-render)
  if (!storeRef.current) {
    storeRef.current = createWhiteboardStore()
  }
  if (!toolManagerRef.current) {
    toolManagerRef.current = new ToolManager()
  }

  const store = storeRef.current
  const toolManager = toolManagerRef.current

  // Auto-load hand-drawn fonts on mount
  useEffect(() => {
    loadFonts(fontUrls)
  }, [fontUrls])

  // Wire ToolManager -> store
  useEffect(() => {
    toolManager.setStoreGetter(() => store.getState())

    // Wire TextTool viewport subscriber
    const textTool = toolManager.getTool('text') as TextTool | undefined
    if (textTool) {
      textTool.setStoreSubscriber((listener) =>
        store.subscribe((s) => s.viewport, listener),
      )
    }
  }, [store, toolManager])

  const value = useMemo<WhiteboardContextValue>(
    () => ({ store, toolManager }),
    [store, toolManager],
  )

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  )
}
