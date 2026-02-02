import { useShapeProperties } from '@ozdemircibaris/react-whiteboard'
import type { FillStyle, StrokeStyle } from '@ozdemircibaris/react-whiteboard'
import { GlassPanel } from './GlassPanel'
import { PanelSection } from './PanelSection'
import { OptionButton } from './OptionButton'
import { ColorSwatch } from './ColorSwatch'

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
    <div className="absolute top-1/2 right-3 -translate-y-1/2 z-50">
      <GlassPanel className="flex flex-col gap-3 px-4 py-3 min-w-[220px]">
        <PanelSection label="Stroke">
          {STROKE_COLORS.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              active={currentProps.stroke === c}
              onClick={() => setStroke(c)}
            />
          ))}
        </PanelSection>

        <PanelSection label="Width">
          {STROKE_WIDTHS.map((w) => (
            <OptionButton
              key={w}
              active={currentProps.strokeWidth === w}
              onClick={() => setStrokeWidth(w)}
              className="w-7"
            >
              {w}
            </OptionButton>
          ))}
        </PanelSection>

        <PanelSection label="Stroke Style">
          {STROKE_STYLES.map(({ value, label }) => (
            <OptionButton
              key={value}
              active={currentProps.strokeStyle === value}
              onClick={() => setStrokeStyle(value)}
              className="font-mono"
            >
              {label}
            </OptionButton>
          ))}
        </PanelSection>

        {hasFillableShape && (
          <PanelSection label="Fill">
            {FILL_COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                active={currentProps.fill === c}
                onClick={() => setFill(c)}
              />
            ))}
          </PanelSection>
        )}

        {hasFillableShape && (
          <PanelSection label="Fill Style">
            {FILL_STYLES.map(({ value, label }) => (
              <OptionButton
                key={value}
                active={currentProps.fillStyle === value}
                onClick={() => setFillStyle(value)}
              >
                {label}
              </OptionButton>
            ))}
          </PanelSection>
        )}

        <PanelSection label={`Opacity: ${Math.round(currentProps.opacity * 100)}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(currentProps.opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            aria-label="Opacity"
            className="w-full h-1.5 rounded-lg cursor-pointer"
            style={{ accentColor: 'var(--wb-accent)' }}
          />
        </PanelSection>

        {hasRectangle && (
          <PanelSection label={`Corner: ${currentProps.cornerRadius}px`}>
            <input
              type="range"
              min={0}
              max={40}
              value={currentProps.cornerRadius}
              onChange={(e) => setCornerRadius(Number(e.target.value))}
              aria-label="Corner radius"
              className="w-full h-1.5 rounded-lg cursor-pointer"
              style={{ accentColor: 'var(--wb-accent)' }}
            />
          </PanelSection>
        )}
      </GlassPanel>
    </div>
  )
}
