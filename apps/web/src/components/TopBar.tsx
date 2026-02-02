import {
  Undo2,
  Redo2,
  ChevronsDown,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Save,
  FolderOpen,
  Image,
  Trash2,
} from 'lucide-react'
import {
  useWhiteboardStore,
  exportToJSON,
  parseDocument,
  documentToStoreData,
  downloadFile,
  pickAndReadFile,
  downloadPng,
} from '@ozdemircibaris/react-whiteboard'
import { GlassPanel } from './GlassPanel'
import { IconButton } from './IconButton'

function Separator() {
  return (
    <div
      className="mx-0.5 h-5 w-px"
      style={{ background: 'var(--wb-border)' }}
    />
  )
}

export function TopBar() {
  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const loadDocument = useWhiteboardStore((s) => s.loadDocument)
  const clearShapes = useWhiteboardStore((s) => s.clearShapes)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const canUndo = useWhiteboardStore((s) => s.historyIndex >= 0)
  const canRedo = useWhiteboardStore((s) => s.historyIndex < s.history.length - 1)
  const hasSelection = useWhiteboardStore((s) => s.selectedIds.size > 0)
  const bringToFront = useWhiteboardStore((s) => s.bringToFront)
  const sendToBack = useWhiteboardStore((s) => s.sendToBack)
  const bringForward = useWhiteboardStore((s) => s.bringForward)
  const sendBackward = useWhiteboardStore((s) => s.sendBackward)

  const handleSave = () => {
    const json = exportToJSON(shapes, shapeIds, viewport)
    downloadFile(json, 'whiteboard.json', 'application/json')
  }

  const handleLoad = async () => {
    try {
      const text = await pickAndReadFile('.json')
      if (!text) return
      const doc = parseDocument(text)
      const data = documentToStoreData(doc)
      loadDocument(data.shapes, data.shapeIds, data.viewport)
    } catch {
      alert('Invalid whiteboard file')
    }
  }

  const handleExportPng = () => {
    downloadPng(shapes, shapeIds, selectedIds)
  }

  return (
    <div className="absolute top-3 left-3 z-20">
      <GlassPanel className="flex items-center gap-0.5 px-1.5 py-1.5">
        {/* Undo / Redo */}
        <IconButton
          icon={<Undo2 size={16} />}
          label="Undo (Cmd+Z)"
          onClick={() => undo()}
          disabled={!canUndo}
        />
        <IconButton
          icon={<Redo2 size={16} />}
          label="Redo (Cmd+Shift+Z)"
          onClick={() => redo()}
          disabled={!canRedo}
        />

        <Separator />

        {/* Z-order */}
        <IconButton
          icon={<ChevronsDown size={16} />}
          label="Send to Back (Cmd+Shift+[)"
          onClick={sendToBack}
          disabled={!hasSelection}
        />
        <IconButton
          icon={<ChevronDown size={16} />}
          label="Send Backward (Cmd+[)"
          onClick={sendBackward}
          disabled={!hasSelection}
        />
        <IconButton
          icon={<ChevronUp size={16} />}
          label="Bring Forward (Cmd+])"
          onClick={bringForward}
          disabled={!hasSelection}
        />
        <IconButton
          icon={<ChevronsUp size={16} />}
          label="Bring to Front (Cmd+Shift+])"
          onClick={bringToFront}
          disabled={!hasSelection}
        />

        <Separator />

        {/* File operations */}
        <IconButton
          icon={<Save size={16} />}
          label="Save JSON"
          onClick={handleSave}
          disabled={shapeIds.length === 0}
        />
        <IconButton
          icon={<FolderOpen size={16} />}
          label="Load JSON"
          onClick={handleLoad}
        />
        <IconButton
          icon={<Image size={16} />}
          label="Export PNG"
          onClick={handleExportPng}
          disabled={shapeIds.length === 0}
        />

        <Separator />

        <IconButton
          icon={<Trash2 size={16} />}
          label="Clear All"
          onClick={() => clearShapes()}
          destructive
        />
      </GlassPanel>
    </div>
  )
}
