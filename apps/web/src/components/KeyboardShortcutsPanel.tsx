import { useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { GlassPanel } from './GlassPanel'
import { IconButton } from './IconButton'

export function KeyboardShortcutsPanel() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <div className="absolute bottom-4 left-4 z-10">
        <GlassPanel className="p-1">
          <IconButton
            icon={<Keyboard size={16} />}
            label="Keyboard Shortcuts"
            onClick={() => setOpen(true)}
          />
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <GlassPanel className="p-3 max-w-[260px]">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--wb-text)' }}
          >
            Shortcuts
          </span>
          <IconButton
            icon={<X size={14} />}
            label="Close"
            onClick={() => setOpen(false)}
          />
        </div>

        <Section title="Tools">
          <Row keys="Click" desc="Select shape" />
          <Row keys="Drag" desc="Draw / Move" />
          <Row keys="Shift" desc="Constrain (square, 45deg)" />
          <Row keys="Dbl-click" desc="Edit text" />
        </Section>

        <Section title="Navigate">
          <Row keys="Scroll" desc="Zoom in/out" />
          <Row keys="Alt+Drag" desc="Pan canvas" />
          <Row keys="Middle btn" desc="Pan canvas" />
        </Section>

        <Section title="Editing">
          <Row keys="Cmd+Z / Y" desc="Undo / Redo" />
          <Row keys="Cmd+C/X/V" desc="Copy / Cut / Paste" />
          <Row keys="Cmd+D" desc="Duplicate" />
          <Row keys="Cmd+A" desc="Select all" />
          <Row keys="Del" desc="Delete selected" />
          <Row keys="Arrows" desc="Nudge (Shift: 10px)" />
        </Section>
      </GlassPanel>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <span
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--wb-text-disabled)' }}
      >
        {title}
      </span>
      <div className="mt-0.5 space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span
        className="font-mono shrink-0"
        style={{ color: 'var(--wb-text-secondary)' }}
      >
        {keys}
      </span>
      <span style={{ color: 'var(--wb-text-disabled)' }}>{desc}</span>
    </div>
  )
}
