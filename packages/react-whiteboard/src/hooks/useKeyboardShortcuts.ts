import { useEffect, useRef } from 'react'
import type { Shape, ToolType } from '../types'

interface KeyboardShortcutsOptions {
  shapes: Map<string, Shape>
  shapeIds: string[]
  selectedIds: Set<string>
  undo: () => void
  redo: () => void
  deleteShapes: (ids: string[]) => void
  clearSelection: () => void
  selectMultiple: (ids: string[]) => void
  updateShape: (id: string, updates: Partial<Shape>, recordHistory?: boolean) => void
  recordBatchUpdate: (before: Shape[], after: Shape[]) => void
  copySelectedShapes: () => void
  cutSelectedShapes: () => void
  pasteShapes: () => void
  duplicateSelectedShapes: () => void
  bringToFront: () => void
  sendToBack: () => void
  bringForward: () => void
  sendBackward: () => void
  lockSelectedShapes: () => void
  unlockSelectedShapes: () => void
  groupSelectedShapes: () => void
  ungroupSelectedShapes: () => void
  setTool: (tool: ToolType) => void
  readOnly?: boolean
}

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: 'select',
  r: 'rectangle',
  o: 'ellipse',
  l: 'line',
  a: 'arrow',
  d: 'draw',
  t: 'text',
}

/**
 * Hook for managing keyboard shortcuts
 * Returns a ref for tracking shift key state
 */
export function useKeyboardShortcuts({
  shapes,
  shapeIds,
  selectedIds,
  undo,
  redo,
  deleteShapes,
  clearSelection,
  selectMultiple,
  updateShape,
  recordBatchUpdate,
  copySelectedShapes,
  cutSelectedShapes,
  pasteShapes,
  duplicateSelectedShapes,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  lockSelectedShapes,
  unlockSelectedShapes,
  groupSelectedShapes,
  ungroupSelectedShapes,
  setTool,
  readOnly = false,
}: KeyboardShortcutsOptions) {
  const isShiftPressedRef = useRef(false)

  // Track shift key for angle snapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Keyboard shortcuts (disabled in readOnly mode)
  useEffect(() => {
    if (readOnly) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const isMod = e.metaKey || e.ctrlKey
      const moveAmount = e.shiftKey ? 10 : 1

      // Undo: Cmd/Ctrl+Z
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if ((isMod && e.key.toLowerCase() === 'z' && e.shiftKey) || (isMod && e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        redo()
        return
      }

      // Copy: Cmd/Ctrl+C
      if (isMod && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        copySelectedShapes()
        return
      }

      // Cut: Cmd/Ctrl+X
      if (isMod && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        cutSelectedShapes()
        return
      }

      // Paste: Cmd/Ctrl+V
      if (isMod && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        pasteShapes()
        return
      }

      // Duplicate: Cmd/Ctrl+D
      if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelectedShapes()
        return
      }

      // Z-order: Cmd/Ctrl+] (bring forward), Cmd/Ctrl+Shift+] (bring to front)
      if (isMod && e.key === ']') {
        e.preventDefault()
        if (e.shiftKey) bringToFront()
        else bringForward()
        return
      }

      // Z-order: Cmd/Ctrl+[ (send backward), Cmd/Ctrl+Shift+[ (send to back)
      if (isMod && e.key === '[') {
        e.preventDefault()
        if (e.shiftKey) sendToBack()
        else sendBackward()
        return
      }

      // Lock: Cmd/Ctrl+L
      if (isMod && e.key.toLowerCase() === 'l' && !e.shiftKey) {
        e.preventDefault()
        lockSelectedShapes()
        return
      }

      // Unlock: Cmd/Ctrl+Shift+L
      if (isMod && e.key.toLowerCase() === 'l' && e.shiftKey) {
        e.preventDefault()
        unlockSelectedShapes()
        return
      }

      // Group: Cmd/Ctrl+G
      if (isMod && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault()
        groupSelectedShapes()
        return
      }

      // Ungroup: Cmd/Ctrl+Shift+G
      if (isMod && e.key.toLowerCase() === 'g' && e.shiftKey) {
        e.preventDefault()
        ungroupSelectedShapes()
        return
      }

      // Select All: Cmd/Ctrl+A
      if (isMod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        selectMultiple(shapeIds)
        return
      }

      // Delete selected: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault()
        deleteShapes(Array.from(selectedIds))
        return
      }

      // Clear selection: Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
        return
      }

      // Move selected shapes with arrow keys
      if (selectedIds.size > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const delta = { x: 0, y: 0 }

        switch (e.key) {
          case 'ArrowUp':
            delta.y = -moveAmount
            break
          case 'ArrowDown':
            delta.y = moveAmount
            break
          case 'ArrowLeft':
            delta.x = -moveAmount
            break
          case 'ArrowRight':
            delta.x = moveAmount
            break
        }

        // Collect before states, update without history, then record batch
        const beforeShapes: Shape[] = []
        selectedIds.forEach((id) => {
          const shape = shapes.get(id)
          if (shape) {
            beforeShapes.push(structuredClone(shape) as Shape)
            updateShape(id, { x: shape.x + delta.x, y: shape.y + delta.y }, false)
          }
        })

        if (beforeShapes.length > 0) {
          const afterShapes: Shape[] = beforeShapes.map((before) => ({
            ...before,
            x: before.x + delta.x,
            y: before.y + delta.y,
          } as Shape))
          recordBatchUpdate(beforeShapes, afterShapes)
        }
        return
      }

      // Tool switching: single letter keys (V, R, O, L, A, D, T)
      if (!isMod) {
        const tool = TOOL_SHORTCUTS[e.key.toLowerCase()]
        if (tool) {
          e.preventDefault()
          setTool(tool)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    readOnly, undo, redo, selectedIds, shapeIds, shapes, deleteShapes, clearSelection,
    selectMultiple, updateShape, recordBatchUpdate, copySelectedShapes,
    cutSelectedShapes, pasteShapes, duplicateSelectedShapes, bringToFront,
    sendToBack, bringForward, sendBackward, lockSelectedShapes,
    unlockSelectedShapes, groupSelectedShapes, ungroupSelectedShapes, setTool,
  ])

  return isShiftPressedRef
}
