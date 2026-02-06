import './IconButton.css'

interface IconButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

export function IconButton({
  icon,
  label,
  active = false,
  disabled = false,
  destructive = false,
  onClick,
  size = 'sm',
}: IconButtonProps) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'

  const variant = active
    ? 'wb-icon-btn--active'
    : destructive
      ? 'wb-icon-btn--destructive'
      : 'wb-icon-btn--default'

  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`wb-icon-btn ${variant} ${dim} inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wb-accent)]`}
    >
      {icon}
    </button>
  )
}
