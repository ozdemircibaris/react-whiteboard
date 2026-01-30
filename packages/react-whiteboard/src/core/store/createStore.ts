import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Shape, ToolType, Viewport, Point, HistoryEntry } from '../../types'
import { createShapeActions } from './shapeActions'
import { createViewportActions } from './viewportActions'
import { createHistoryActions } from './historyActions'

// ============================================================================
// Store State Interface
// ============================================================================

export interface WhiteboardStore {
  // State
  shapes: Map<string, Shape>
  shapeIds: string[]
  viewport: Viewport
  selectedIds: Set<string>
  currentTool: ToolType
  isDrawing: boolean
  isPanning: boolean
  history: HistoryEntry[]
  historyIndex: number

  // Shape actions
  addShape: (shape: Shape, recordHistory?: boolean) => void
  updateShape: (id: string, updates: Partial<Shape>, recordHistory?: boolean) => void
  deleteShape: (id: string, recordHistory?: boolean) => void
  deleteShapes: (ids: string[], recordHistory?: boolean) => void
  getShape: (id: string) => Shape | undefined
  clearShapes: (recordHistory?: boolean) => void

  // Selection actions
  select: (id: string) => void
  selectMultiple: (ids: string[]) => void
  deselect: (id: string) => void
  clearSelection: () => void
  toggleSelection: (id: string) => void

  // Viewport actions
  setViewport: (viewport: Partial<Viewport>) => void
  pan: (deltaX: number, deltaY: number) => void
  zoom: (delta: number, center?: Point) => void
  zoomTo: (zoom: number, center?: Point) => void
  animateZoom: (targetZoom: number, center?: Point, duration?: number) => void
  resetViewport: () => void

  // Tool actions
  setTool: (tool: ToolType) => void

  // Interaction actions
  setIsDrawing: (isDrawing: boolean) => void
  setIsPanning: (isPanning: boolean) => void

  // History actions
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  recordBatchUpdate: (before: Shape[], after: Shape[]) => void
}

// ============================================================================
// Store Implementation
// ============================================================================

export const createWhiteboardStore = () =>
  create<WhiteboardStore>()(
    subscribeWithSelector((set, get) => ({
      // Initial state
      shapes: new Map(),
      shapeIds: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedIds: new Set<string>(),
      currentTool: 'select',
      isDrawing: false,
      isPanning: false,
      history: [],
      historyIndex: -1,

      // Delegated actions
      ...createShapeActions(set, get),
      ...createViewportActions(set, get),
      ...createHistoryActions(set, get),

      // Selection actions (inline — small)
      select: (id) => set({ selectedIds: new Set([id]) }),

      selectMultiple: (ids) => set({ selectedIds: new Set(ids) }),

      deselect: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds)
          newSelectedIds.delete(id)
          return { selectedIds: newSelectedIds }
        }),

      clearSelection: () => set({ selectedIds: new Set<string>() }),

      toggleSelection: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds)
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id)
          } else {
            newSelectedIds.add(id)
          }
          return { selectedIds: newSelectedIds }
        }),

      // Tool actions
      setTool: (tool) => set({ currentTool: tool, selectedIds: new Set<string>() }),

      // Interaction actions
      setIsDrawing: (isDrawing) => set({ isDrawing }),
      setIsPanning: (isPanning) => set({ isPanning }),
    }))
  )

// Default store instance
export const useWhiteboardStore = createWhiteboardStore()
