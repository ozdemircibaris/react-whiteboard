---
sidebar_position: 5
---

# Types

All types are exported from the main package entry point.

## Geometry

| Type | Description |
|------|-------------|
| `Point` | `{ x: number; y: number }` |
| `Size` | `{ width: number; height: number }` |
| `Bounds` | `{ x: number; y: number; width: number; height: number }` |
| `Transform` | Position, size, and rotation combined |
| `Viewport` | `{ x: number; y: number; zoom: number }` |
| `ViewportBounds` | Visible area in canvas coordinates |

## Shapes

All shapes extend `BaseShape` which provides common fields (`id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `fill`, `stroke`).

| Type | Description |
|------|-------------|
| `Shape` | Discriminated union of all shape types |
| `RectangleShape` | Rectangle with optional corner radius |
| `EllipseShape` | Ellipse/circle |
| `LineShape` | Straight line with two endpoints |
| `ArrowShape` | Line with arrowhead(s) |
| `TextShape` | Text with font, size, alignment settings |
| `PathShape` | Freehand path (array of `PathPoint`) |
| `ImageShape` | Raster image with src URL |
| `GroupShape` | Group of child shape IDs |
| `ReactComponentShape` | Embedded React component |

### Style Types

| Type | Description |
|------|-------------|
| `FillStyle` | `{ color: string; opacity: number }` |
| `StrokeStyle` | `{ color: string; width: number; opacity: number }` |
| `ShapeType` | String literal union of all built-in shape types |

## Tools

| Type | Description |
|------|-------------|
| `ToolType` | String literal union of all tool identifiers |
| `ITool` | Interface that all tools must implement |
| `ToolEventContext` | Pointer event context passed to tool handlers |
| `ToolState` | Drag state tracked during tool interactions |
| `ToolConfig` | Configuration for tool registration |
| `ToolProvider` | Minimal interface for cross-tool access |

## Custom Shape Rendering

| Type | Description |
|------|-------------|
| `CustomShapeRenderer` | Registration object with `type`, `draw`, optional `hitTest` and `svgRender` |
| `CustomShapeDrawContext` | Canvas context, shape data, selection state, and helper functions |
| `CustomShapeSvgContext` | SVG context for export |

## Events

| Type | Description |
|------|-------------|
| `WhiteboardEvent` | Union of all whiteboard events |
| `PointerState` | Current pointer position and button state |
| `WhiteboardEventCallbacks` | Callback map for `useWhiteboardEvents` |

## Configuration

| Type | Description |
|------|-------------|
| `WhiteboardConfig` | Grid size, snap settings, and feature flags |
| `ThemeColors` | Full theme color palette |
| `Selection` | Current selection state |

## Persistence

| Type | Description |
|------|-------------|
| `PersistenceAdapter` | Interface for save/restore adapters |
| `LocalStorageAdapterOptions` | Options for `LocalStorageAdapter` |
| `WhiteboardDocument` | Serialized document format |
