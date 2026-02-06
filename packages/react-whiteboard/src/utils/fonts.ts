import type { TextFontFamily, TextShapeProps } from '../types'

/**
 * Font family → CSS font stack mapping.
 * Each key maps to a full CSS font-family fallback chain.
 */
export const FONT_FAMILIES: Record<TextFontFamily, string> = {
  hand: 'Virgil, "Segoe Print", "Bradley Hand", "Marker Felt", cursive',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Courier New", monospace',
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

/**
 * Default CDN URLs for whiteboard fonts.
 * Consumers can override these or load fonts via @font-face CSS.
 */
const DEFAULT_FONT_URLS: Record<string, string> = {
  Virgil:
    'https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw-assets/Virgil.woff2',
  'Cascadia Code':
    'https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw-assets/Cascadia.woff2',
}

/**
 * Load whiteboard fonts using the FontFace API.
 * Call this once at app startup to ensure hand-drawn and mono fonts render correctly.
 *
 * If fonts are already loaded (e.g. via CSS @font-face), this is a no-op for those fonts.
 *
 * @param urls - Optional map of font name → URL. Defaults to CDN-hosted Virgil + Cascadia Code.
 * @returns Promise that resolves when all fonts have loaded (or failed gracefully).
 */
export async function loadFonts(
  urls?: Record<string, string>,
): Promise<void> {
  if (typeof document === 'undefined' || !('FontFace' in globalThis)) return

  const fontsToLoad = urls ?? DEFAULT_FONT_URLS

  const promises = Object.entries(fontsToLoad).map(async ([name, url]) => {
    // Skip if already loaded
    if (document.fonts.check(`16px "${name}"`)) return

    try {
      const font = new FontFace(name, `url(${url})`)
      const loaded = await font.load()
      document.fonts.add(loaded)
    } catch {
      // Font load failed — fallback fonts will be used
    }
  })

  await Promise.allSettled(promises)
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

/** Default max width for new text shapes (in canvas units) */
export const DEFAULT_TEXT_MAX_WIDTH = 300

type FontMeasureProps = Pick<TextShapeProps, 'fontSize' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'lineHeight'>

/**
 * Measure text dimensions for multiline text (no word-wrap).
 * Returns width (max line width) and height (total line heights).
 */
export function measureTextLines(
  text: string,
  props: FontMeasureProps,
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

/**
 * Word-wrap text within a given maxWidth and measure the result.
 * Preserves explicit newlines, then wraps each paragraph by word boundaries.
 * Returns actual rendered width (may be less than maxWidth for short text).
 */
/**
 * Break a single word into chunks that each fit within maxWidth.
 * Returns the word as-is in a single-element array if it fits.
 */
function breakWord(word: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
  if (ctx.measureText(word).width <= maxWidth) return [word]

  const chunks: string[] = []
  let current = ''
  for (const char of word) {
    const test = current + char
    if (ctx.measureText(test).width > maxWidth && current) {
      chunks.push(current)
      current = char
    } else {
      current = test
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/**
 * Word-wrap text within a given maxWidth and measure the result.
 * Preserves explicit newlines, then wraps each paragraph by word boundaries.
 * Long words/URLs that exceed maxWidth are broken at character boundaries.
 * Returns actual rendered width (may be less than maxWidth for short text).
 */
export function wrapTextLines(
  text: string,
  maxWidth: number,
  props: FontMeasureProps,
): { width: number; height: number; lines: string[] } {
  const paragraphs = text.split('\n')
  const lineSpacing = props.fontSize * props.lineHeight

  const ctx = getMeasureContext()
  if (!ctx) {
    return {
      width: Math.min(maxWidth, 50),
      height: Math.max(paragraphs.length, 1) * lineSpacing,
      lines: paragraphs,
    }
  }

  ctx.font = resolveFont(props)
  const wrappedLines: string[] = []
  let actualMaxWidth = 0

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      wrappedLines.push('')
      continue
    }

    const words = paragraph.split(' ')
    let currentLine = ''

    for (const rawWord of words) {
      const wordChunks = breakWord(rawWord, maxWidth, ctx)

      for (const word of wordChunks) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = ctx.measureText(testLine).width

        if (testWidth <= maxWidth || !currentLine) {
          currentLine = testLine
        } else {
          actualMaxWidth = Math.max(actualMaxWidth, ctx.measureText(currentLine).width)
          wrappedLines.push(currentLine)
          currentLine = word
        }
      }
    }

    if (currentLine) {
      actualMaxWidth = Math.max(actualMaxWidth, ctx.measureText(currentLine).width)
      wrappedLines.push(currentLine)
    }
  }

  if (wrappedLines.length === 0) {
    wrappedLines.push('')
  }

  return {
    width: Math.max(actualMaxWidth + 8, 50),
    height: Math.max(wrappedLines.length, 1) * lineSpacing,
    lines: wrappedLines,
  }
}
