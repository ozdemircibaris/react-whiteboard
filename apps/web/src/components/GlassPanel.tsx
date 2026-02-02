type GlassPanelProps = React.HTMLAttributes<HTMLDivElement>

export function GlassPanel({ children, className = '', style, ...rest }: GlassPanelProps) {
  return (
    <div
      className={`rounded-xl backdrop-blur-xl border ${className}`}
      style={{
        background: 'var(--wb-bg-elevated)',
        borderColor: 'var(--wb-border-subtle)',
        boxShadow: 'var(--wb-shadow)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
