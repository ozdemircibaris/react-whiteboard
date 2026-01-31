import type { FillStyle, StrokeStyle } from '../../types'
import type { StoreApi } from './types'

// ============================================================================
// Shape Style Defaults
// ============================================================================

export interface ShapeStyleDefaults {
  fill: string
  fillStyle: FillStyle
  stroke: string
  strokeWidth: number
  strokeStyle: StrokeStyle
  cornerRadius: number
  opacity: number
}

export const DEFAULT_SHAPE_STYLE: ShapeStyleDefaults = {
  fill: '#e0e0e0',
  fillStyle: 'hachure',
  stroke: '#333333',
  strokeWidth: 2,
  strokeStyle: 'solid',
  cornerRadius: 0,
  opacity: 1,
}

// ============================================================================
// Action Creator
// ============================================================================

export function createShapeStyleActions(
  set: StoreApi['set'],
  _get: StoreApi['get'],
) {
  return {
    currentShapeStyle: { ...DEFAULT_SHAPE_STYLE } as ShapeStyleDefaults,

    setCurrentShapeStyle: (props: Partial<ShapeStyleDefaults>) =>
      set((state) => ({
        currentShapeStyle: { ...state.currentShapeStyle, ...props },
      })),
  }
}
