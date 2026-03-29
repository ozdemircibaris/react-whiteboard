import { createContext, useContext, useRef, useMemo, useEffect, useCallback, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createWhiteboardStore } from '../core/store/createStore'
import type { WhiteboardStore } from '../core/store/createStore'
import { ToolManager } from '../tools/ToolManager'
import type { ITool } from '../tools/types'
import type { TextTool } from '../tools/TextTool'
import { ShapeRendererRegistry } from '../core/renderer/ShapeRendererRegistry'
import type { CustomShapeRenderer } from '../core/renderer/ShapeRendererRegistry'
import { WhiteboardErrorBoundary } from '../components/WhiteboardErrorBoundary'
import type { WhiteboardErrorBoundaryProps } from '../components/WhiteboardErrorBoundary'
import { loadFonts } from '../utils/fonts'
import { parseDocument, documentToStoreData, exportToJSON } from '../utils/serialization'
import type { PersistenceAdapter } from '../persistence'

// ============================================================================
// Context
// ============================================================================

/** Store API type that includes subscribeWithSelector overloads */
type WhiteboardStoreApi = ReturnType<typeof createWhiteboardStore>

interface WhiteboardContextValue {
  store: WhiteboardStoreApi
  toolManager: ToolManager
  shapeRendererRegistry: ShapeRendererRegistry
}

const WhiteboardContext = createContext<WhiteboardContextValue | null>(null)

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the raw context value (store + toolManager + shapeRendererRegistry).
 * Throws if used outside <WhiteboardProvider>.
 * @internal
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
 * @public
 */
export function useWhiteboardStore<T>(selector: (state: WhiteboardStore) => T): T {
  const { store } = useWhiteboardContext()
  return useStore(store, selector)
}

/**
 * Access the ToolManager instance for the current whiteboard.
 * @public
 */
export function useToolManager(): ToolManager {
  const { toolManager } = useWhiteboardContext()
  return toolManager
}

/**
 * Access the ShapeRendererRegistry for registering custom shape renderers.
 * @public
 */
export function useShapeRendererRegistry(): ShapeRendererRegistry {
  const { shapeRendererRegistry } = useWhiteboardContext()
  return shapeRendererRegistry
}

// ============================================================================
// Provider
// ============================================================================

const DEFAULT_AUTOSAVE_INTERVAL = 5000

/** @public */
export interface WhiteboardProviderProps {
  children: ReactNode
  /** Custom font URLs to override the default CDN-hosted Virgil + Cascadia Code fonts. */
  fontUrls?: Record<string, string>
  /** Custom shape renderers to register (additive to built-in shapes) */
  customShapes?: CustomShapeRenderer[]
  /** Custom tools to register (additive to default tools) */
  tools?: ITool[]
  /** Persistence adapter for saving/loading whiteboard state. */
  persistenceAdapter?: PersistenceAdapter
  /** Autosave interval in ms (default: 5000). Set to 0 to disable autosave. */
  autosaveInterval?: number
  /** Called when a persistence operation fails. */
  onPersistenceError?: (error: Error) => void
  /** Custom error boundary fallback (ReactNode or render function). */
  errorFallback?: WhiteboardErrorBoundaryProps['fallback']
  /** Called when a rendering error is caught by the error boundary. */
  onError?: WhiteboardErrorBoundaryProps['onError']
}

/**
 * Provides an isolated whiteboard store + tool manager + shape renderer registry.
 * Multiple <WhiteboardProvider> instances on the same page are fully independent.
 * @public
 */
export function WhiteboardProvider({
  children,
  fontUrls,
  customShapes,
  tools,
  persistenceAdapter,
  autosaveInterval = DEFAULT_AUTOSAVE_INTERVAL,
  onPersistenceError,
  errorFallback,
  onError,
}: WhiteboardProviderProps) {
  const storeRef = useRef<WhiteboardStoreApi | null>(null)
  const toolManagerRef = useRef<ToolManager | null>(null)
  const registryRef = useRef<ShapeRendererRegistry | null>(null)

  // Lazy init (runs once per mount, no re-creation on re-render)
  if (!storeRef.current) {
    storeRef.current = createWhiteboardStore()
  }
  if (!toolManagerRef.current) {
    toolManagerRef.current = new ToolManager()
  }
  if (!registryRef.current) {
    registryRef.current = new ShapeRendererRegistry()
  }

  const store = storeRef.current
  const toolManager = toolManagerRef.current
  const registry = registryRef.current

  // Auto-load hand-drawn fonts on mount
  useEffect(() => {
    loadFonts(fontUrls)
  }, [fontUrls])

  // Wire ToolManager -> store + registry
  useEffect(() => {
    toolManager.setStoreGetter(() => store.getState())
    toolManager.setRegistry(registry)

    // Sync currentTool → ToolManager synchronously via store subscription.
    // This avoids the async gap when using a React useEffect in useTools,
    // which could cause pointer events to be routed to the wrong tool.
    const unsubTool = store.subscribe(
      (s) => s.currentTool,
      (tool) => toolManager.setActiveTool(tool),
    )

    // Wire TextTool viewport subscriber
    const textTool = toolManager.getTool('text') as TextTool | undefined
    if (textTool) {
      textTool.setStoreSubscriber((listener) =>
        store.subscribe((s) => s.viewport, listener),
      )
    }

    return () => { unsubTool() }
  }, [store, toolManager, registry])

  // Register/unregister custom shape renderers from props
  useEffect(() => {
    if (!customShapes) return
    for (const renderer of customShapes) {
      registry.registerRenderer(renderer)
    }
    return () => {
      for (const renderer of customShapes) {
        registry.unregisterRenderer(renderer.type)
      }
    }
  }, [customShapes, registry])

  // Register/unregister custom tools from props
  useEffect(() => {
    if (!tools) return
    for (const tool of tools) {
      toolManager.registerTool(tool)
    }
    return () => {
      for (const tool of tools) {
        toolManager.unregisterTool(tool.type)
      }
    }
  }, [tools, toolManager])

  // ---- Persistence: load on mount ----
  const persistenceLoadedRef = useRef(false)
  const onPersistenceErrorRef = useRef(onPersistenceError)
  onPersistenceErrorRef.current = onPersistenceError

  useEffect(() => {
    if (!persistenceAdapter) {
      persistenceLoadedRef.current = true
      return
    }

    let cancelled = false

    persistenceAdapter.load().then((raw) => {
      if (cancelled || !raw) {
        persistenceLoadedRef.current = true
        return
      }
      try {
        const doc = parseDocument(raw)
        const { shapes, shapeIds, viewport } = documentToStoreData(doc)
        store.getState().loadDocument(shapes, shapeIds, viewport)
      } catch (err) {
        onPersistenceErrorRef.current?.(err instanceof Error ? err : new Error(String(err)))
        persistenceAdapter.clear?.()
      } finally {
        persistenceLoadedRef.current = true
      }
    }).catch((err) => {
      onPersistenceErrorRef.current?.(err instanceof Error ? err : new Error(String(err)))
      persistenceLoadedRef.current = true
    })

    return () => { cancelled = true }
  }, [store, persistenceAdapter])

  // ---- Persistence: autosave ----
  const dirtyRef = useRef(false)

  useEffect(() => {
    if (!persistenceAdapter) return
    const unsub = store.subscribe(
      (s) => [s.shapes, s.shapeIds] as const,
      () => { dirtyRef.current = true },
    )
    return unsub
  }, [store, persistenceAdapter])

  const saveToAdapter = useCallback(async () => {
    if (!persistenceAdapter || !dirtyRef.current || !persistenceLoadedRef.current) return
    dirtyRef.current = false
    try {
      const { shapes, shapeIds, viewport } = store.getState()
      const json = await exportToJSON(shapes, shapeIds, viewport)
      await persistenceAdapter.save(json)
    } catch (err) {
      onPersistenceErrorRef.current?.(err instanceof Error ? err : new Error(String(err)))
    }
  }, [store, persistenceAdapter])

  useEffect(() => {
    if (!persistenceAdapter || autosaveInterval === 0) return
    const id = setInterval(saveToAdapter, autosaveInterval)
    return () => clearInterval(id)
  }, [persistenceAdapter, autosaveInterval, saveToAdapter])

  const value = useMemo<WhiteboardContextValue>(
    () => ({ store, toolManager, shapeRendererRegistry: registry }),
    [store, toolManager, registry],
  )

  return (
    <WhiteboardContext.Provider value={value}>
      <WhiteboardErrorBoundary fallback={errorFallback} onError={onError}>
        {children}
      </WhiteboardErrorBoundary>
    </WhiteboardContext.Provider>
  )
}
