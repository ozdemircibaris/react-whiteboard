import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Shape, ToolType, Viewport, Point, HistoryEntry, TextShapeProps } from '../../types'
import { createShapeActions } from './shapeActions'
import { createViewportActions } from './viewportActions'
import { createHistoryActions } from './historyActions'
import { createClipboardActions } from './clipboardActions'
import { createZOrderActions } from './zOrderActions'
import { createShapeStyleActions, type ShapeStyleDefaults } from './shapeStyleActions'
import { createAlignmentActions } from './alignmentActions'
import { createGroupActions } from './groupActions'
import { createExportImportActions } from './exportImportActions'
import { createBoundTextActions } from './boundTextActions'
import { DEFAULT_TEXT_PROPS } from '../../utils/fonts'
import type { TextShape } from '../../types'

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
  updateShapesBatch: (updates: Map<string, Partial<Shape>>) => void
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

  // Clipboard state & actions
  clipboard: Shape[]
  clipboardPasteCount: number
  copySelectedShapes: () => void
  cutSelectedShapes: () => void
  pasteShapes: () => void
  duplicateSelectedShapes: () => void

  // Z-order actions
  bringToFront: () => void
  sendToBack: () => void
  bringForward: () => void
  sendBackward: () => void

  // Text styling defaults (applied to new text shapes)
  currentTextProps: Omit<TextShapeProps, 'text'>
  setCurrentTextProps: (props: Partial<Omit<TextShapeProps, 'text'>>) => void

  // Shape styling defaults (applied to new shapes)
  currentShapeStyle: ShapeStyleDefaults
  setCurrentShapeStyle: (props: Partial<ShapeStyleDefaults>) => void

  // Lock actions
  lockSelectedShapes: () => void
  unlockSelectedShapes: () => void

  // Alignment actions
  alignLeft: () => void
  alignRight: () => void
  alignTop: () => void
  alignBottom: () => void
  alignCenterH: () => void
  alignCenterV: () => void
  distributeHorizontally: () => void
  distributeVertically: () => void

  // Group actions
  groupSelectedShapes: () => void
  ungroupSelectedShapes: () => void

  // Export/import actions
  loadDocument: (shapes: Map<string, Shape>, shapeIds: string[], viewport: Viewport) => void

  // Bound text actions
  createBoundText: (parentId: string) => TextShape | null
  syncBoundTextToParent: (parentId: string) => void
  removeBoundText: (parentId: string, recordHistory?: boolean) => void
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
      clipboard: [],
      clipboardPasteCount: 0,

      // Delegated actions
      ...createShapeActions(set, get),
      ...createViewportActions(set, get),
      ...createHistoryActions(set, get),
      ...createClipboardActions(set, get),
      ...createZOrderActions(set, get),
      ...createShapeStyleActions(set, get),
      ...createAlignmentActions(set, get),
      ...createGroupActions(set, get),
      ...createExportImportActions(set, get),
      ...createBoundTextActions(set, get),

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

      // Text styling defaults
      currentTextProps: { ...DEFAULT_TEXT_PROPS },
      setCurrentTextProps: (props) =>
        set((state) => ({
          currentTextProps: { ...state.currentTextProps, ...props },
        })),

      // Lock/unlock actions (batch update for single undo step)
      lockSelectedShapes: () => {
        const state = get()
        const before: Shape[] = []
        for (const id of state.selectedIds) {
          const shape = state.shapes.get(id)
          if (shape && !shape.isLocked) {
            before.push(structuredClone(shape) as Shape)
            state.updateShape(id, { isLocked: true } as Partial<Shape>, false)
          }
        }
        if (before.length > 0) {
          const after = before.map((s) => ({ ...s, isLocked: true }) as Shape)
          state.recordBatchUpdate(before, after)
        }
      },
      unlockSelectedShapes: () => {
        const state = get()
        const before: Shape[] = []
        for (const id of state.selectedIds) {
          const shape = state.shapes.get(id)
          if (shape && shape.isLocked) {
            before.push(structuredClone(shape) as Shape)
            state.updateShape(id, { isLocked: false } as Partial<Shape>, false)
          }
        }
        if (before.length > 0) {
          const after = before.map((s) => ({ ...s, isLocked: false }) as Shape)
          state.recordBatchUpdate(before, after)
        }
      },
    }))
  )

