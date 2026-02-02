interface GlassPanelProps {
  children: React.ReactNode
  className?: string
}

export function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return (
    <div
      className={`rounded-xl backdrop-blur-xl border ${className}`}
      style={{
        background: 'var(--wb-bg-elevated)',
        borderColor: 'var(--wb-border-subtle)',
        boxShadow: 'var(--wb-shadow)',
      }}
    >
      {children}
    </div>
  )
}
