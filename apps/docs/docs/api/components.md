---
sidebar_position: 2
---

# Components

## WhiteboardProvider

Creates an isolated whiteboard store and provides it to all descendant components via React context.

```tsx
import { WhiteboardProvider } from '@ozdemircibaris/react-whiteboard'
import type { WhiteboardProviderProps } from '@ozdemircibaris/react-whiteboard'
```

### Props (`WhiteboardProviderProps`)

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Child components that will access the whiteboard store |
| `config?` | `WhiteboardConfig` | Initial configuration (grid size, snap settings, etc.) |
| `theme?` | `ThemeColors` | Theme colors. Defaults to `LIGHT_THEME` |
| `persistence?` | `PersistenceAdapter` | Adapter for save/restore (e.g., `LocalStorageAdapter`) |
| `tools?` | `ITool[]` | Additional custom tools to register |

---

## Canvas

Renders the whiteboard drawing surface. Must be placed inside a `WhiteboardProvider`. Expands to fill its parent container.

```tsx
import { Canvas } from '@ozdemircibaris/react-whiteboard'
import type { CanvasProps } from '@ozdemircibaris/react-whiteboard'
```

### Props (`CanvasProps`)

| Prop | Type | Description |
|------|------|-------------|
| `className?` | `string` | CSS class for the outer container |
| `onContextMenu?` | `(event: CanvasContextMenuEvent) => void` | Context menu handler with canvas coordinates |

---

## Minimap

Renders a miniature overview of the entire whiteboard with a viewport indicator. Place inside `WhiteboardProvider`.

```tsx
import { Minimap } from '@ozdemircibaris/react-whiteboard'
import type { MinimapProps } from '@ozdemircibaris/react-whiteboard'
```

### Props (`MinimapProps`)

| Prop | Type | Description |
|------|------|-------------|
| `width?` | `number` | Minimap width in pixels (default: 200) |
| `height?` | `number` | Minimap height in pixels (default: 150) |
| `className?` | `string` | CSS class for the minimap container |

---

## Whiteboard

Batteries-included wrapper that bundles `WhiteboardProvider`, `Canvas`, built-in toolbar, and `Minimap`.

```tsx
import { Whiteboard } from '@ozdemircibaris/react-whiteboard'
import type { WhiteboardProps } from '@ozdemircibaris/react-whiteboard'
```

---

## WhiteboardErrorBoundary

Error boundary that catches rendering errors inside the whiteboard and displays a fallback UI.

```tsx
import { WhiteboardErrorBoundary } from '@ozdemircibaris/react-whiteboard'
import type { WhiteboardErrorBoundaryProps } from '@ozdemircibaris/react-whiteboard'
```

### Props (`WhiteboardErrorBoundaryProps`)

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Components to wrap |
| `fallback?` | `ReactNode` | Custom fallback UI on error |
