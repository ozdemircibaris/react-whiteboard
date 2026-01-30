'use client'

import {
  useTextProperties,
  useWhiteboardStore,
} from '@ozdemircibaris/react-whiteboard'
import type { TextFontFamily } from '@ozdemircibaris/react-whiteboard'

// ============================================================================
// Constants
// ============================================================================

const TEXT_COLORS = [
  '#1e1e1e', '#6b7280', '#dc2626', '#2563eb',
  '#16a34a', '#ea580c', '#9333ea', '#ec4899',
]

const BG_COLORS = [
  'transparent', '#fef3c7', '#dbeafe', '#dcfce7',
  '#fce7f3', '#f3e8ff', '#e0f2fe',
]

const FONT_FAMILY_LABELS: Record<TextFontFamily, string> = {
  hand: 'Hand',
  sans: 'Sans',
  serif: 'Serif',
  mono: 'Mono',
}

const SIZE_LABELS = ['S', 'M', 'L', 'XL'] as const

// ============================================================================
// Small UI helpers
// ============================================================================

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 w-7 rounded text-xs font-bold transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

// ============================================================================
// Main Panel
// ============================================================================

export function TextPropertiesPanel() {
  const currentTool = useWhiteboardStore((s) => s.currentTool)
  const {
    currentProps,
    selectedCount,
    fontSizePresets,
    setFontFamily,
    setFontSizePreset,
    setColor,
    setBackgroundColor,
    setAlign,
    toggleBold,
    toggleItalic,
  } = useTextProperties()

  // Only show when text tool is active or text shapes are selected
  const isTextTool = currentTool === 'text'
  if (!isTextTool && selectedCount === 0) return null

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl bg-white px-4 py-2 shadow-lg border border-gray-200">
      {/* Font Family */}
      <PanelSection label="Font">
        {(Object.keys(FONT_FAMILY_LABELS) as TextFontFamily[]).map((key) => (
          <button
            key={key}
            onClick={() => setFontFamily(key)}
            className={`h-7 rounded px-2 text-xs font-medium transition-colors ${
              currentProps.fontFamily === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {FONT_FAMILY_LABELS[key]}
          </button>
        ))}
      </PanelSection>

      {/* Font Size */}
      <PanelSection label="Size">
        {SIZE_LABELS.map((preset) => (
          <button
            key={preset}
            onClick={() => setFontSizePreset(preset)}
            className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
              currentProps.fontSize === fontSizePresets[preset]
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset}
          </button>
        ))}
      </PanelSection>

      {/* Text Color */}
      <PanelSection label="Color">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
              currentProps.color === c ? 'border-blue-500 scale-110' : 'border-gray-200'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </PanelSection>

      {/* Background Color */}
      <PanelSection label="Fill">
        {BG_COLORS.map((c) => {
          const isTransparent = c === 'transparent'
          return (
            <button
              key={c}
              onClick={() => setBackgroundColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                currentProps.backgroundColor === c
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-200'
              }`}
              style={{
                backgroundColor: isTransparent ? '#fff' : c,
                backgroundImage: isTransparent
                  ? 'linear-gradient(135deg, #fff 45%, #ef4444 45%, #ef4444 55%, #fff 55%)'
                  : undefined,
              }}
            />
          )
        })}
      </PanelSection>

      {/* Alignment */}
      <PanelSection label="Align">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAlign(a)}
            className={`h-7 rounded px-2 text-xs font-medium transition-colors ${
              currentProps.align === a
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </PanelSection>

      {/* Bold / Italic */}
      <PanelSection label="Style">
        <ToggleButton active={currentProps.fontWeight === 700} onClick={toggleBold}>
          B
        </ToggleButton>
        <ToggleButton active={currentProps.fontStyle === 'italic'} onClick={toggleItalic}>
          I
        </ToggleButton>
      </PanelSection>
    </div>
  )
}
