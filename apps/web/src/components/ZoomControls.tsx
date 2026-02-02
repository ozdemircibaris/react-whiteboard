import { Minus, Plus, RotateCcw } from 'lucide-react'
import {
  useWhiteboardStore,
  MIN_ZOOM,
  MAX_ZOOM,
} from '@ozdemircibaris/react-whiteboard'
import { GlassPanel } from './GlassPanel'
import { IconButton } from './IconButton'

export function ZoomControls() {
  const viewport = useWhiteboardStore((s) => s.viewport)
  const animateZoom = useWhiteboardStore((s) => s.animateZoom)
  const resetViewport = useWhiteboardStore((s) => s.resetViewport)

  return (
    <GlassPanel className="flex items-center gap-0.5 px-1.5 py-1">
      <IconButton
        icon={<Minus size={14} />}
        label="Zoom Out"
        onClick={() => animateZoom(viewport.zoom - 0.25)}
        disabled={viewport.zoom <= MIN_ZOOM}
      />
      <span
        className="min-w-[3rem] text-center text-xs font-medium select-none"
        style={{ color: 'var(--wb-text-secondary)' }}
      >
        {Math.round(viewport.zoom * 100)}%
      </span>
      <IconButton
        icon={<Plus size={14} />}
        label="Zoom In"
        onClick={() => animateZoom(viewport.zoom + 0.25)}
        disabled={viewport.zoom >= MAX_ZOOM}
      />
      <IconButton
        icon={<RotateCcw size={14} />}
        label="Reset Zoom"
        onClick={resetViewport}
      />
    </GlassPanel>
  )
}
