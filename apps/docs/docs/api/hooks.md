---
sidebar_position: 3
---

# Hooks

All hooks must be called inside a `WhiteboardProvider`.

## useWhiteboardStore

Returns the Zustand-backed `WhiteboardStore` instance. This is the primary way to read and mutate whiteboard state.

```ts
import { useWhiteboardStore } from '@ozdemircibaris/react-whiteboard'

const store = useWhiteboardStore()
store.addShape({ type: 'rectangle', x: 0, y: 0, width: 100, height: 100, ... })
```

See [Store](./store) for the full `WhiteboardStore` API.

---

## useToolManager

Returns the `ToolManager` instance for the current whiteboard. Useful for registering custom tools at runtime or accessing tool state.

```ts
import { useToolManager } from '@ozdemircibaris/react-whiteboard'

const toolManager = useToolManager()
toolManager.registerTool(myCustomTool)
```

---

## useShapeRendererRegistry

Returns the `ShapeRendererRegistry` instance for the current whiteboard. Use this to register custom shape renderers.

```ts
import { useShapeRendererRegistry } from '@ozdemircibaris/react-whiteboard'

const registry = useShapeRendererRegistry()
registry.registerRenderer({
  type: 'diamond',
  draw: (context) => { /* ... */ },
})
```

---

## useTools

Provides the active tool type and a function to switch tools.

```ts
import { useTools } from '@ozdemircibaris/react-whiteboard'

const { activeTool, setTool } = useTools()
setTool('rectangle')
```

---

## useTextProperties

Access and modify text properties (font family, size, alignment, etc.) for the current selection or defaults.

```ts
import { useTextProperties } from '@ozdemircibaris/react-whiteboard'

const { fontFamily, fontSize, setFontFamily, setFontSize } = useTextProperties()
```

---

## useShapeProperties

Access and modify shape properties (fill, stroke, opacity) for the current selection or defaults.

```ts
import { useShapeProperties } from '@ozdemircibaris/react-whiteboard'

const { fill, stroke, setFill, setStroke } = useShapeProperties()
```

---

## useWhiteboardEvents

Subscribe to whiteboard events (shape added, removed, selection changed, etc.).

```ts
import { useWhiteboardEvents } from '@ozdemircibaris/react-whiteboard'
import type { WhiteboardEventCallbacks } from '@ozdemircibaris/react-whiteboard'

const callbacks: WhiteboardEventCallbacks = {
  onShapeAdded: (shape) => console.log('Added:', shape.id),
}
useWhiteboardEvents(callbacks)
```

---

## useDualCanvasSetup

Low-level hook that initializes the dual-canvas rendering pipeline. Used internally by `Canvas`. Only use this if you are building a completely custom canvas component.

---

## useKeyboardShortcuts

Enables built-in keyboard shortcuts (Delete, Ctrl+Z, Ctrl+C, etc.) for the whiteboard.

---

## useTouchGestures

Enables multi-touch gesture handling (pinch-to-zoom, two-finger pan) on the canvas.
