import { useEffect, useRef } from 'react'
import type { Shape } from '../types'

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

  // Keyboard shortcuts
  useEffect(() => {
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
      if ((isMod && e.key.toLowerCase() === 'z' && e.shiftKey) || (isMod && e.key === 'y')) {
        e.preventDefault()
        redo()
        return
      }

      // Select All: Cmd/Ctrl+A
      if (isMod && e.key === 'a') {
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedIds, shapeIds, shapes, deleteShapes, clearSelection, selectMultiple, updateShape, recordBatchUpdate])

  return isShiftPressedRef
}
