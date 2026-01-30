import { useRef, useCallback } from 'react'
import type { Point, Viewport } from '../types'
import { screenToCanvas } from '../utils/canvas'

interface TouchGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  viewport: Viewport
  pan: (dx: number, dy: number) => void
  zoom: (delta: number, center: Point) => void
}

/**
 * Hook for managing touch gestures (pinch zoom, two-finger pan)
 */
export function useTouchGestures({
  containerRef,
  viewport,
  pan,
  zoom,
}: TouchGesturesOptions) {
  const touchesRef = useRef<Map<number, Point>>(new Map())
  const lastPinchDistanceRef = useRef<number | null>(null)
  const lastPinchCenterRef = useRef<Point | null>(null)

  const getDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getCenter = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    Array.from(e.touches).forEach((touch) => {
      touchesRef.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
    })

    if (e.touches.length === 2) {
      const touch0 = e.touches[0]
      const touch1 = e.touches[1]
      if (!touch0 || !touch1) return

      const t1 = { x: touch0.clientX, y: touch0.clientY }
      const t2 = { x: touch1.clientX, y: touch1.clientY }
      lastPinchDistanceRef.current = getDistance(t1, t2)
      lastPinchCenterRef.current = getCenter(t1, t2)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      if (e.touches.length === 2) {
        const touch0 = e.touches[0]
        const touch1 = e.touches[1]
        if (!touch0 || !touch1) return

        const t1 = { x: touch0.clientX, y: touch0.clientY }
        const t2 = { x: touch1.clientX, y: touch1.clientY }

        const currentDistance = getDistance(t1, t2)
        const currentCenter = getCenter(t1, t2)

        // Pinch zoom
        if (lastPinchDistanceRef.current !== null) {
          const rect = container.getBoundingClientRect()
          const canvasCenter = screenToCanvas(currentCenter, viewport, rect)

          const scale = currentDistance / lastPinchDistanceRef.current
          const newZoom = viewport.zoom * scale
          const zoomDelta = newZoom - viewport.zoom

          zoom(zoomDelta, canvasCenter)
        }

        // Two-finger pan
        if (lastPinchCenterRef.current !== null) {
          const deltaX = currentCenter.x - lastPinchCenterRef.current.x
          const deltaY = currentCenter.y - lastPinchCenterRef.current.y
          pan(deltaX, deltaY)
        }

        lastPinchDistanceRef.current = currentDistance
        lastPinchCenterRef.current = currentCenter
      } else if (e.touches.length === 1) {
        const touch = e.touches[0]
        if (touch) {
          touchesRef.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY })
        }
      }
    },
    [containerRef, viewport, zoom, pan]
  )

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    Array.from(e.changedTouches).forEach((touch) => {
      touchesRef.current.delete(touch.identifier)
    })

    if (e.touches.length < 2) {
      lastPinchDistanceRef.current = null
      lastPinchCenterRef.current = null
    }

    if (e.touches.length === 2) {
      const touch0 = e.touches[0]
      const touch1 = e.touches[1]
      if (!touch0 || !touch1) return

      const t1 = { x: touch0.clientX, y: touch0.clientY }
      const t2 = { x: touch1.clientX, y: touch1.clientY }
      lastPinchDistanceRef.current = getDistance(t1, t2)
      lastPinchCenterRef.current = getCenter(t1, t2)
    }
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
