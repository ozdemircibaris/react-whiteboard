import type { TextFontFamily, TextShapeProps } from '../types'

/**
 * Font family → CSS font stack mapping.
 * Each key maps to a full CSS font-family fallback chain.
 */
export const FONT_FAMILIES: Record<TextFontFamily, string> = {
  hand: 'Virgil, "Comic Sans MS", cursive',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Cascadia Code", "Fira Code", "Courier New", monospace',
}

/**
 * Font size presets matching Excalidraw's S/M/L/XL pattern.
 */
export const FONT_SIZE_PRESETS = {
  S: 16,
  M: 20,
  L: 28,
  XL: 36,
} as const

export type FontSizePreset = keyof typeof FONT_SIZE_PRESETS

/**
 * Default text styling properties for new text shapes.
 */
export const DEFAULT_TEXT_PROPS: Omit<TextShapeProps, 'text'> = {
  fontSize: 20,
  fontFamily: 'hand',
  fontWeight: 400,
  fontStyle: 'normal',
  color: '#1e1e1e',
  backgroundColor: 'transparent',
  align: 'left',
  lineHeight: 1.25,
}

/**
 * Build a CSS font string from text shape properties.
 * Used by both the canvas renderer and the textarea WYSIWYG overlay.
 */
export function resolveFont(props: Pick<TextShapeProps, 'fontStyle' | 'fontWeight' | 'fontSize' | 'fontFamily'>): string {
  const style = props.fontStyle === 'italic' ? 'italic ' : ''
  const family = FONT_FAMILIES[props.fontFamily] ?? FONT_FAMILIES.sans
  return `${style}${props.fontWeight} ${props.fontSize}px ${family}`
}

/** Module-level cached canvas/context for text measurement (avoids DOM allocation per call) */
let _measureCanvas: HTMLCanvasElement | null = null
let _measureCtx: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (!_measureCtx) {
    _measureCanvas = document.createElement('canvas')
    _measureCtx = _measureCanvas.getContext('2d')
  }
  return _measureCtx
}

/**
 * Measure text dimensions for multiline text.
 * Returns width (max line width) and height (total line heights).
 */
export function measureTextLines(
  text: string,
  props: Pick<TextShapeProps, 'fontSize' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'lineHeight'>,
): { width: number; height: number; lines: string[] } {
  const lines = text.split('\n')
  const lineSpacing = props.fontSize * props.lineHeight

  const ctx = getMeasureContext()
  if (!ctx) {
    return {
      width: 50,
      height: Math.max(lines.length, 1) * lineSpacing,
      lines,
    }
  }

  ctx.font = resolveFont(props)

  let maxWidth = 0
  for (const line of lines) {
    const metrics = ctx.measureText(line || ' ')
    maxWidth = Math.max(maxWidth, metrics.width)
  }

  return {
    width: Math.max(maxWidth + 8, 50),
    height: Math.max(lines.length, 1) * lineSpacing,
    lines,
  }
}
