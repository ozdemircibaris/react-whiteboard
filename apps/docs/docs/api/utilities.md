---
sidebar_position: 6
---

# Utilities

## Coordinate & Geometry

```ts
import {
  screenToCanvas,
  canvasToScreen,
  getVisibleBounds,
  boundsIntersect,
  expandBounds,
  getBoundsCenter,
  isPointInBounds,
  distance,
  angle,
  clamp,
  lerp,
  lerpPoint,
} from '@ozdemircibaris/react-whiteboard'
```

| Function | Description |
|----------|-------------|
| `screenToCanvas(point, viewport)` | Convert screen coordinates to canvas (world) coordinates |
| `canvasToScreen(point, viewport)` | Convert canvas coordinates to screen coordinates |
| `getVisibleBounds(viewport, width, height)` | Get the visible area in canvas coordinates |
| `boundsIntersect(a, b)` | Check if two bounding boxes overlap |
| `expandBounds(bounds, padding)` | Expand a bounding box by a padding amount |
| `getBoundsCenter(bounds)` | Get the center point of a bounding box |
| `isPointInBounds(point, bounds)` | Check if a point is inside a bounding box |
| `distance(a, b)` | Euclidean distance between two points |
| `angle(a, b)` | Angle in radians from point A to point B |
| `clamp(value, min, max)` | Clamp a number to a range |
| `lerp(a, b, t)` | Linear interpolation between two numbers |
| `lerpPoint(a, b, t)` | Linear interpolation between two points |

## Hit Testing

```ts
import {
  getShapeBounds,
  getShapeAtPoint,
  getShapesAtPoint,
  getShapesInBounds,
  getSelectionBounds,
} from '@ozdemircibaris/react-whiteboard'
```

| Function | Description |
|----------|-------------|
| `getShapeBounds(shape)` | Get the bounding box of a shape |
| `getShapeAtPoint(point, shapes)` | Get the topmost shape at a point |
| `getShapesAtPoint(point, shapes)` | Get all shapes at a point (top to bottom) |
| `getShapesInBounds(bounds, shapes)` | Get all shapes intersecting a bounding box |
| `getSelectionBounds(shapes)` | Get the bounding box enclosing multiple shapes |

## Snapping

```ts
import { snapToGrid, snapToShapes } from '@ozdemircibaris/react-whiteboard'
import type { SnapLine, SnapResult } from '@ozdemircibaris/react-whiteboard'
```

| Function | Description |
|----------|-------------|
| `snapToGrid(point, gridSize)` | Snap a point to the nearest grid intersection |
| `snapToShapes(bounds, otherShapes, threshold)` | Snap to alignment guides from nearby shapes |

## Serialization

```ts
import {
  serializeDocument,
  exportToJSON,
  parseDocument,
  documentToStoreData,
  downloadFile,
  pickAndReadFile,
} from '@ozdemircibaris/react-whiteboard'
import type { WhiteboardDocument } from '@ozdemircibaris/react-whiteboard'
```

| Function | Description |
|----------|-------------|
| `serializeDocument(store)` | Serialize the current store state to a `WhiteboardDocument` |
| `exportToJSON(store)` | Export store state as a JSON string |
| `parseDocument(json)` | Parse a JSON string into a `WhiteboardDocument` |
| `documentToStoreData(doc)` | Convert a document back to store-compatible data |
| `downloadFile(content, filename, type)` | Trigger a file download in the browser |
| `pickAndReadFile(accept)` | Open a file picker and read the selected file |

## Export (PNG / SVG)

```ts
import {
  exportToPng, downloadPng,
  exportToSvg, downloadSvg,
  clearImageCache,
} from '@ozdemircibaris/react-whiteboard'
import type { ExportPngOptions, ExportSvgOptions } from '@ozdemircibaris/react-whiteboard'
```

| Function | Description |
|----------|-------------|
| `exportToPng(shapes, options?)` | Render shapes to a PNG data URL |
| `downloadPng(shapes, filename?, options?)` | Export and download as PNG |
| `exportToSvg(shapes, options?)` | Render shapes to an SVG string |
| `downloadSvg(shapes, filename?, options?)` | Export and download as SVG |
| `clearImageCache()` | Clear the internal image element cache |

## Image Blob Store

```ts
import {
  storeBlobAsUrl,
  isBlobUrl,
  dataUrlToBlobUrl,
  blobUrlToDataUrl,
  clearBlobStore,
} from '@ozdemircibaris/react-whiteboard'
```

Efficient in-memory blob storage for image shape data. Converts between data URLs and blob URLs to reduce memory usage.

## Font Utilities

```ts
import {
  FONT_FAMILIES,
  FONT_SIZE_PRESETS,
  DEFAULT_TEXT_PROPS,
  DEFAULT_TEXT_MAX_WIDTH,
  resolveFont,
  loadFonts,
  measureTextLines,
  wrapTextLines,
} from '@ozdemircibaris/react-whiteboard'
import type { FontSizePreset } from '@ozdemircibaris/react-whiteboard'
```

| Function / Constant | Description |
|---------------------|-------------|
| `FONT_FAMILIES` | Array of supported font family names |
| `FONT_SIZE_PRESETS` | Preset font sizes (small, medium, large, etc.) |
| `resolveFont(family, size)` | Build a CSS font string |
| `loadFonts()` | Preload all supported web fonts |
| `measureTextLines(text, font, maxWidth)` | Measure rendered text dimensions |
| `wrapTextLines(text, font, maxWidth)` | Word-wrap text into lines |

## Shape Bounds

```ts
import { getShapesBounds } from '@ozdemircibaris/react-whiteboard'
import type { ShapesBounds } from '@ozdemircibaris/react-whiteboard'
```

| Function | Description |
|----------|-------------|
| `getShapesBounds(shapes)` | Calculate combined bounds for an array of shapes |
