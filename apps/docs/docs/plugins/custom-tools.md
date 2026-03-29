---
sidebar_position: 2
---

# Custom Tool Plugin Tutorial

This tutorial walks you through creating a **stamp tool** that places a predefined shape on every click. You will implement the `ITool` interface and register the tool with `ToolManager`.

## Overview

The tool system has three parts:

1. **`ITool`** -- the interface every tool must implement (pointer handlers, cursor, overlay).
2. **`ToolManager`** -- per-whiteboard manager that routes pointer events to the active tool.
3. **`useToolManager`** -- hook to access the `ToolManager` from React.

## Step 1: Implement the ITool Interface

A tool handles pointer down, move, and up events. It receives a `ToolEventContext` (screen/canvas coordinates, modifiers) and the `WhiteboardStore`.

```ts title="StampTool.ts"
import type {
  ITool,
  ToolEventContext,
  ToolState,
  WhiteboardStore,
  ToolType,
} from '@ozdemircibaris/react-whiteboard'

export class StampTool implements ITool {
  /** Unique tool identifier -- extend ToolType via declaration merging or use a cast */
  readonly type = 'stamp' as ToolType
  readonly cursor = 'copy'
  readonly name = 'Stamp'

  private stampSize = 60
  private stampColor = '#ef4444'

  onActivate(store: WhiteboardStore): void {
    // Called when this tool becomes active
    // Good place to show a toast or change UI state
  }

  onDeactivate(store: WhiteboardStore): void {
    // Called when switching away from this tool
  }

  onPointerDown(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ) {
    // Place a stamp at the click location
    const halfSize = this.stampSize / 2

    store.addShape({
      type: 'ellipse',
      x: ctx.canvasPoint.x - halfSize,
      y: ctx.canvasPoint.y - halfSize,
      width: this.stampSize,
      height: this.stampSize,
      fill: { color: this.stampColor, opacity: 0.8 },
      stroke: { color: '#b91c1c', width: 2, opacity: 1 },
      rotation: 0,
    })

    return { handled: true }
  }

  onPointerMove(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ) {
    // No drag behavior for stamp tool
    return { handled: false }
  }

  onPointerUp(
    ctx: ToolEventContext,
    store: WhiteboardStore,
    state: ToolState
  ) {
    return { handled: false }
  }
}
```

### Key Points

- **`type`** must be a unique string. If TypeScript complains about the literal, cast it as `ToolType`.
- **`cursor`** is a standard CSS cursor value shown when this tool is active.
- **`onPointerDown`** is the main entry point. Return `{ handled: true }` to consume the event.
- **`renderOverlay?`** (optional) lets you draw a preview on the interactive canvas (e.g., crosshair, ghost shape).

## Step 2: Add a Preview Overlay (Optional)

Show a ghost stamp at the cursor position while the tool is active:

```ts title="StampTool.ts (renderOverlay addition)"
import type { Viewport } from '@ozdemircibaris/react-whiteboard'

// Add to StampTool class:

private lastCanvasPoint = { x: 0, y: 0 }

onPointerMove(
  ctx: ToolEventContext,
  store: WhiteboardStore,
  state: ToolState
) {
  this.lastCanvasPoint = ctx.canvasPoint
  return { handled: true, cursor: 'copy' }
}

renderOverlay(
  ctx: CanvasRenderingContext2D,
  state: ToolState,
  viewport: Viewport
): void {
  const halfSize = this.stampSize / 2
  const screenX = (this.lastCanvasPoint.x + viewport.x) * viewport.zoom
  const screenY = (this.lastCanvasPoint.y + viewport.y) * viewport.zoom
  const r = (halfSize * viewport.zoom)

  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = this.stampColor
  ctx.beginPath()
  ctx.ellipse(screenX, screenY, r, r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
```

## Step 3: Register the Tool

### Option A: Via WhiteboardProvider props

Pass custom tools when creating the provider:

```tsx title="App.tsx"
import { WhiteboardProvider, Canvas } from '@ozdemircibaris/react-whiteboard'
import { StampTool } from './StampTool'

const customTools = [new StampTool()]

export default function App() {
  return (
    <WhiteboardProvider tools={customTools}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

### Option B: Via useToolManager hook

Register dynamically after mount:

```tsx title="StampPlugin.tsx"
import { useEffect } from 'react'
import { useToolManager } from '@ozdemircibaris/react-whiteboard'
import { StampTool } from './StampTool'

export function StampPlugin() {
  const toolManager = useToolManager()

  useEffect(() => {
    const tool = new StampTool()
    toolManager.registerTool(tool)
    return () => toolManager.unregisterTool(tool.type)
  }, [toolManager])

  return null
}
```

## Step 4: Activate the Tool

Switch to the custom tool using `useTools` or `ToolManager.setActiveTool`:

```tsx title="Toolbar.tsx"
import { useTools } from '@ozdemircibaris/react-whiteboard'
import type { ToolType } from '@ozdemircibaris/react-whiteboard'

export function StampButton() {
  const { activeTool, setTool } = useTools()

  return (
    <button
      onClick={() => setTool('stamp' as ToolType)}
      style={{ fontWeight: activeTool === 'stamp' ? 'bold' : 'normal' }}
    >
      Stamp
    </button>
  )
}
```

## Complete Example

```tsx title="App.tsx"
import { useEffect } from 'react'
import {
  WhiteboardProvider,
  Canvas,
  useToolManager,
  useTools,
} from '@ozdemircibaris/react-whiteboard'
import type { ToolType } from '@ozdemircibaris/react-whiteboard'
import { StampTool } from './StampTool'

function StampPlugin() {
  const toolManager = useToolManager()

  useEffect(() => {
    const tool = new StampTool()
    toolManager.registerTool(tool)
    return () => toolManager.unregisterTool(tool.type)
  }, [toolManager])

  return null
}

function Toolbar() {
  const { activeTool, setTool } = useTools()
  const tools: Array<{ id: string; label: string }> = [
    { id: 'select', label: 'Select' },
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'draw', label: 'Draw' },
    { id: 'stamp', label: 'Stamp' },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, padding: 8 }}>
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id as ToolType)}
          style={{ fontWeight: activeTool === t.id ? 'bold' : 'normal' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <WhiteboardProvider>
      <StampPlugin />
      <Toolbar />
      <div style={{ width: '100vw', height: 'calc(100vh - 48px)' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

## ITool Interface Reference

| Method | Required | Description |
|--------|----------|-------------|
| `type` | Yes | Unique tool identifier |
| `cursor` | Yes | CSS cursor string |
| `name` | Yes | Display name for UI |
| `onActivate(store)` | No | Called when tool becomes active |
| `onDeactivate(store)` | No | Called when tool becomes inactive |
| `onPointerDown(ctx, store, state)` | Yes | Handle pointer down; return `{ handled }` |
| `onPointerMove(ctx, store, state)` | Yes | Handle pointer move; return `{ handled, cursor? }` |
| `onPointerUp(ctx, store, state)` | Yes | Handle pointer up; return `{ handled }` |
| `onDoubleClick(ctx, store)` | No | Handle double click |
| `onKeyDown(event, store)` | No | Handle keyboard; return `true` if consumed |
| `renderOverlay(ctx, state, viewport)` | No | Draw tool preview on interactive canvas |

## ToolManager API

| Method | Description |
|--------|-------------|
| `registerTool(tool)` | Register a tool instance |
| `unregisterTool(type)` | Remove a tool by type |
| `getTool(type)` | Get a tool instance |
| `getAllTools()` | Get all registered tools |
| `setActiveTool(type)` | Switch to a tool |
| `getActiveTool()` | Get the currently active tool |
