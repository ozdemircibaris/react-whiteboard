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
  return (
    <button
      onClick={onClick}
      aria-label={label ?? (isTransparent ? 'Transparent' : color)}
      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
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
