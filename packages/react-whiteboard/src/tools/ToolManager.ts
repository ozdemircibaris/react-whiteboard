import type { WhiteboardStore } from '../core/store'
import type { ToolType, Viewport } from '../types'
import type { ITool, ToolEventContext, ToolState } from './types'
import { createToolState, TOOL_CURSORS } from './types'
import { selectTool } from './SelectTool'
import { rectangleTool } from './RectangleTool'
import { ellipseTool } from './EllipseTool'
import { drawTool } from './DrawTool'

/**
 * Tool manager - handles tool switching and event routing
 */
export class ToolManager {
  private tools: Map<ToolType, ITool> = new Map()
  private activeTool: ITool | null = null
  private state: ToolState
  private store: WhiteboardStore | null = null

  constructor() {
    this.state = createToolState()
    this.registerDefaultTools()
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    this.registerTool(selectTool)
    this.registerTool(rectangleTool)
    this.registerTool(ellipseTool)
    this.registerTool(drawTool)
  }

  /**
   * Register a tool
   */
  registerTool(tool: ITool): void {
    this.tools.set(tool.type, tool)
  }

  /**
   * Unregister a tool
   */
  unregisterTool(type: ToolType): void {
    this.tools.delete(type)
  }

  /**
   * Get a tool by type
   */
  getTool(type: ToolType): ITool | undefined {
    return this.tools.get(type)
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ITool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Set the store reference
   */
  setStore(store: WhiteboardStore): void {
    this.store = store
  }

  /**
   * Set active tool
   */
  setActiveTool(type: ToolType): void {
    if (!this.store) return

    const newTool = this.tools.get(type)
    if (!newTool) return

    // Deactivate current tool
    if (this.activeTool) {
      this.activeTool.onDeactivate?.(this.store)
    }

    // Reset state
    this.state = createToolState()

    // Activate new tool
    this.activeTool = newTool
    this.activeTool.onActivate?.(this.store)
  }

  /**
   * Get active tool
   */
  getActiveTool(): ITool | null {
    return this.activeTool
  }

  /**
   * Get current tool state
   */
  getState(): ToolState {
    return this.state
  }

  /**
   * Get cursor for current state
   */
  getCursor(): string {
    if (!this.activeTool) return 'default'
    return this.activeTool.cursor
  }

  /**
   * Get cursor for a tool type
   */
  getCursorForTool(type: ToolType): string {
    return TOOL_CURSORS[type] || 'default'
  }

  /**
   * Handle pointer down
   */
  handlePointerDown(ctx: ToolEventContext): { handled: boolean; cursor?: string } {
    if (!this.activeTool || !this.store) {
      return { handled: false }
    }

    const result = this.activeTool.onPointerDown(ctx, this.store, this.state)
    return {
      handled: result.handled,
      cursor: result.cursor,
    }
  }

  /**
   * Handle pointer move
   */
  handlePointerMove(ctx: ToolEventContext): { handled: boolean; cursor?: string } {
    if (!this.activeTool || !this.store) {
      return { handled: false }
    }

    const result = this.activeTool.onPointerMove(ctx, this.store, this.state)
    return {
      handled: result.handled,
      cursor: result.cursor,
    }
  }

  /**
   * Handle pointer up
   */
  handlePointerUp(ctx: ToolEventContext): { handled: boolean } {
    if (!this.activeTool || !this.store) {
      return { handled: false }
    }

    const result = this.activeTool.onPointerUp(ctx, this.store, this.state)
    return { handled: result.handled }
  }

  /**
   * Handle double click
   */
  handleDoubleClick(ctx: ToolEventContext): void {
    if (!this.activeTool || !this.store) return
    this.activeTool.onDoubleClick?.(ctx, this.store)
  }

  /**
   * Handle key down
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.activeTool || !this.store) return false
    return this.activeTool.onKeyDown?.(event, this.store) ?? false
  }

  /**
   * Render tool overlay (preview shapes, etc.)
   */
  renderOverlay(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
    if (!this.activeTool) return
    this.activeTool.renderOverlay?.(ctx, this.state, viewport)
  }

  /**
   * Check if currently in a drag operation
   */
  isDragging(): boolean {
    return this.state.isDragging
  }

  /**
   * Reset the manager
   */
  reset(): void {
    if (this.activeTool && this.store) {
      this.activeTool.onDeactivate?.(this.store)
    }
    this.activeTool = null
    this.state = createToolState()
  }
}

/**
 * Singleton tool manager instance
 */
export const toolManager = new ToolManager()
