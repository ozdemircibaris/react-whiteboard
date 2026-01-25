import { useRef, useCallback, useEffect } from 'react'
import { useWhiteboardStore, type WhiteboardStore } from '../core/store'
import { ToolManager, toolManager } from '../tools/ToolManager'
import type { ToolEventContext } from '../tools/types'
import type { Point } from '../types'

/**
 * Hook for integrating tools with React components
 */
export function useTools() {
  const managerRef = useRef<ToolManager>(toolManager)

  // Get state from the store
  const currentTool = useWhiteboardStore((s) => s.currentTool)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const setTool = useWhiteboardStore((s) => s.setTool)

  // Initialize manager with store on mount
  useEffect(() => {
    const manager = managerRef.current
    // Get the store state directly for the tool manager
    const storeApi = useWhiteboardStore as unknown as { getState: () => WhiteboardStore }
    manager.setStore(storeApi.getState())
    manager.setActiveTool(currentTool)
  }, [])

  // Update active tool when currentTool changes
  useEffect(() => {
    managerRef.current.setActiveTool(currentTool)
  }, [currentTool])

  /**
   * Create event context from pointer event
   */
  const createEventContext = useCallback(
    (
      screenPoint: Point,
      canvasPoint: Point,
      event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean; button?: number; pressure?: number }
    ): ToolEventContext => ({
      screenPoint,
      canvasPoint,
      viewport,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      button: event.button ?? 0,
      pressure: event.pressure ?? 0.5,
    }),
    [viewport]
  )

  /**
   * Handle pointer down event
   */
  const handlePointerDown = useCallback(
    (screenPoint: Point, canvasPoint: Point, event: React.PointerEvent) => {
      const ctx = createEventContext(screenPoint, canvasPoint, event)
      return managerRef.current.handlePointerDown(ctx)
    },
    [createEventContext]
  )

  /**
   * Handle pointer move event
   */
  const handlePointerMove = useCallback(
    (screenPoint: Point, canvasPoint: Point, event: React.PointerEvent) => {
      const ctx = createEventContext(screenPoint, canvasPoint, event)
      return managerRef.current.handlePointerMove(ctx)
    },
    [createEventContext]
  )

  /**
   * Handle pointer up event
   */
  const handlePointerUp = useCallback(
    (screenPoint: Point, canvasPoint: Point, event: React.PointerEvent) => {
      const ctx = createEventContext(screenPoint, canvasPoint, event)
      return managerRef.current.handlePointerUp(ctx)
    },
    [createEventContext]
  )

  /**
   * Handle key down event
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    return managerRef.current.handleKeyDown(event)
  }, [])

  /**
   * Render tool overlay
   */
  const renderOverlay = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      managerRef.current.renderOverlay(ctx, viewport)
    },
    [viewport]
  )

  /**
   * Get current cursor
   */
  const getCursor = useCallback(() => {
    return managerRef.current.getCursor()
  }, [])

  /**
   * Check if tool is dragging
   */
  const isDragging = useCallback(() => {
    return managerRef.current.isDragging()
  }, [])

  /**
   * Get all registered tools
   */
  const getAllTools = useCallback(() => {
    return managerRef.current.getAllTools()
  }, [])

  return {
    manager: managerRef.current,
    currentTool,
    setTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    renderOverlay,
    getCursor,
    isDragging,
    getAllTools,
  }
}
