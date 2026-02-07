import { useEffect, useRef } from 'react'
import type { WhiteboardStore } from '../core/store/createStore'
import type { Shape, ToolType } from '../types'

interface KeyboardShortcutsOptions {
  /** Always-fresh state accessor (e.g. store.getState). Avoids stale closures. */
  getState: () => WhiteboardStore
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
 * Hook for managing keyboard shortcuts.
 *
 * Uses `getState()` to read shapes/selectedIds at keypress time,
 * so the event listener never re-registers when store state changes.
 */
export function useKeyboardShortcuts({ getState, readOnly = false }: KeyboardShortcutsOptions) {
  const isShiftPressedRef = useRef(false)

  // Track shift key for angle snapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Keyboard shortcuts (registered once — getState is stable)
  useEffect(() => {
    if (readOnly) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const isMod = e.metaKey || e.ctrlKey
      const moveAmount = e.shiftKey ? 10 : 1
      const state = getState()

      // Undo: Cmd/Ctrl+Z
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        state.undo()
        return
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if ((isMod && e.key.toLowerCase() === 'z' && e.shiftKey) || (isMod && e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        state.redo()
        return
      }

      // Copy: Cmd/Ctrl+C
      if (isMod && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        state.copySelectedShapes()
        return
      }

      // Cut: Cmd/Ctrl+X
      if (isMod && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        state.cutSelectedShapes()
        return
      }

      // Paste: Cmd/Ctrl+V
      if (isMod && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        state.pasteShapes()
        return
      }

      // Duplicate: Cmd/Ctrl+D
      if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        state.duplicateSelectedShapes()
        return
      }

      // Z-order: Cmd/Ctrl+] (bring forward), Cmd/Ctrl+Shift+] (bring to front)
      if (isMod && e.key === ']') {
        e.preventDefault()
        if (e.shiftKey) state.bringToFront()
        else state.bringForward()
        return
      }

      // Z-order: Cmd/Ctrl+[ (send backward), Cmd/Ctrl+Shift+[ (send to back)
      if (isMod && e.key === '[') {
        e.preventDefault()
        if (e.shiftKey) state.sendToBack()
        else state.sendBackward()
        return
      }

      // Lock: Cmd/Ctrl+L
      if (isMod && e.key.toLowerCase() === 'l' && !e.shiftKey) {
        e.preventDefault()
        state.lockSelectedShapes()
        return
      }

      // Unlock: Cmd/Ctrl+Shift+L
      if (isMod && e.key.toLowerCase() === 'l' && e.shiftKey) {
        e.preventDefault()
        state.unlockSelectedShapes()
        return
      }

      // Group: Cmd/Ctrl+G
      if (isMod && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault()
        state.groupSelectedShapes()
        return
      }

      // Ungroup: Cmd/Ctrl+Shift+G
      if (isMod && e.key.toLowerCase() === 'g' && e.shiftKey) {
        e.preventDefault()
        state.ungroupSelectedShapes()
        return
      }

      // Select All: Cmd/Ctrl+A
      if (isMod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        state.selectMultiple(state.shapeIds)
        return
      }

      // Delete selected: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedIds.size > 0) {
        e.preventDefault()
        state.deleteShapes(Array.from(state.selectedIds))
        return
      }

      // Clear selection: Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        state.clearSelection()
        return
      }

      // Move selected shapes with arrow keys
      if (state.selectedIds.size > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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

        const beforeShapes: Shape[] = []
        state.selectedIds.forEach((id) => {
          const shape = state.shapes.get(id)
          if (shape) {
            beforeShapes.push(structuredClone(shape) as Shape)
            state.updateShape(id, { x: shape.x + delta.x, y: shape.y + delta.y }, false)
          }
        })

        if (beforeShapes.length > 0) {
          const afterShapes: Shape[] = beforeShapes.map((before) => ({
            ...before,
            x: before.x + delta.x,
            y: before.y + delta.y,
          } as Shape))
          state.recordBatchUpdate(beforeShapes, afterShapes)
        }
        return
      }

      // Tool switching: single letter keys (V, R, O, L, A, D, T)
      if (!isMod) {
        const tool = TOOL_SHORTCUTS[e.key.toLowerCase()]
        if (tool) {
          e.preventDefault()
          state.setTool(tool)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readOnly, getState])

  return isShiftPressedRef
}
