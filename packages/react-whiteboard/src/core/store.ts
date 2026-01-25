import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Shape, ToolType, Viewport, Point, HistoryEntry } from '../types'

// ============================================================================
// Store State Interface
// ============================================================================

export interface WhiteboardStore {
  // Shapes
  shapes: Map<string, Shape>
  shapeIds: string[] // Ordered for z-index

  // Viewport
  viewport: Viewport

  // Selection
  selectedIds: Set<string>

  // Tool
  currentTool: ToolType

  // Interaction state
  isDrawing: boolean
  isPanning: boolean

  // History
  history: HistoryEntry[]
  historyIndex: number

  // Actions - Shapes
  addShape: (shape: Shape) => void
  updateShape: (id: string, updates: Partial<Shape>) => void
  deleteShape: (id: string) => void
  deleteShapes: (ids: string[]) => void
  getShape: (id: string) => Shape | undefined
  clearShapes: () => void

  // Actions - Selection
  select: (id: string) => void
  selectMultiple: (ids: string[]) => void
  deselect: (id: string) => void
  clearSelection: () => void
  toggleSelection: (id: string) => void

  // Actions - Viewport
  setViewport: (viewport: Partial<Viewport>) => void
  pan: (deltaX: number, deltaY: number) => void
  zoom: (delta: number, center?: Point) => void
  zoomTo: (zoom: number, center?: Point) => void
  resetViewport: () => void

  // Actions - Tool
  setTool: (tool: ToolType) => void

  // Actions - Interaction
  setIsDrawing: (isDrawing: boolean) => void
  setIsPanning: (isPanning: boolean) => void

  // Actions - History
  undo: () => void
  redo: () => void
  pushHistory: (entry: HistoryEntry) => void
  canUndo: () => boolean
  canRedo: () => boolean
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 10

// ============================================================================
// Store Implementation
// ============================================================================

export const createWhiteboardStore = () =>
  create<WhiteboardStore>()(
    subscribeWithSelector((set, get) => ({
      // Initial state
      shapes: new Map(),
      shapeIds: [],
      viewport: { ...DEFAULT_VIEWPORT },
      selectedIds: new Set(),
      currentTool: 'select',
      isDrawing: false,
      isPanning: false,
      history: [],
      historyIndex: -1,

      // Shape actions
      addShape: (shape) =>
        set((state) => {
          const newShapes = new Map(state.shapes)
          newShapes.set(shape.id, shape)
          return {
            shapes: newShapes,
            shapeIds: [...state.shapeIds, shape.id],
          }
        }),

      updateShape: (id, updates) =>
        set((state) => {
          const shape = state.shapes.get(id)
          if (!shape) return state

          const newShapes = new Map(state.shapes)
          newShapes.set(id, { ...shape, ...updates } as Shape)
          return { shapes: newShapes }
        }),

      deleteShape: (id) =>
        set((state) => {
          const newShapes = new Map(state.shapes)
          newShapes.delete(id)
          const newSelectedIds = new Set(state.selectedIds)
          newSelectedIds.delete(id)
          return {
            shapes: newShapes,
            shapeIds: state.shapeIds.filter((sid) => sid !== id),
            selectedIds: newSelectedIds,
          }
        }),

      deleteShapes: (ids) =>
        set((state) => {
          const idsSet = new Set(ids)
          const newShapes = new Map(state.shapes)
          const newSelectedIds = new Set(state.selectedIds)
          ids.forEach((id) => {
            newShapes.delete(id)
            newSelectedIds.delete(id)
          })
          return {
            shapes: newShapes,
            shapeIds: state.shapeIds.filter((sid) => !idsSet.has(sid)),
            selectedIds: newSelectedIds,
          }
        }),

      getShape: (id) => get().shapes.get(id),

      clearShapes: () =>
        set({
          shapes: new Map(),
          shapeIds: [],
          selectedIds: new Set(),
        }),

      // Selection actions
      select: (id) =>
        set({
          selectedIds: new Set([id]),
        }),

      selectMultiple: (ids) =>
        set({
          selectedIds: new Set(ids),
        }),

      deselect: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds)
          newSelectedIds.delete(id)
          return { selectedIds: newSelectedIds }
        }),

      clearSelection: () =>
        set({
          selectedIds: new Set(),
        }),

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

      // Viewport actions
      setViewport: (viewport) =>
        set((state) => ({
          viewport: { ...state.viewport, ...viewport },
        })),

      pan: (deltaX, deltaY) =>
        set((state) => ({
          viewport: {
            ...state.viewport,
            x: state.viewport.x + deltaX,
            y: state.viewport.y + deltaY,
          },
        })),

      zoom: (delta, center) => {
        const state = get()
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.viewport.zoom + delta))

        if (center) {
          // Zoom towards the center point
          const zoomFactor = newZoom / state.viewport.zoom
          const newX = center.x - (center.x - state.viewport.x) * zoomFactor
          const newY = center.y - (center.y - state.viewport.y) * zoomFactor
          set({
            viewport: { x: newX, y: newY, zoom: newZoom },
          })
        } else {
          set({
            viewport: { ...state.viewport, zoom: newZoom },
          })
        }
      },

      zoomTo: (zoom, center) => {
        const state = get()
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

        if (center) {
          const zoomFactor = newZoom / state.viewport.zoom
          const newX = center.x - (center.x - state.viewport.x) * zoomFactor
          const newY = center.y - (center.y - state.viewport.y) * zoomFactor
          set({
            viewport: { x: newX, y: newY, zoom: newZoom },
          })
        } else {
          set({
            viewport: { ...state.viewport, zoom: newZoom },
          })
        }
      },

      resetViewport: () =>
        set({
          viewport: { ...DEFAULT_VIEWPORT },
        }),

      // Tool actions
      setTool: (tool) =>
        set({
          currentTool: tool,
          selectedIds: new Set(), // Clear selection when switching tools
        }),

      // Interaction actions
      setIsDrawing: (isDrawing) => set({ isDrawing }),
      setIsPanning: (isPanning) => set({ isPanning }),

      // History actions
      undo: () => {
        const state = get()
        if (state.historyIndex < 0) return

        const entry = state.history[state.historyIndex]
        if (!entry) return

        // Apply reverse of the action
        switch (entry.action.type) {
          case 'create':
            entry.action.shapes.forEach((shape) => {
              get().deleteShape(shape.id)
            })
            break
          case 'delete':
            entry.action.shapes.forEach((shape) => {
              get().addShape(shape)
            })
            break
          case 'update':
            entry.action.before.forEach((shape) => {
              get().updateShape(shape.id, shape)
            })
            break
        }

        set({ historyIndex: state.historyIndex - 1 })
      },

      redo: () => {
        const state = get()
        if (state.historyIndex >= state.history.length - 1) return

        const entry = state.history[state.historyIndex + 1]
        if (!entry) return

        // Apply the action
        switch (entry.action.type) {
          case 'create':
            entry.action.shapes.forEach((shape) => {
              get().addShape(shape)
            })
            break
          case 'delete':
            entry.action.shapes.forEach((shape) => {
              get().deleteShape(shape.id)
            })
            break
          case 'update':
            entry.action.after.forEach((shape) => {
              get().updateShape(shape.id, shape)
            })
            break
        }

        set({ historyIndex: state.historyIndex + 1 })
      },

      pushHistory: (entry) =>
        set((state) => {
          // Remove any redo history when pushing new entry
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(entry)

          // Limit history size
          const MAX_HISTORY = 100
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift()
          }

          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          }
        }),

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }))
  )

// Default store instance
export const useWhiteboardStore = createWhiteboardStore()
