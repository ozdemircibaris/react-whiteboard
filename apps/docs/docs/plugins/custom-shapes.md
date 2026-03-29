---
sidebar_position: 1
---

# Custom Shape Plugin Tutorial

This tutorial walks you through creating a **diamond** shape renderer that integrates with the whiteboard's canvas rendering, hit-testing, and SVG export pipelines.

## Overview

The custom shape system has three parts:

1. **`CustomShapeRenderer`** -- a registration object with `draw`, optional `hitTest`, and optional `svgRender` functions.
2. **`ShapeRendererRegistry`** -- a per-whiteboard registry where renderers are stored.
3. **`useShapeRendererRegistry`** -- a hook to access the registry from React components.

## Step 1: Define the Shape Data

Custom shapes use the base `Shape` type with a custom `type` string. The whiteboard stores them like any other shape -- you control how they render.

```ts title="diamondRenderer.ts"
import type {
  CustomShapeRenderer,
  CustomShapeDrawContext,
  CustomShapeSvgContext,
} from '@ozdemircibaris/react-whiteboard'
```

## Step 2: Implement the Canvas Draw Function

The `draw` function receives a `CustomShapeDrawContext` with the 2D canvas context, RoughJS instance, shape data, selection state, and a helper to draw selection handles.

```ts title="diamondRenderer.ts"
function drawDiamond(context: CustomShapeDrawContext): void {
  const { ctx, shape, isSelected, drawSelection } = context
  const { x, y, width, height, fill, stroke, rotation } = shape

  const cx = x + width / 2
  const cy = y + height / 2

  ctx.save()

  // Apply rotation around center
  if (rotation) {
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }

  // Draw diamond path
  ctx.beginPath()
  ctx.moveTo(cx, y)           // top
  ctx.lineTo(x + width, cy)   // right
  ctx.lineTo(cx, y + height)  // bottom
  ctx.lineTo(x, cy)           // left
  ctx.closePath()

  // Fill
  if (fill) {
    ctx.fillStyle = fill.color
    ctx.globalAlpha = fill.opacity
    ctx.fill()
  }

  // Stroke
  if (stroke) {
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.globalAlpha = stroke.opacity
    ctx.stroke()
  }

  ctx.restore()

  // Draw selection handles when selected
  if (isSelected) {
    drawSelection(x, y, width, height)
  }
}
```

## Step 3: Implement Hit Testing (Optional)

If omitted, the registry falls back to a bounding-box rectangle test. For a diamond, we can be more precise:

```ts title="diamondRenderer.ts"
import type { Point, Shape } from '@ozdemircibaris/react-whiteboard'

function hitTestDiamond(point: Point, shape: Shape, tolerance: number): boolean {
  const { x, y, width, height } = shape
  const cx = x + width / 2
  const cy = y + height / 2

  // Diamond hit test: check if point is inside the rhombus
  // using the sum-of-distances formula:
  // |px - cx| / (width/2) + |py - cy| / (height/2) <= 1
  const dx = Math.abs(point.x - cx) / (width / 2 + tolerance)
  const dy = Math.abs(point.y - cy) / (height / 2 + tolerance)

  return dx + dy <= 1
}
```

## Step 4: Implement SVG Export (Optional)

If omitted, the shape is skipped during SVG export. Return an `SVGGElement` to include it:

```ts title="diamondRenderer.ts"
function svgRenderDiamond(context: CustomShapeSvgContext): SVGGElement | null {
  const { shape } = context
  const { x, y, width, height, fill, stroke } = shape

  const cx = x + width / 2
  const cy = y + height / 2

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')

  polygon.setAttribute('points', [
    `${cx},${y}`,
    `${x + width},${cy}`,
    `${cx},${y + height}`,
    `${x},${cy}`,
  ].join(' '))

  if (fill) {
    polygon.setAttribute('fill', fill.color)
    polygon.setAttribute('fill-opacity', String(fill.opacity))
  }
  if (stroke) {
    polygon.setAttribute('stroke', stroke.color)
    polygon.setAttribute('stroke-width', String(stroke.width))
    polygon.setAttribute('stroke-opacity', String(stroke.opacity))
  }

  if (shape.rotation) {
    g.setAttribute('transform', `rotate(${(shape.rotation * 180) / Math.PI} ${cx} ${cy})`)
  }

  g.appendChild(polygon)
  return g
}
```

## Step 5: Create the Renderer Object

Combine all three functions into a `CustomShapeRenderer`:

```ts title="diamondRenderer.ts"
export const diamondRenderer: CustomShapeRenderer = {
  type: 'diamond',
  draw: drawDiamond,
  hitTest: hitTestDiamond,
  svgRender: svgRenderDiamond,
}
```

## Step 6: Register with the Whiteboard

Use the `useShapeRendererRegistry` hook to register your renderer when the component mounts:

```tsx title="App.tsx"
import { useEffect } from 'react'
import {
  WhiteboardProvider,
  Canvas,
  useWhiteboardStore,
  useShapeRendererRegistry,
} from '@ozdemircibaris/react-whiteboard'
import { diamondRenderer } from './diamondRenderer'

function DiamondPlugin() {
  const registry = useShapeRendererRegistry()

  useEffect(() => {
    registry.registerRenderer(diamondRenderer)
    return () => registry.unregisterRenderer('diamond')
  }, [registry])

  return null
}

function AddDiamondButton() {
  const store = useWhiteboardStore()

  return (
    <button
      onClick={() =>
        store.addShape({
          type: 'diamond' as any,
          x: 150,
          y: 150,
          width: 200,
          height: 160,
          fill: { color: '#f59e0b', opacity: 1 },
          stroke: { color: '#d97706', width: 2, opacity: 1 },
          rotation: 0,
        })
      }
    >
      Add Diamond
    </button>
  )
}

export default function App() {
  return (
    <WhiteboardProvider>
      <DiamondPlugin />
      <AddDiamondButton />
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas />
      </div>
    </WhiteboardProvider>
  )
}
```

## Complete Source

Here is the full `diamondRenderer.ts` file:

```ts title="diamondRenderer.ts"
import type {
  CustomShapeRenderer,
  CustomShapeDrawContext,
  CustomShapeSvgContext,
  Point,
  Shape,
} from '@ozdemircibaris/react-whiteboard'

function drawDiamond(context: CustomShapeDrawContext): void {
  const { ctx, shape, isSelected, drawSelection } = context
  const { x, y, width, height, fill, stroke, rotation } = shape

  const cx = x + width / 2
  const cy = y + height / 2

  ctx.save()
  if (rotation) {
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }

  ctx.beginPath()
  ctx.moveTo(cx, y)
  ctx.lineTo(x + width, cy)
  ctx.lineTo(cx, y + height)
  ctx.lineTo(x, cy)
  ctx.closePath()

  if (fill) {
    ctx.fillStyle = fill.color
    ctx.globalAlpha = fill.opacity
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.globalAlpha = stroke.opacity
    ctx.stroke()
  }

  ctx.restore()

  if (isSelected) {
    drawSelection(x, y, width, height)
  }
}

function hitTestDiamond(point: Point, shape: Shape, tolerance: number): boolean {
  const { x, y, width, height } = shape
  const cx = x + width / 2
  const cy = y + height / 2
  const dx = Math.abs(point.x - cx) / (width / 2 + tolerance)
  const dy = Math.abs(point.y - cy) / (height / 2 + tolerance)
  return dx + dy <= 1
}

function svgRenderDiamond(context: CustomShapeSvgContext): SVGGElement | null {
  const { shape } = context
  const { x, y, width, height, fill, stroke } = shape
  const cx = x + width / 2
  const cy = y + height / 2

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  polygon.setAttribute('points', `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`)

  if (fill) {
    polygon.setAttribute('fill', fill.color)
    polygon.setAttribute('fill-opacity', String(fill.opacity))
  }
  if (stroke) {
    polygon.setAttribute('stroke', stroke.color)
    polygon.setAttribute('stroke-width', String(stroke.width))
    polygon.setAttribute('stroke-opacity', String(stroke.opacity))
  }
  if (shape.rotation) {
    g.setAttribute('transform', `rotate(${(shape.rotation * 180) / Math.PI} ${cx} ${cy})`)
  }

  g.appendChild(polygon)
  return g
}

export const diamondRenderer: CustomShapeRenderer = {
  type: 'diamond',
  draw: drawDiamond,
  hitTest: hitTestDiamond,
  svgRender: svgRenderDiamond,
}
```

## Summary

| Concept | API |
|---------|-----|
| Define renderer | `CustomShapeRenderer` with `type`, `draw`, `hitTest?`, `svgRender?` |
| Register | `registry.registerRenderer(renderer)` via `useShapeRendererRegistry()` |
| Unregister | `registry.unregisterRenderer(type)` |
| Add custom shape | `store.addShape({ type: 'your-type', ... })` |
