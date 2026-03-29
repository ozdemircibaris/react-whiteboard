---
sidebar_position: 2
---

# Getting Started

This guide walks you through installing the library, rendering your first whiteboard, and adding shapes programmatically. You should have a working React 18+ project before you begin.

## Installation

```bash
# npm
npm install @ozdemircibaris/react-whiteboard

# pnpm
pnpm add @ozdemircibaris/react-whiteboard

# yarn
yarn add @ozdemircibaris/react-whiteboard
```

The library has peer dependencies on `react` and `react-dom` (v18 or v19).

## Render Your First Board

The minimum setup requires two components: `WhiteboardProvider` (creates an isolated store) and `Canvas` (renders the drawing surface).

```tsx title="App.tsx"
import { WhiteboardProvider, Canvas } from '@ozdemircibaris/react-whiteboard'

export default function App() {
  return (
    <WhiteboardProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

That is all you need for an interactive whiteboard with built-in tools for selection, drawing, shapes, text, and more.

:::tip
The `Canvas` component expands to fill its parent container. Make sure the parent has explicit dimensions (e.g., `width` and `height`, or `flex: 1`).
:::

## Using the `Whiteboard` Wrapper

For a batteries-included experience, use the `Whiteboard` component which bundles the provider, canvas, toolbar, and minimap:

```tsx title="App.tsx"
import { Whiteboard } from '@ozdemircibaris/react-whiteboard'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Whiteboard />
    </div>
  )
}
```

## Add a Shape Programmatically

Access the store via the `useWhiteboardStore` hook and call `addShape`:

```tsx title="AddRectButton.tsx"
import { useWhiteboardStore } from '@ozdemircibaris/react-whiteboard'

export function AddRectButton() {
  const store = useWhiteboardStore()

  const handleClick = () => {
    store.addShape({
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: { color: '#3b82f6', opacity: 1 },
      stroke: { color: '#1e40af', width: 2, opacity: 1 },
      rotation: 0,
    })
  }

  return <button onClick={handleClick}>Add Rectangle</button>
}
```

Place this component inside the `WhiteboardProvider`:

```tsx title="App.tsx"
import { WhiteboardProvider, Canvas } from '@ozdemircibaris/react-whiteboard'
import { AddRectButton } from './AddRectButton'

export default function App() {
  return (
    <WhiteboardProvider>
      <AddRectButton />
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

## Switching Tools

Use the `useTools` hook to switch between built-in tools:

```tsx title="Toolbar.tsx"
import { useTools } from '@ozdemircibaris/react-whiteboard'

export function Toolbar() {
  const { activeTool, setTool } = useTools()

  return (
    <div>
      {(['select', 'rectangle', 'ellipse', 'draw', 'text'] as const).map(
        (tool) => (
          <button
            key={tool}
            onClick={() => setTool(tool)}
            style={{ fontWeight: activeTool === tool ? 'bold' : 'normal' }}
          >
            {tool}
          </button>
        )
      )}
    </div>
  )
}
```

## Theming

The library ships with light and dark themes. Pass a theme to the provider:

```tsx
import {
  WhiteboardProvider,
  Canvas,
  DARK_THEME,
} from '@ozdemircibaris/react-whiteboard'

export default function App() {
  return (
    <WhiteboardProvider theme={DARK_THEME}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

## Persistence

Save and restore whiteboard state with the built-in `LocalStorageAdapter`:

```tsx
import {
  WhiteboardProvider,
  Canvas,
  LocalStorageAdapter,
} from '@ozdemircibaris/react-whiteboard'

const persistence = new LocalStorageAdapter({ key: 'my-whiteboard' })

export default function App() {
  return (
    <WhiteboardProvider persistence={persistence}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

## Next Steps

- Explore the [API Reference](./api/overview) for all available components, hooks, and utilities.
- Learn how to [create custom shapes](./plugins/custom-shapes) with canvas draw, hit-test, and SVG export.
- Learn how to [create custom tools](./plugins/custom-tools) by implementing the `ITool` interface.
