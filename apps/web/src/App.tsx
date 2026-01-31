import {
  Canvas,
  Minimap,
  useWhiteboardStore,
  MIN_ZOOM,
  MAX_ZOOM,
  exportToJSON,
  parseDocument,
  documentToStoreData,
  downloadFile,
  pickAndReadFile,
  downloadPng,
} from '@ozdemircibaris/react-whiteboard'
import type { ToolType } from '@ozdemircibaris/react-whiteboard'
import { TextPropertiesPanel } from './TextPropertiesPanel'
import { ShapePropertiesPanel } from './ShapePropertiesPanel'

// Tool button component
function ToolButton({
  tool,
  currentTool,
  label,
  onClick,
}: {
  tool: ToolType
  currentTool: ToolType
  label: string
  onClick: () => void
}) {
  const isActive = tool === currentTool
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function Toolbar() {
  const shapes = useWhiteboardStore((s) => s.shapes)
  const shapeIds = useWhiteboardStore((s) => s.shapeIds)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const loadDocument = useWhiteboardStore((s) => s.loadDocument)
  const clearShapes = useWhiteboardStore((s) => s.clearShapes)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const resetViewport = useWhiteboardStore((s) => s.resetViewport)
  const animateZoom = useWhiteboardStore((s) => s.animateZoom)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const canUndo = useWhiteboardStore((s) => s.historyIndex >= 0)
  const canRedo = useWhiteboardStore((s) => s.historyIndex < s.history.length - 1)
  const currentTool = useWhiteboardStore((s) => s.currentTool)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const hasSelection = useWhiteboardStore((s) => s.selectedIds.size > 0)
  const bringToFront = useWhiteboardStore((s) => s.bringToFront)
  const sendToBack = useWhiteboardStore((s) => s.sendToBack)
  const bringForward = useWhiteboardStore((s) => s.bringForward)
  const sendBackward = useWhiteboardStore((s) => s.sendBackward)

  const tools: { type: ToolType; label: string }[] = [
    { type: 'select', label: 'Select' },
    { type: 'rectangle', label: 'Rectangle' },
    { type: 'ellipse', label: 'Ellipse' },
    { type: 'line', label: 'Line' },
    { type: 'arrow', label: 'Arrow' },
    { type: 'draw', label: 'Draw' },
    { type: 'text', label: 'Text' },
  ]

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Whiteboard</h1>
      </div>

      {/* Tool Selection */}
      <div className="flex items-center gap-1">
        {tools.map(({ type, label }) => (
          <ToolButton
            key={type}
            tool={type}
            currentTool={currentTool}
            label={label}
            onClick={() => setTool(type)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Redo
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={sendToBack}
          disabled={!hasSelection}
          title="Send to Back (Cmd+Shift+[)"
          className="rounded-md bg-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⇤
        </button>
        <button
          onClick={sendBackward}
          disabled={!hasSelection}
          title="Send Backward (Cmd+[)"
          className="rounded-md bg-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
        <button
          onClick={bringForward}
          disabled={!hasSelection}
          title="Bring Forward (Cmd+])"
          className="rounded-md bg-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
        <button
          onClick={bringToFront}
          disabled={!hasSelection}
          title="Bring to Front (Cmd+Shift+])"
          className="rounded-md bg-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⇥
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={() => clearShapes()}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Clear
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={() => {
            const json = exportToJSON(shapes, shapeIds, viewport)
            downloadFile(json, 'whiteboard.json', 'application/json')
          }}
          disabled={shapeIds.length === 0}
          title="Export as JSON"
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          onClick={async () => {
            const text = await pickAndReadFile('.json')
            if (!text) return
            try {
              const doc = parseDocument(text)
              const data = documentToStoreData(doc)
              loadDocument(data.shapes, data.shapeIds, data.viewport)
            } catch {
              alert('Invalid whiteboard file')
            }
          }}
          title="Import from JSON"
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Load
        </button>
        <button
          onClick={() => downloadPng(shapes, shapeIds, selectedIds)}
          disabled={shapeIds.length === 0}
          title="Export as PNG"
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          PNG
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => animateZoom(viewport.zoom - 0.25)}
          disabled={viewport.zoom <= MIN_ZOOM}
          className="rounded-md bg-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="min-w-[4rem] text-center text-sm text-gray-500">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={() => animateZoom(viewport.zoom + 0.25)}
          disabled={viewport.zoom >= MAX_ZOOM}
          className="rounded-md bg-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
        <button
          onClick={resetViewport}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Reset
        </button>
      </div>
    </header>
  )
}

function Instructions() {
  return (
    <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 text-sm text-gray-600 shadow-lg backdrop-blur">
      <p className="font-medium text-gray-800">Tools:</p>
      <ul className="mt-1 space-y-0.5">
        <li>• Select: Click to select, drag to move</li>
        <li>• Rectangle/Ellipse: Drag to draw (Shift for square/circle)</li>
        <li>• Line/Arrow: Drag to draw (Shift for 45° angles)</li>
        <li>• Draw: Freehand drawing</li>
        <li>• Text: Click to place, Cmd/Ctrl+Enter to confirm</li>
        <li>• Double-click text to edit</li>
      </ul>
      <p className="font-medium text-gray-800 mt-2">Navigation:</p>
      <ul className="mt-1 space-y-0.5">
        <li>• Scroll to zoom</li>
        <li>• Alt + drag to pan</li>
        <li>• Middle mouse to pan</li>
      </ul>
      <p className="font-medium text-gray-800 mt-2">Shortcuts:</p>
      <ul className="mt-1 space-y-0.5">
        <li>• Cmd/Ctrl + Z/Y to undo/redo</li>
        <li>• Cmd/Ctrl + C/X/V to copy/cut/paste</li>
        <li>• Cmd/Ctrl + D to duplicate</li>
        <li>• Cmd/Ctrl + A to select all</li>
        <li>• Cmd/Ctrl + ]/[ to reorder layers</li>
        <li>• Delete/Backspace to delete</li>
        <li>• Arrow keys to move (Shift for 10px)</li>
        <li>• Drag empty space for marquee select</li>
      </ul>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Toolbar />

      <main className="relative flex-1 w-full min-h-0 overflow-hidden">
        <Canvas showGrid={true} gridSize={20} backgroundColor="#fafafa" />
        <TextPropertiesPanel />
        <ShapePropertiesPanel />
        <div className="absolute bottom-4 right-4 z-10">
          <Minimap width={200} height={150} />
        </div>
        <Instructions />
      </main>
    </div>
  )
}
