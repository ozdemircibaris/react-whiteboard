---
sidebar_position: 1
slug: /
---

# Introduction

**@ozdemircibaris/react-whiteboard** is a high-performance whiteboard library for React with Canvas rendering and React component support.

## Features

- **Dual-canvas architecture** -- a static layer for shapes at rest and an interactive layer for real-time drag/resize/rotate operations.
- **Built-in shapes** -- rectangles, ellipses, lines, arrows, freehand paths, text, images, groups, and React component shapes.
- **Custom shape plugins** -- register your own shape renderers with canvas draw, hit-test, and SVG export functions.
- **Custom tool plugins** -- implement the `ITool` interface to create new pointer-driven interactions.
- **Persistence** -- `LocalStorageAdapter` or bring your own `PersistenceAdapter`.
- **Export** -- PNG and SVG export utilities out of the box.
- **Theming** -- light and dark themes, fully customizable via `ThemeColors`.
- **Touch & pen support** -- multi-touch gestures, pressure-sensitive drawing.
- **Keyboard shortcuts** -- built-in shortcuts for all common operations.

## Quick Links

- [Getting Started](./getting-started) -- install, render your first board, add a shape programmatically.
- [API Reference](./api/overview) -- full reference for all public exports.
- [Custom Shape Plugin](./plugins/custom-shapes) -- walk-through for authoring a custom shape renderer.
- [Custom Tool Plugin](./plugins/custom-tools) -- walk-through for authoring a custom tool.
