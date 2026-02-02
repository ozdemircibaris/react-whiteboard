import { useRef, useCallback, useEffect, useState } from 'react'
import { useWhiteboardStore, useToolManager } from '../context'
import { screenToCanvas } from '../utils/canvas'
import { TOOL_CURSORS } from '../tools/types'
import type { ToolEventContext } from '../tools/types'
import type { Point } from '../types'

interface UseToolsOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  renderFnRef: React.RefObject<(() => void) | null>
  readOnly?: boolean
}

/**
 * Hook that bridges React pointer events to the ToolManager system.
 * Handles pointer capture, panning, coordinate conversion, cursor updates,
 * tool overlay rendering, and text overlay setup.
 *
 * When `readOnly` is true, only pan gestures are processed — all tool
 * interactions are disabled.
 */
export function useTools({ containerRef, canvasRef, renderFnRef, readOnly = false }: UseToolsOptions) {
  const lastPointerRef = useRef<Point | null>(null)
  const isPanningRef = useRef(false)
  const [cursorStyle, setCursorStyle] = useState('default')

  const toolManager = useToolManager()

  // Store selectors
  const currentTool = useWhiteboardStore((s) => s.currentTool)
  const viewport = useWhiteboardStore((s) => s.viewport)

  // Store actions
  const pan = useWhiteboardStore((s) => s.pan)
  const setIsPanning = useWhiteboardStore((s) => s.setIsPanning)

  // Sync active tool when currentTool changes (skip in readOnly)
  useEffect(() => {
    if (readOnly) return
    toolManager.setActiveTool(currentTool)
    setCursorStyle(TOOL_CURSORS[currentTool] || 'default')
  }, [currentTool, toolManager, readOnly])

  // Build ToolEventContext from a React pointer event
  const createEventContext = useCallback(
    (e: React.PointerEvent): ToolEventContext | null => {
      const container = containerRef.current
      if (!container) return null

      const rect = container.getBoundingClientRect()
      const screenPoint: Point = { x: e.clientX, y: e.clientY }
      const canvasPoint = screenToCanvas(screenPoint, viewport, rect)

      return {
        screenPoint,
        canvasPoint,
        viewport,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        button: e.button,
        pressure: e.pressure || 0.5,
      }
    },
    [containerRef, viewport],
  )

  /**
   * Request a re-render after tool events (for overlay updates)
   */
  const requestRender = useCallback(() => {
    requestAnimationFrame(() => renderFnRef.current?.())
  }, [renderFnRef])

  /**
   * Pointer down: check panning first, then delegate to ToolManager
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.setPointerCapture(e.pointerId)
      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      // Middle mouse or alt+left click → panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanningRef.current = true
        setIsPanning(true)
        e.preventDefault()
        return
      }

      // In readOnly mode, skip tool delegation
      if (readOnly) return

      // Left click → delegate to active tool
      if (e.button === 0) {
        const ctx = createEventContext(e)
        if (!ctx) return

        const result = toolManager.handlePointerDown(ctx)
        if (result.cursor) {
          setCursorStyle(result.cursor)
        }
        requestRender()
      }
    },
    [canvasRef, createEventContext, setIsPanning, requestRender, readOnly],
  )

  /**
   * Pointer move: handle panning or delegate to ToolManager
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const currentPoint = { x: e.clientX, y: e.clientY }

      // Panning mode
      if (isPanningRef.current && lastPointerRef.current) {
        const dx = currentPoint.x - lastPointerRef.current.x
        const dy = currentPoint.y - lastPointerRef.current.y
        pan(dx, dy)
        lastPointerRef.current = currentPoint
        return
      }

      // In readOnly mode, skip tool delegation
      if (readOnly) {
        lastPointerRef.current = currentPoint
        return
      }

      // Delegate to tool
      const ctx = createEventContext(e)
      if (!ctx) return

      const result = toolManager.handlePointerMove(ctx)
      if (result.cursor) {
        setCursorStyle(result.cursor)
      }

      lastPointerRef.current = currentPoint
      requestRender()
    },
    [pan, createEventContext, requestRender, readOnly],
  )

  /**
   * Pointer up: finalize pan or delegate to ToolManager
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId)
        } catch {
          // Pointer capture may have already been released
        }
      }

      if (isPanningRef.current) {
        isPanningRef.current = false
        setIsPanning(false)
        lastPointerRef.current = null
        return
      }

      // In readOnly mode, skip tool delegation
      if (readOnly) {
        lastPointerRef.current = null
        return
      }

      const ctx = createEventContext(e)
      if (ctx) {
        toolManager.handlePointerUp(ctx)
      }

      lastPointerRef.current = null
      requestRender()
    },
    [canvasRef, createEventContext, setIsPanning, requestRender, readOnly],
  )

  /**
   * Double click: delegate to ToolManager (e.g. edit text from select tool)
   */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const screenPoint: Point = { x: e.clientX, y: e.clientY }
      const canvasPoint = screenToCanvas(screenPoint, viewport, rect)

      const ctx: ToolEventContext = {
        screenPoint,
        canvasPoint,
        viewport,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        button: e.button,
        pressure: 0.5,
      }

      toolManager.handleDoubleClick(ctx)
      requestRender()
    },
    [containerRef, viewport, requestRender, readOnly],
  )

  /**
   * Render tool overlay (preview shapes during drawing)
   */
  const renderOverlay = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (readOnly) return
      toolManager.renderOverlay(ctx, viewport)
    },
    [viewport, readOnly],
  )

  /**
   * Set text overlay container for TextTool inline editing
   */
  const setTextOverlayContainer = useCallback((el: HTMLDivElement | null) => {
    toolManager.setOverlayContainer(el)
  }, [toolManager])

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    renderOverlay,
    cursorStyle: readOnly ? 'default' : cursorStyle,
    setTextOverlayContainer,
    isPanningRef,
  }
}
