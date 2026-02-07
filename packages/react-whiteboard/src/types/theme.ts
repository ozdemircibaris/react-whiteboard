/**
 * Theme color configuration for the whiteboard library.
 * Allows consumers to customize all visual colors used in canvas rendering.
 */

export interface ThemeColors {
  /** Canvas background color */
  canvasBackground: string

  /** Grid line color */
  grid: string

  /** Selection outline + handle stroke */
  selectionStroke: string
  /** Selection handle fill */
  selectionHandleFill: string

  /** Rotation handle line + circle stroke */
  rotationStroke: string
  /** Rotation handle circle fill */
  rotationHandleFill: string

  /** Marquee selection fill */
  marqueeFill: string
  /** Marquee selection stroke */
  marqueeStroke: string

  /** Snap guide line color */
  snapLine: string

  /** Minimap background */
  minimapBackground: string
  /** Minimap shape fill */
  minimapShapeFill: string
  /** Minimap shape stroke */
  minimapShapeStroke: string
  /** Minimap viewport rect stroke */
  minimapViewportStroke: string
  /** Minimap viewport rect fill */
  minimapViewportFill: string
  /** Minimap border color */
  minimapBorder: string

  /** Default text color for new text shapes */
  defaultTextColor: string
}

export const LIGHT_THEME: ThemeColors = {
  canvasBackground: '#fafafa',
  grid: '#e5e5e5',
  selectionStroke: '#0066ff',
  selectionHandleFill: '#ffffff',
  rotationStroke: '#0066ff',
  rotationHandleFill: '#ffffff',
  marqueeFill: 'rgba(0, 102, 255, 0.08)',
  marqueeStroke: 'rgba(0, 102, 255, 0.4)',
  snapLine: '#ff6b6b',
  minimapBackground: '#f8f8f8',
  minimapShapeFill: '#cbd5e1',
  minimapShapeStroke: '#94a3b8',
  minimapViewportStroke: '#3b82f6',
  minimapViewportFill: 'rgba(59, 130, 246, 0.08)',
  minimapBorder: '#e5e7eb',
  defaultTextColor: '#1e1e1e',
}

export const DARK_THEME: ThemeColors = {
  canvasBackground: '#1e1e2e',
  grid: '#252538',
  selectionStroke: '#4d9fff',
  selectionHandleFill: '#1e1e2e',
  rotationStroke: '#4d9fff',
  rotationHandleFill: '#1e1e2e',
  marqueeFill: 'rgba(77, 159, 255, 0.08)',
  marqueeStroke: 'rgba(77, 159, 255, 0.4)',
  snapLine: '#ff8080',
  minimapBackground: '#1a1a28',
  minimapShapeFill: '#3a3a5e',
  minimapShapeStroke: '#5a5a7e',
  minimapViewportStroke: '#4d9fff',
  minimapViewportFill: 'rgba(77, 159, 255, 0.1)',
  minimapBorder: '#2a2a40',
  defaultTextColor: '#e0e0e0',
}

/** Merge a partial theme with a base theme (defaults to LIGHT_THEME) */
export function resolveTheme(
  partial?: Partial<ThemeColors>,
  base: ThemeColors = LIGHT_THEME,
): ThemeColors {
  if (!partial) return base
  return { ...base, ...partial }
}
