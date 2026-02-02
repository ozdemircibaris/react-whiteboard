import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  MoveRight,
  Pencil,
  Type,
} from 'lucide-react'
import { useWhiteboardStore } from '@ozdemircibaris/react-whiteboard'
import type { ToolType } from '@ozdemircibaris/react-whiteboard'
import { GlassPanel } from './GlassPanel'
import { IconButton } from './IconButton'

const TOOLS: { type: ToolType; label: string; icon: React.ReactNode }[] = [
  { type: 'select', label: 'Select (V)', icon: <MousePointer2 size={18} /> },
  { type: 'rectangle', label: 'Rectangle (R)', icon: <Square size={18} /> },
  { type: 'ellipse', label: 'Ellipse (O)', icon: <Circle size={18} /> },
  { type: 'line', label: 'Line (L)', icon: <Minus size={18} /> },
  { type: 'arrow', label: 'Arrow (A)', icon: <MoveRight size={18} /> },
  { type: 'draw', label: 'Draw (D)', icon: <Pencil size={18} /> },
  { type: 'text', label: 'Text (T)', icon: <Type size={18} /> },
]

export function FloatingToolbar() {
  const currentTool = useWhiteboardStore((s) => s.currentTool)
  const setTool = useWhiteboardStore((s) => s.setTool)

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <GlassPanel className="flex items-center gap-0.5 px-1.5 py-1.5">
        {TOOLS.map(({ type, label, icon }) => (
          <IconButton
            key={type}
            icon={icon}
            label={label}
            active={currentTool === type}
            onClick={() => setTool(type)}
            size="md"
          />
        ))}
      </GlassPanel>
    </div>
  )
}
