const COLOR_NAMES: Record<string, string> = {
  // Light mode text colors
  '#1e1e1e': 'Black',
  '#6b7280': 'Gray',
  '#dc2626': 'Red',
  '#2563eb': 'Blue',
  '#16a34a': 'Green',
  '#ea580c': 'Orange',
  '#9333ea': 'Purple',
  '#ec4899': 'Pink',
  // Dark mode text colors
  '#e0e0e0': 'White',
  '#9ca3af': 'Gray',
  '#f87171': 'Red',
  '#60a5fa': 'Blue',
  '#4ade80': 'Green',
  '#fb923c': 'Orange',
  '#c084fc': 'Purple',
  '#f472b6': 'Pink',
  // Light mode backgrounds
  '#fef3c7': 'Light Yellow',
  '#dbeafe': 'Light Blue',
  '#dcfce7': 'Light Green',
  '#fce7f3': 'Light Pink',
  '#f3e8ff': 'Light Purple',
  '#e0f2fe': 'Light Cyan',
  // Dark mode backgrounds
  '#422006': 'Dark Yellow',
  '#172554': 'Dark Blue',
  '#052e16': 'Dark Green',
  '#500724': 'Dark Pink',
  '#3b0764': 'Dark Purple',
  '#082f49': 'Dark Cyan',
}

interface ColorSwatchProps {
  color: string
  active: boolean
  onClick: () => void
  label?: string
}

export function ColorSwatch({
  color,
  active,
  onClick,
  label,
}: ColorSwatchProps) {
  const isTransparent = color === 'transparent'
  const readableLabel = label ?? (isTransparent ? 'Transparent' : (COLOR_NAMES[color.toLowerCase()] ?? color))
  return (
    <button
      onClick={onClick}
      aria-label={readableLabel}
      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wb-accent)] focus-visible:ring-offset-1 ${
        active ? 'scale-110' : ''
      }`}
      style={{
        borderColor: active ? 'var(--wb-accent)' : 'var(--wb-border)',
        backgroundColor: isTransparent ? 'var(--wb-bg)' : color,
        backgroundImage: isTransparent
          ? 'linear-gradient(135deg, var(--wb-bg) 45%, #ef4444 45%, #ef4444 55%, var(--wb-bg) 55%)'
          : undefined,
      }}
    />
  )
}
