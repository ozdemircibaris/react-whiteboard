interface PanelSectionProps {
  label: string
  children: React.ReactNode
}

export function PanelSection({ label, children }: PanelSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--wb-text-disabled)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  )
}
