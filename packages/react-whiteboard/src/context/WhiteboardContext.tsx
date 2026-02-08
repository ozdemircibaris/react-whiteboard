import { createContext, useContext, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createWhiteboardStore } from '../core/store/createStore'
import type { WhiteboardStore } from '../core/store/createStore'
import { ToolManager } from '../tools/ToolManager'
import type { ITool } from '../tools/types'
import type { TextTool } from '../tools/TextTool'
import { ShapeRendererRegistry } from '../core/renderer/ShapeRendererRegistry'
import type { CustomShapeRenderer } from '../core/renderer/ShapeRendererRegistry'
import { loadFonts } from '../utils/fonts'

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

/**
 * Access the ShapeRendererRegistry for registering custom shape renderers.
 */
export function useShapeRendererRegistry(): ShapeRendererRegistry {
  const { shapeRendererRegistry } = useWhiteboardContext()
  return shapeRendererRegistry
}

// ============================================================================
// Provider
// ============================================================================

export interface WhiteboardProviderProps {
  children: ReactNode
  /** Custom font URLs to override the default CDN-hosted Virgil + Cascadia Code fonts. */
  fontUrls?: Record<string, string>
  /** Custom shape renderers to register (additive to built-in shapes) */
  customShapes?: CustomShapeRenderer[]
  /** Custom tools to register (additive to default tools) */
  tools?: ITool[]
}

/**
 * Provides an isolated whiteboard store + tool manager + shape renderer registry.
 * Multiple <WhiteboardProvider> instances on the same page are fully independent.
 */
export function WhiteboardProvider({ children, fontUrls, customShapes, tools }: WhiteboardProviderProps) {
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

  const value = useMemo<WhiteboardContextValue>(
    () => ({ store, toolManager, shapeRendererRegistry: registry }),
    [store, toolManager, registry],
  )

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  )
}
