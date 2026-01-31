'use client'

import { useShapeProperties } from '@ozdemircibaris/react-whiteboard'
import type { FillStyle, StrokeStyle } from '@ozdemircibaris/react-whiteboard'

// ============================================================================
// Constants
// ============================================================================

const STROKE_COLORS = [
  '#1e1e1e', '#6b7280', '#dc2626', '#2563eb',
  '#16a34a', '#ea580c', '#9333ea', '#ec4899',
]

const FILL_COLORS = [
  'transparent', '#fef3c7', '#dbeafe', '#dcfce7',
  '#fce7f3', '#f3e8ff', '#e0f2fe', '#e0e0e0',
]

const FILL_STYLES: { value: FillStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'hachure', label: 'Hatch' },
  { value: 'cross-hatch', label: 'Cross' },
  { value: 'dots', label: 'Dots' },
]

const STROKE_STYLES: { value: StrokeStyle; label: string }[] = [
  { value: 'solid', label: '---' },
  { value: 'dashed', label: '- -' },
  { value: 'dotted', label: '...' },
]

const STROKE_WIDTHS = [1, 2, 4, 6]

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

// ============================================================================
// Main Panel
// ============================================================================

export function ShapePropertiesPanel() {
  const {
    currentProps,
    selectedCount,
    hasRectangle,
    hasFillableShape,
    setFill,
    setFillStyle,
    setStroke,
    setStrokeWidth,
    setStrokeStyle,
    setOpacity,
    setCornerRadius,
  } = useShapeProperties()

  if (selectedCount === 0) return null

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-3 rounded-xl bg-white px-4 py-3 shadow-lg border border-gray-200 min-w-[220px]">
      {/* Stroke Color */}
      <PanelSection label="Stroke">
        {STROKE_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setStroke(c)}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
              currentProps.stroke === c ? 'border-blue-500 scale-110' : 'border-gray-200'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </PanelSection>

      {/* Stroke Width */}
      <PanelSection label="Width">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setStrokeWidth(w)}
            className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
              currentProps.strokeWidth === w
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {w}
          </button>
        ))}
      </PanelSection>

      {/* Stroke Style */}
      <PanelSection label="Stroke Style">
        {STROKE_STYLES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStrokeStyle(value)}
            className={`h-7 rounded px-2 text-xs font-mono font-medium transition-colors ${
              currentProps.strokeStyle === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </PanelSection>

      {/* Fill Color (only for rect/ellipse) */}
      {hasFillableShape && (
        <PanelSection label="Fill">
          {FILL_COLORS.map((c) => {
            const isTransparent = c === 'transparent'
            return (
              <button
                key={c}
                onClick={() => setFill(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentProps.fill === c
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
      )}

      {/* Fill Style (only for rect/ellipse) */}
      {hasFillableShape && (
        <PanelSection label="Fill Style">
          {FILL_STYLES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFillStyle(value)}
              className={`h-7 rounded px-2 text-xs font-medium transition-colors ${
                currentProps.fillStyle === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </PanelSection>
      )}

      {/* Opacity */}
      <PanelSection label={`Opacity: ${Math.round(currentProps.opacity * 100)}%`}>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(currentProps.opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-blue-600"
        />
      </PanelSection>

      {/* Corner Radius (only for rectangles) */}
      {hasRectangle && (
        <PanelSection label={`Corner: ${currentProps.cornerRadius}px`}>
          <input
            type="range"
            min={0}
            max={40}
            value={currentProps.cornerRadius}
            onChange={(e) => setCornerRadius(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-blue-600"
          />
        </PanelSection>
      )}
    </div>
  )
}
