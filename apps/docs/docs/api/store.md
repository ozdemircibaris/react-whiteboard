---
sidebar_position: 4
---

# Store

The whiteboard state is managed by a Zustand store created internally by `WhiteboardProvider`. Access it via `useWhiteboardStore()`.

## WhiteboardStore

The `WhiteboardStore` type exposes both state and actions.

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `shapes` | `Map<string, Shape>` | All shapes in the document |
| `selectedIds` | `Set<string>` | IDs of currently selected shapes |
| `viewport` | `Viewport` | Current pan/zoom state (`x`, `y`, `zoom`) |
| `activeTool` | `ToolType` | Currently active tool identifier |
| `config` | `WhiteboardConfig` | Grid, snap, and other configuration |

### Shape Actions

| Method | Signature | Description |
|--------|-----------|-------------|
| `addShape` | `(props: Partial<Shape> & { type: string }) => Shape` | Add a new shape and return it |
| `updateShape` | `(id: string, updates: Partial<Shape>) => void` | Update shape properties |
| `deleteShape` | `(id: string) => void` | Delete a shape by ID |
| `deleteShapes` | `(ids: string[]) => void` | Delete multiple shapes |

### Selection Actions

| Method | Signature | Description |
|--------|-----------|-------------|
| `select` | `(ids: string[]) => void` | Set selection to given IDs |
| `addToSelection` | `(ids: string[]) => void` | Add IDs to current selection |
| `clearSelection` | `() => void` | Deselect all shapes |

### Viewport Actions

| Method | Signature | Description |
|--------|-----------|-------------|
| `setViewport` | `(viewport: Partial<Viewport>) => void` | Update viewport state |
| `zoomIn` | `() => void` | Zoom in by one step |
| `zoomOut` | `() => void` | Zoom out by one step |
| `zoomToFit` | `() => void` | Fit all shapes in view |
| `resetZoom` | `() => void` | Reset to 100% zoom |

### History Actions

| Method | Signature | Description |
|--------|-----------|-------------|
| `undo` | `() => void` | Undo the last action |
| `redo` | `() => void` | Redo the last undone action |
| `canUndo` | `() => boolean` | Whether undo is available |
| `canRedo` | `() => boolean` | Whether redo is available |

### Tool Actions

| Method | Signature | Description |
|--------|-----------|-------------|
| `setTool` | `(tool: ToolType) => void` | Switch the active tool |

## Zoom Constants

```ts
import { MIN_ZOOM, MAX_ZOOM } from '@ozdemircibaris/react-whiteboard'

// MIN_ZOOM = 0.1  (10%)
// MAX_ZOOM = 10   (1000%)
```

## createWhiteboardStore (Internal)

:::caution
`createWhiteboardStore` is marked `@internal`. It is exported for advanced use cases (e.g., server-side pre-rendering or testing) but is **not** covered by semver stability guarantees.
:::

```ts
import { createWhiteboardStore } from '@ozdemircibaris/react-whiteboard'

const store = createWhiteboardStore({ /* initial state */ })
```
