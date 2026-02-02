import {
  useTextProperties,
  useWhiteboardStore,
} from '@ozdemircibaris/react-whiteboard'
import type { TextFontFamily } from '@ozdemircibaris/react-whiteboard'
import { GlassPanel } from './GlassPanel'
import { PanelSection } from './PanelSection'
import { OptionButton } from './OptionButton'
import { ColorSwatch } from './ColorSwatch'

const TEXT_COLORS_LIGHT = [
  '#1e1e1e', '#6b7280', '#dc2626', '#2563eb',
  '#16a34a', '#ea580c', '#9333ea', '#ec4899',
]

const TEXT_COLORS_DARK = [
  '#e0e0e0', '#9ca3af', '#f87171', '#60a5fa',
  '#4ade80', '#fb923c', '#c084fc', '#f472b6',
]

const BG_COLORS_LIGHT = [
  'transparent', '#fef3c7', '#dbeafe', '#dcfce7',
  '#fce7f3', '#f3e8ff', '#e0f2fe',
]

const BG_COLORS_DARK = [
  'transparent', '#422006', '#172554', '#052e16',
  '#500724', '#3b0764', '#082f49',
]

const FONT_FAMILY_LABELS: Record<TextFontFamily, string> = {
  hand: 'Hand',
  sans: 'Sans',
  serif: 'Serif',
  mono: 'Mono',
}

const SIZE_LABELS = ['S', 'M', 'L', 'XL'] as const

export function TextPropertiesPanel({ isDark = false }: { isDark?: boolean }) {
  const currentTool = useWhiteboardStore((s) => s.currentTool)
  const textColors = isDark ? TEXT_COLORS_DARK : TEXT_COLORS_LIGHT
  const bgColors = isDark ? BG_COLORS_DARK : BG_COLORS_LIGHT
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

  const isTextTool = currentTool === 'text'
  if (!isTextTool && selectedCount === 0) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
      <GlassPanel className="flex items-center gap-4 px-4 py-2">
        <PanelSection label="Font">
          {(Object.keys(FONT_FAMILY_LABELS) as TextFontFamily[]).map((key) => (
            <OptionButton
              key={key}
              active={currentProps.fontFamily === key}
              onClick={() => setFontFamily(key)}
            >
              {FONT_FAMILY_LABELS[key]}
            </OptionButton>
          ))}
        </PanelSection>

        <PanelSection label="Size">
          {SIZE_LABELS.map((preset) => (
            <OptionButton
              key={preset}
              active={currentProps.fontSize === fontSizePresets[preset]}
              onClick={() => setFontSizePreset(preset)}
              className="w-7"
            >
              {preset}
            </OptionButton>
          ))}
        </PanelSection>

        <PanelSection label="Color">
          {textColors.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              active={currentProps.color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </PanelSection>

        <PanelSection label="Fill">
          {bgColors.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              active={currentProps.backgroundColor === c}
              onClick={() => setBackgroundColor(c)}
            />
          ))}
        </PanelSection>

        <PanelSection label="Align">
          {(['left', 'center', 'right'] as const).map((a) => (
            <OptionButton
              key={a}
              active={currentProps.align === a}
              onClick={() => setAlign(a)}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </OptionButton>
          ))}
        </PanelSection>

        <PanelSection label="Style">
          <OptionButton
            active={currentProps.fontWeight === 700}
            onClick={toggleBold}
            className="w-7 font-bold"
          >
            B
          </OptionButton>
          <OptionButton
            active={currentProps.fontStyle === 'italic'}
            onClick={toggleItalic}
            className="w-7 italic"
          >
            I
          </OptionButton>
        </PanelSection>
      </GlassPanel>
    </div>
  )
}
