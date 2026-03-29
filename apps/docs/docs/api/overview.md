---
sidebar_position: 1
---

# API Overview

All public exports are available from the main package entry point:

```ts
import { ... } from '@ozdemircibaris/react-whiteboard'
```

Exports are organized into the following categories:

| Category | Description |
|----------|-------------|
| [Components](./components) | `Canvas`, `Minimap`, `Whiteboard`, `WhiteboardProvider`, `WhiteboardErrorBoundary` |
| [Hooks](./hooks) | `useWhiteboardStore`, `useToolManager`, `useShapeRendererRegistry`, `useTools`, `useTextProperties`, `useShapeProperties`, `useWhiteboardEvents`, and more |
| [Store](./store) | `WhiteboardStore`, `createWhiteboardStore`, `WhiteboardState` |
| [Types](./types) | `Shape`, `Point`, `Viewport`, `ToolType`, `ITool`, `CustomShapeRenderer`, and all geometry/config types |
| [Utilities](./utilities) | Coordinate math, hit testing, snapping, serialization, export (PNG/SVG), font helpers |

## Stability Guarantees

Exports marked `@public` in JSDoc are covered by semver guarantees. Exports marked `@internal` (such as `createWhiteboardStore` and `CanvasRenderer`) are escape hatches for advanced use cases and may change in minor releases.
