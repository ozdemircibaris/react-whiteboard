import type { Point, Viewport } from '../../types'
import type { StoreApi } from './types'
import { easeOutCubic } from '../../utils/canvas'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 10
const DEFAULT_ZOOM_DURATION = 200

const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
}

/** Track active zoom animation for cancellation */
let activeZoomAnimation: number | null = null

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function createViewportActions(set: StoreApi['set'], get: StoreApi['get']) {
  return {
    setViewport: (viewport: Partial<Viewport>) =>
      set((state) => ({
        viewport: { ...state.viewport, ...viewport },
      })),

    pan: (deltaX: number, deltaY: number) =>
      set((state) => ({
        viewport: {
          ...state.viewport,
          x: state.viewport.x + deltaX,
          y: state.viewport.y + deltaY,
        },
      })),

    zoom: (delta: number, center?: Point) => {
      const state = get()
      const newZoom = clampZoom(state.viewport.zoom + delta)

      if (center) {
        const newX = state.viewport.x + center.x * (state.viewport.zoom - newZoom)
        const newY = state.viewport.y + center.y * (state.viewport.zoom - newZoom)
        set({ viewport: { x: newX, y: newY, zoom: newZoom } })
      } else {
        set({ viewport: { ...state.viewport, zoom: newZoom } })
      }
    },

    zoomTo: (targetZoom: number, center?: Point) => {
      const state = get()
      const newZoom = clampZoom(targetZoom)

      if (center) {
        const newX = state.viewport.x + center.x * (state.viewport.zoom - newZoom)
        const newY = state.viewport.y + center.y * (state.viewport.zoom - newZoom)
        set({ viewport: { x: newX, y: newY, zoom: newZoom } })
      } else {
        set({ viewport: { ...state.viewport, zoom: newZoom } })
      }
    },

    animateZoom: (targetZoom: number, center?: Point, duration = DEFAULT_ZOOM_DURATION) => {
      if (activeZoomAnimation !== null) {
        cancelAnimationFrame(activeZoomAnimation)
        activeZoomAnimation = null
      }

      const startState = get().viewport
      const startZoom = startState.zoom
      const clampedTarget = clampZoom(targetZoom)
      const startTime = performance.now()

      function step(currentTime: number) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeOutCubic(progress)
        const currentZoom = startZoom + (clampedTarget - startZoom) * easedProgress

        if (center) {
          const newX = startState.x + center.x * (startZoom - currentZoom)
          const newY = startState.y + center.y * (startZoom - currentZoom)
          set({ viewport: { x: newX, y: newY, zoom: currentZoom } })
        } else {
          set((s) => ({ viewport: { ...s.viewport, zoom: currentZoom } }))
        }

        if (progress < 1) {
          activeZoomAnimation = requestAnimationFrame(step)
        } else {
          activeZoomAnimation = null
        }
      }

      activeZoomAnimation = requestAnimationFrame(step)
    },

    resetViewport: () =>
      set({ viewport: { ...DEFAULT_VIEWPORT } }),
  }
}
