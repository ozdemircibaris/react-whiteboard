import { useEffect, useRef, useCallback } from 'react'
import { useWhiteboardStore } from '@ozdemircibaris/react-whiteboard'
import type { CanvasContextMenuEvent } from '@ozdemircibaris/react-whiteboard'

interface ContextMenuProps {
  event: CanvasContextMenuEvent
  onClose: () => void
}

interface MenuItem {
  label: string
  shortcut?: string
  action: () => void
  destructive?: boolean
  disabled?: boolean
}

type MenuEntry = MenuItem | 'separator'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
const mod = isMac ? '\u2318' : 'Ctrl+'

export function ContextMenu({ event, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const deleteShapes = useWhiteboardStore((s) => s.deleteShapes)
  const duplicateSelectedShapes = useWhiteboardStore((s) => s.duplicateSelectedShapes)
  const copySelectedShapes = useWhiteboardStore((s) => s.copySelectedShapes)
  const cutSelectedShapes = useWhiteboardStore((s) => s.cutSelectedShapes)
  const pasteShapes = useWhiteboardStore((s) => s.pasteShapes)
  const selectMultiple = useWhiteboardStore((s) => s.selectMultiple)
  const bringToFront = useWhiteboardStore((s) => s.bringToFront)
  const sendToBack = useWhiteboardStore((s) => s.sendToBack)
  const lockSelectedShapes = useWhiteboardStore((s) => s.lockSelectedShapes)
  const unlockSelectedShapes = useWhiteboardStore((s) => s.unlockSelectedShapes)
  const groupSelectedShapes = useWhiteboardStore((s) => s.groupSelectedShapes)
  const ungroupSelectedShapes = useWhiteboardStore((s) => s.ungroupSelectedShapes)

  const hasSelection = selectedIds.size > 0
  const multipleSelected = selectedIds.size > 1

  const hasLocked = hasSelection && Array.from(selectedIds).some((id) => shapes.get(id)?.isLocked)
  const hasUnlocked = hasSelection && Array.from(selectedIds).some((id) => !shapes.get(id)?.isLocked)
  const hasGroup = hasSelection && Array.from(selectedIds).some((id) => shapes.get(id)?.type === 'group')

  // Close on Escape or click outside
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('pointerdown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('pointerdown', handleClick)
    }
  }, [onClose])

  // Keep menu within viewport bounds
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const rect = menu.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      menu.style.left = `${event.screenPoint.x - rect.width}px`
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${event.screenPoint.y - rect.height}px`
    }
  }, [event.screenPoint])

  const exec = useCallback(
    (action: () => void) => {
      action()
      onClose()
    },
    [onClose],
  )

  const items: MenuEntry[] = hasSelection
    ? [
        { label: 'Copy', shortcut: `${mod}C`, action: () => exec(copySelectedShapes) },
        { label: 'Cut', shortcut: `${mod}X`, action: () => exec(cutSelectedShapes) },
        { label: 'Paste', shortcut: `${mod}V`, action: () => exec(pasteShapes) },
        { label: 'Duplicate', shortcut: `${mod}D`, action: () => exec(duplicateSelectedShapes) },
        'separator',
        { label: 'Bring to front', action: () => exec(bringToFront) },
        { label: 'Send to back', action: () => exec(sendToBack) },
        'separator',
        ...(multipleSelected
          ? [{ label: 'Group', shortcut: `${mod}G`, action: () => exec(groupSelectedShapes) } as MenuItem]
          : []),
        ...(hasGroup
          ? [{ label: 'Ungroup', shortcut: `${mod}\u21E7G`, action: () => exec(ungroupSelectedShapes) } as MenuItem]
          : []),
        ...(hasUnlocked
          ? [{ label: 'Lock', action: () => exec(lockSelectedShapes) } as MenuItem]
          : []),
        ...(hasLocked
          ? [{ label: 'Unlock', action: () => exec(unlockSelectedShapes) } as MenuItem]
          : []),
        'separator',
        {
          label: 'Delete',
          shortcut: isMac ? '\u232B' : 'Del',
          action: () => exec(() => deleteShapes(Array.from(selectedIds))),
          destructive: true,
        },
      ]
    : [
        { label: 'Paste', shortcut: `${mod}V`, action: () => exec(pasteShapes) },
        'separator',
        {
          label: 'Select all',
          shortcut: `${mod}A`,
          action: () => exec(() => selectMultiple(shapeIds)),
          disabled: shapeIds.length === 0,
        },
      ]

  // Filter out consecutive separators and leading/trailing separators
  const filtered = items.filter((item, i, arr) => {
    if (item !== 'separator') return true
    if (i === 0 || i === arr.length - 1) return false
    return arr[i - 1] !== 'separator'
  })

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-lg py-1 backdrop-blur-xl border select-none"
      style={{
        left: event.screenPoint.x,
        top: event.screenPoint.y,
        background: 'var(--wb-bg-elevated)',
        borderColor: 'var(--wb-border-subtle)',
        boxShadow: 'var(--wb-shadow)',
      }}
    >
      {filtered.map((item, i) =>
        item === 'separator' ? (
          <div
            key={`sep-${i}`}
            className="my-1 h-px mx-2"
            style={{ background: 'var(--wb-border)' }}
          />
        ) : (
          <button
            key={item.label}
            onClick={item.action}
            disabled={item.disabled}
            className="flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors disabled:opacity-40 focus-visible:outline-none"
            style={{
              color: item.destructive ? 'var(--wb-bg-destructive)' : 'var(--wb-text)',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--wb-bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-6 text-xs opacity-50">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  )
}
