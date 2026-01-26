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
      const isMod = e.metaKey || e.ctrlKey
      const moveAmount = e.shiftKey ? 10 : 1

      // Undo: Cmd/Ctrl+Z
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if ((isMod && e.key === 'z' && e.shiftKey) || (isMod && e.key === 'y')) {
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

        selectedIds.forEach((id) => {
          const shape = shapes.get(id)
          if (shape) {
            updateShape(id, { x: shape.x + delta.x, y: shape.y + delta.y })
          }
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedIds, shapeIds, shapes, deleteShapes, clearSelection, selectMultiple, updateShape])

  return isShiftPressedRef
}
