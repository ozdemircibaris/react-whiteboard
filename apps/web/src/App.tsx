'use client'

import { Canvas, useWhiteboardStore } from '@ozdemircibaris/react-whiteboard'
import type { RectangleShape, EllipseShape } from '@ozdemircibaris/react-whiteboard'
import { nanoid } from 'nanoid'

function Toolbar() {
  const addShape = useWhiteboardStore((s) => s.addShape)
  const clearShapes = useWhiteboardStore((s) => s.clearShapes)
  const viewport = useWhiteboardStore((s) => s.viewport)
  const resetViewport = useWhiteboardStore((s) => s.resetViewport)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const canUndo = useWhiteboardStore((s) => s.canUndo)
  const canRedo = useWhiteboardStore((s) => s.canRedo)

  const addRectangle = () => {
    const shape: RectangleShape = {
      id: nanoid(),
      type: 'rectangle',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 150,
      height: 100,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      props: {
        fill: '#4f46e5',
        stroke: '#3730a3',
        strokeWidth: 2,
        cornerRadius: 8,
      },
    }
    addShape(shape)
  }

  const addEllipse = () => {
    const shape: EllipseShape = {
      id: nanoid(),
      type: 'ellipse',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      parentId: null,
      props: {
        fill: '#10b981',
        stroke: '#059669',
        strokeWidth: 2,
      },
    }
    addShape(shape)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Whiteboard</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => undo()}
          disabled={!canUndo()}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo()}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Redo
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={addRectangle}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Rectangle
        </button>
        <button
          onClick={addEllipse}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add Ellipse
        </button>
        <button
          onClick={() => clearShapes()}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          Zoom: {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={resetViewport}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Reset View
        </button>
      </div>
    </header>
  )
}

function Instructions() {
  return (
    <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 text-sm text-gray-600 shadow-lg backdrop-blur">
      <p className="font-medium text-gray-800">Controls:</p>
      <ul className="mt-1 space-y-0.5">
        <li>• Scroll to zoom</li>
        <li>• Alt + drag to pan</li>
        <li>• Middle mouse to pan</li>
        <li>• Cmd/Ctrl + Z to undo</li>
        <li>• Cmd/Ctrl + Shift + Z to redo</li>
        <li>• Cmd/Ctrl + A to select all</li>
        <li>• Delete/Backspace to delete</li>
        <li>• Escape to deselect</li>
        <li>• Arrow keys to move (Shift for 10px)</li>
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
        <Instructions />
      </main>
    </div>
  )
}
