import type { WhiteboardStore } from '../core/store'
import type { ToolType, Viewport } from '../types'
import type { ThemeColors } from '../types/theme'
import { LIGHT_THEME } from '../types/theme'
import type { ShapeRendererRegistry } from '../core/renderer/ShapeRendererRegistry'
import type { ITool, ToolEventContext, ToolState } from './types'
import { createToolState } from './types'
import { SelectTool } from './SelectTool'
import { RectangleTool } from './RectangleTool'
import { EllipseTool } from './EllipseTool'
import { DrawTool } from './DrawTool'
import { LineTool } from './LineTool'
import { ArrowTool } from './ArrowTool'
import { TextTool } from './TextTool'

/**
 * Tool manager - handles tool switching and event routing.
 * Each instance owns its own set of tool instances.
 */
export class ToolManager {
  private tools: Map<ToolType, ITool> = new Map()
  private activeTool: ITool | null = null
  private state: ToolState
  private storeGetter: (() => WhiteboardStore) | null = null
  private _theme: ThemeColors = LIGHT_THEME
  private _registry: ShapeRendererRegistry | null = null

  constructor() {
    this.state = createToolState()
    this.registerDefaultTools()
  }

  /**
   * Get fresh store state (always current)
   */
  private get store(): WhiteboardStore | null {
    return this.storeGetter?.() ?? null
  }

  /**
   * Register default tools (fresh instances per ToolManager)
   */
  private registerDefaultTools(): void {
    this.registerTool(new SelectTool(this))
    this.registerTool(new RectangleTool())
    this.registerTool(new EllipseTool())
    this.registerTool(new DrawTool())
    this.registerTool(new LineTool())
    this.registerTool(new ArrowTool())
    this.registerTool(new TextTool())
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
   * Set the store getter for always-fresh state access
   */
  setStoreGetter(getter: () => WhiteboardStore): void {
    this.storeGetter = getter
  }

  /**
   * Set the overlay container for TextTool inline editing
   */
  setOverlayContainer(el: HTMLElement | null): void {
    const textTool = this.tools.get('text') as TextTool | undefined
    textTool?.setOverlayContainer(el)
  }

  /**
   * Set the theme colors (used by tools for overlay rendering)
   */
  setTheme(theme: ThemeColors): void {
    this._theme = theme
  }

  /**
   * Get the current theme colors
   */
  getTheme(): ThemeColors {
    return this._theme
  }

  /**
   * Set the custom shape renderer registry
   */
  setRegistry(registry: ShapeRendererRegistry): void {
    this._registry = registry
  }

  /**
   * Get the custom shape renderer registry
   */
  getRegistry(): ShapeRendererRegistry | null {
    return this._registry
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
