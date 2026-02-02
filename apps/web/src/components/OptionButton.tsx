interface OptionButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function OptionButton({
  active,
  onClick,
  children,
  className = '',
}: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`h-7 rounded px-2 text-xs font-medium transition-colors ${className}`}
      style={{
        background: active ? 'var(--wb-bg-active)' : 'var(--wb-bg-hover)',
        color: active ? 'var(--wb-text-on-active)' : 'var(--wb-text)',
      }}
    >
      {children}
    </button>
  )
}
