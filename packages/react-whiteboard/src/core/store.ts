import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Shape, ToolType, Viewport, Point, HistoryEntry, HistoryAction } from '../types'

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

  // Actions - Shapes (with history tracking)
  addShape: (shape: Shape, recordHistory?: boolean) => void
  updateShape: (id: string, updates: Partial<Shape>, recordHistory?: boolean) => void
  deleteShape: (id: string, recordHistory?: boolean) => void
  deleteShapes: (ids: string[], recordHistory?: boolean) => void
  getShape: (id: string) => Shape | undefined
  clearShapes: (recordHistory?: boolean) => void

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
  canUndo: () => boolean
  canRedo: () => boolean
  recordBatchUpdate: (before: Shape[], after: Shape[]) => void
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
const MAX_HISTORY = 100

// ============================================================================
// Helper Functions
// ============================================================================

function createHistoryEntry(action: HistoryAction): HistoryEntry {
  return {
    id: nanoid(),
    timestamp: Date.now(),
    action,
  }
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
      viewport: { ...DEFAULT_VIEWPORT },
      selectedIds: new Set(),
      currentTool: 'select',
      isDrawing: false,
      isPanning: false,
      history: [],
      historyIndex: -1,

      // Shape actions
      addShape: (shape, recordHistory = true) => {
        set((state) => {
          const newShapes = new Map(state.shapes)
          newShapes.set(shape.id, shape)

          // Record history if requested
          let newHistory = state.history
          let newHistoryIndex = state.historyIndex

          if (recordHistory) {
            const entry = createHistoryEntry({ type: 'create', shapes: [shape] })
            newHistory = state.history.slice(0, state.historyIndex + 1)
            newHistory.push(entry)
            if (newHistory.length > MAX_HISTORY) {
              newHistory.shift()
            }
            newHistoryIndex = newHistory.length - 1
          }

          return {
            shapes: newShapes,
            shapeIds: [...state.shapeIds, shape.id],
            history: newHistory,
            historyIndex: newHistoryIndex,
          }
        })
      },

      updateShape: (id, updates, recordHistory = true) => {
        const state = get()
        const shape = state.shapes.get(id)
        if (!shape) return

        const updatedShape = { ...shape, ...updates } as Shape

        set((state) => {
          const newShapes = new Map(state.shapes)
          newShapes.set(id, updatedShape)

          let newHistory = state.history
          let newHistoryIndex = state.historyIndex

          if (recordHistory) {
            const entry = createHistoryEntry({
              type: 'update',
              before: [shape],
              after: [updatedShape],
            })
            newHistory = state.history.slice(0, state.historyIndex + 1)
            newHistory.push(entry)
            if (newHistory.length > MAX_HISTORY) {
              newHistory.shift()
            }
            newHistoryIndex = newHistory.length - 1
          }

          return {
            shapes: newShapes,
            history: newHistory,
            historyIndex: newHistoryIndex,
          }
        })
      },

      deleteShape: (id, recordHistory = true) => {
        const state = get()
        const shape = state.shapes.get(id)
        if (!shape) return

        set((state) => {
          const newShapes = new Map(state.shapes)
          newShapes.delete(id)
          const newSelectedIds = new Set(state.selectedIds)
          newSelectedIds.delete(id)

          let newHistory = state.history
          let newHistoryIndex = state.historyIndex

          if (recordHistory) {
            const entry = createHistoryEntry({ type: 'delete', shapes: [shape] })
            newHistory = state.history.slice(0, state.historyIndex + 1)
            newHistory.push(entry)
            if (newHistory.length > MAX_HISTORY) {
              newHistory.shift()
            }
            newHistoryIndex = newHistory.length - 1
          }

          return {
            shapes: newShapes,
            shapeIds: state.shapeIds.filter((sid) => sid !== id),
            selectedIds: newSelectedIds,
            history: newHistory,
            historyIndex: newHistoryIndex,
          }
        })
      },

      deleteShapes: (ids, recordHistory = true) => {
        const state = get()
        const shapesToDelete = ids
          .map((id) => state.shapes.get(id))
          .filter((shape): shape is Shape => shape !== undefined)

        if (shapesToDelete.length === 0) return

        set((state) => {
          const idsSet = new Set(ids)
          const newShapes = new Map(state.shapes)
          const newSelectedIds = new Set(state.selectedIds)
          ids.forEach((id) => {
            newShapes.delete(id)
            newSelectedIds.delete(id)
          })

          let newHistory = state.history
          let newHistoryIndex = state.historyIndex

          if (recordHistory) {
            const entry = createHistoryEntry({ type: 'delete', shapes: shapesToDelete })
            newHistory = state.history.slice(0, state.historyIndex + 1)
            newHistory.push(entry)
            if (newHistory.length > MAX_HISTORY) {
              newHistory.shift()
            }
            newHistoryIndex = newHistory.length - 1
          }

          return {
            shapes: newShapes,
            shapeIds: state.shapeIds.filter((sid) => !idsSet.has(sid)),
            selectedIds: newSelectedIds,
            history: newHistory,
            historyIndex: newHistoryIndex,
          }
        })
      },

      getShape: (id) => get().shapes.get(id),

      clearShapes: (recordHistory = true) => {
        const state = get()
        const allShapes = Array.from(state.shapes.values())

        set((state) => {
          let newHistory = state.history
          let newHistoryIndex = state.historyIndex

          if (recordHistory && allShapes.length > 0) {
            const entry = createHistoryEntry({ type: 'delete', shapes: allShapes })
            newHistory = state.history.slice(0, state.historyIndex + 1)
            newHistory.push(entry)
            if (newHistory.length > MAX_HISTORY) {
              newHistory.shift()
            }
            newHistoryIndex = newHistory.length - 1
          }

          return {
            shapes: new Map(),
            shapeIds: [],
            selectedIds: new Set(),
            history: newHistory,
            historyIndex: newHistoryIndex,
          }
        })
      },

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
          // Zoom towards the center point (center is in canvas coordinates)
          // Formula: newPan = oldPan + canvasPoint * (oldZoom - newZoom)
          // This keeps the canvas point under the mouse cursor at the same screen position
          const newX = state.viewport.x + center.x * (state.viewport.zoom - newZoom)
          const newY = state.viewport.y + center.y * (state.viewport.zoom - newZoom)
          set({
            viewport: { x: newX, y: newY, zoom: newZoom },
          })
        } else {
          set({
            viewport: { ...state.viewport, zoom: newZoom },
          })
        }
      },

      zoomTo: (targetZoom, center) => {
        const state = get()
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom))

        if (center) {
          // Zoom towards the center point (center is in canvas coordinates)
          const newX = state.viewport.x + center.x * (state.viewport.zoom - newZoom)
          const newY = state.viewport.y + center.y * (state.viewport.zoom - newZoom)
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

        const { action } = entry

        // Apply reverse of the action without recording history
        if (action.type === 'create') {
          // Undo create = delete shapes
          const shapesToDelete = action.shapes
          set((s) => {
            const newShapes = new Map(s.shapes)
            const idsToDelete = new Set(shapesToDelete.map((shape) => shape.id))
            shapesToDelete.forEach((shape) => {
              newShapes.delete(shape.id)
            })
            const newSelectedIds = new Set(s.selectedIds)
            idsToDelete.forEach((id) => newSelectedIds.delete(id))
            return {
              shapes: newShapes,
              shapeIds: s.shapeIds.filter((sid) => !idsToDelete.has(sid)),
              selectedIds: newSelectedIds,
              historyIndex: s.historyIndex - 1,
            }
          })
        } else if (action.type === 'delete') {
          // Undo delete = restore shapes
          const shapesToRestore = action.shapes
          set((s) => {
            const newShapes = new Map(s.shapes)
            const newShapeIds = [...s.shapeIds]
            shapesToRestore.forEach((shape) => {
              newShapes.set(shape.id, shape)
              if (!newShapeIds.includes(shape.id)) {
                newShapeIds.push(shape.id)
              }
            })
            return {
              shapes: newShapes,
              shapeIds: newShapeIds,
              historyIndex: s.historyIndex - 1,
            }
          })
        } else if (action.type === 'update') {
          // Undo update = restore before state
          const beforeShapes = action.before
          set((s) => {
            const newShapes = new Map(s.shapes)
            beforeShapes.forEach((shape) => {
              newShapes.set(shape.id, shape)
            })
            return {
              shapes: newShapes,
              historyIndex: s.historyIndex - 1,
            }
          })
        }
      },

      redo: () => {
        const state = get()
        if (state.historyIndex >= state.history.length - 1) return

        const entry = state.history[state.historyIndex + 1]
        if (!entry) return

        const { action } = entry

        // Apply the action without recording history
        if (action.type === 'create') {
          // Redo create = add shapes
          const shapesToAdd = action.shapes
          set((s) => {
            const newShapes = new Map(s.shapes)
            const newShapeIds = [...s.shapeIds]
            shapesToAdd.forEach((shape) => {
              newShapes.set(shape.id, shape)
              if (!newShapeIds.includes(shape.id)) {
                newShapeIds.push(shape.id)
              }
            })
            return {
              shapes: newShapes,
              shapeIds: newShapeIds,
              historyIndex: s.historyIndex + 1,
            }
          })
        } else if (action.type === 'delete') {
          // Redo delete = remove shapes
          const shapesToDelete = action.shapes
          set((s) => {
            const newShapes = new Map(s.shapes)
            const idsToDelete = new Set(shapesToDelete.map((shape) => shape.id))
            shapesToDelete.forEach((shape) => {
              newShapes.delete(shape.id)
            })
            const newSelectedIds = new Set(s.selectedIds)
            idsToDelete.forEach((id) => newSelectedIds.delete(id))
            return {
              shapes: newShapes,
              shapeIds: s.shapeIds.filter((sid) => !idsToDelete.has(sid)),
              selectedIds: newSelectedIds,
              historyIndex: s.historyIndex + 1,
            }
          })
        } else if (action.type === 'update') {
          // Redo update = apply after state
          const afterShapes = action.after
          set((s) => {
            const newShapes = new Map(s.shapes)
            afterShapes.forEach((shape) => {
              newShapes.set(shape.id, shape)
            })
            return {
              shapes: newShapes,
              historyIndex: s.historyIndex + 1,
            }
          })
        }
      },

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      recordBatchUpdate: (before, after) => {
        if (before.length === 0 || after.length === 0) return

        set((state) => {
          const entry = createHistoryEntry({
            type: 'update',
            before,
            after,
          })
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(entry)
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift()
          }
          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          }
        })
      },
    }))
  )

// Default store instance
export const useWhiteboardStore = createWhiteboardStore()
