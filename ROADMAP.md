# react-whiteboard — Vision & Roadmap

## Vision

An open-source, high-quality whiteboard library for React that competes with Excalidraw and tldraw on polish and features, while being designed from the ground up as a **composable library** — not just an app.

### What makes this different

| | Excalidraw | tldraw | react-whiteboard |
|---|---|---|---|
| **Form factor** | App (with library wrapper) | Editor SDK | Library-first |
| **Rendering** | Canvas 2D + RoughJS | Canvas 2D + custom | Canvas 2D + RoughJS + perfect-freehand |
| **State** | Custom Redux-like | Custom signals | Zustand (standard React) |
| **Collaboration** | Socket + custom sync | Y.js built-in | Y.js (pluggable) |
| **Extensibility** | Fork the app | Plugin SDK | Composable hooks + tool interface |
| **License** | MIT | Custom (tldraw license) | MIT |

### Core principles

1. **Library-first**: `<Whiteboard />` is a React component you drop into your app, not a standalone application you wrap
2. **Hand-drawn identity**: RoughJS sketchy aesthetic + perfect-freehand pressure-sensitive strokes give it the warm, approachable feel that defines modern whiteboards
3. **Composable architecture**: Tools, renderers, and state are all swappable. Bring your own tool, bring your own renderer, bring your own persistence
4. **Performance without compromise**: Single-canvas rendering, viewport culling, RAF-driven render loop, minimal re-renders through Zustand selectors
5. **Open source, high quality**: MIT license, production-grade code, comprehensive types, clean API surface

---

## Tech Stack

- **Rendering**: HTML5 Canvas 2D + RoughJS (hand-drawn shapes) + perfect-freehand (pressure-sensitive strokes)
- **State**: Zustand with `subscribeWithSelector`
- **Collaboration**: Y.js + WebSocket (planned)
- **Framework**: React 19 + TypeScript
- **Build**: tsup (library), Vite (demo app)
- **Structure**: Monorepo — pnpm workspaces + Turborepo
- **Packages**: `@ozdemircibaris/react-whiteboard` (library) + `@whiteboard/web` (demo)

---

## Completed

### Phase 1: Project Setup
- [x] Monorepo with pnpm workspaces + Turborepo
- [x] `packages/react-whiteboard` — library with tsup build (CJS + ESM + DTS)
- [x] `apps/web` — Vite + React 19 demo app
- [x] Shared TypeScript config, ESLint, Prettier

### Phase 2: Core Canvas Engine
- [x] Canvas component with requestAnimationFrame render loop
- [x] Viewport state (pan, zoom, bounds) in Zustand
- [x] Camera transforms + DPI/retina handling
- [x] Screen <-> canvas coordinate conversion
- [x] Grid rendering

### Phase 3: Event System
- [x] Pointer events (down, move, up) with pointer capture
- [x] Mouse wheel zoom (passive: false)
- [x] Pan: Alt+drag, middle mouse button
- [x] Touch: pinch zoom, two-finger pan
- [x] Keyboard shortcuts: Cmd+Z, Cmd+Shift+Z, Delete, Escape, Cmd+A, arrow keys

### Phase 4: Shape System
- [x] BaseShape interface with id, bounds, rotation, opacity, locking, seed, roughness
- [x] Shape types: Rectangle, Ellipse, Path, Line, Arrow, Text, ReactComponent
- [x] Z-index ordering via shapeIds array
- [x] Hit testing (point-in-shape, proximity-based for lines)

### Phase 5: Selection & Interaction
- [x] Single selection (click)
- [x] Multi-selection (shift+click)
- [x] Drag to move shapes
- [x] 8-point resize handles
- [x] Selection bounds rendering

### Phase 6: Tools System
- [x] ITool interface with lifecycle (activate, deactivate, pointer events, overlay)
- [x] ToolManager singleton with storeGetter pattern
- [x] Tools: SelectTool, RectangleTool, EllipseTool, DrawTool, LineTool, ArrowTool, TextTool
- [x] BaseLineTool base class (shared Line/Arrow logic with angle snapping)
- [x] Tool cursor management
- [x] useTools hook — full event bridge between Canvas and ToolManager

### Phase 7: History (Undo/Redo)
- [x] History stack with HistoryEntry/HistoryAction types
- [x] Undo/redo actions in store
- [x] recordBatchUpdate for drag operations (single history entry per drag)
- [x] Keyboard shortcuts

### Phase 8: Text, Line & Arrow
- [x] TextTool with HTML overlay (contenteditable) for inline editing
- [x] TextInputManager for managing text input lifecycle
- [x] LineTool with shift+drag 45-degree angle snapping
- [x] ArrowTool with arrowhead rendering (none/arrow/triangle)
- [x] Line/Arrow hit testing (proximity-based)
- [x] All tools wired into toolbar

### Foundation: Architecture & Identity
- [x] **Canvas decomposition**: 1156 lines -> 203 lines, delegates to 4 hooks (useCanvasSetup, useKeyboardShortcuts, useTouchGestures, useTools)
- [x] **RoughJS integration**: Hand-drawn rendering for rectangles, ellipses, lines, arrows. Deterministic seed per shape for consistent re-renders
- [x] **perfect-freehand integration**: Pressure-sensitive variable-width freehand strokes. Auto-detects real pen pressure vs mouse simulation
- [x] **Animated zoom**: easeOutCubic + RAF-driven `animateZoom` for smooth zoom button transitions. Cancellable (new animation overrides in-progress one)
- [x] **RoughJS tool overlays**: Live drag previews use RoughJS with fixed seed for stable, non-jittery preview shapes

### Structural Refactor: Store, Renderer & TextTool
- [x] **Store decomposition**: 579 lines -> 4 modules (createStore 120, shapeActions 157, viewportActions 102, historyActions 145). Action creators accept set/get for clean separation
- [x] **Renderer decomposition**: 440 lines -> 2 modules (renderer 156, shapeRenderers 301). Shape-specific draw functions extracted with dependency injection
- [x] **TextTool rewrite**: `<input>` → `<textarea>` for multiline. Appends to overlay container instead of document.body. Zustand subscribe() instead of RAF polling for viewport sync. Auto-resizing textarea. Cmd/Ctrl+Enter to confirm, Enter for newlines. Proper blur race condition fix with isConfirming guard
- [x] **All files under 400 lines**: Zero files exceeding the limit (largest: shapeRenderers.ts at 301 lines)

---

## Next Up

### Phase 9: Rendering Quality
Bring the rendering closer to Excalidraw's level of polish.

- [ ] Hand-drawn font (Virgil/Excalifont) for text shapes
- [x] Fill style options per shape: solid, hachure, cross-hatch, dots
- [x] Stroke style options: solid, dashed, dotted
- [x] Shape opacity control in UI (ShapePropertiesPanel)
- [x] Color picker (stroke + fill) per shape (ShapePropertiesPanel)
- [x] Stroke width control per shape (ShapePropertiesPanel)
- [x] Corner radius control for rectangles (ShapePropertiesPanel)
- [ ] Dual-canvas architecture: static canvas (shapes that haven't changed) + interactive canvas (active shape + selection). Eliminates full redraw on every frame

### Phase 10: Editing Polish
Production-level editing UX.

- [x] Copy/Paste (Cmd+C, Cmd+V, Cmd+D, Cmd+X) with paste offset
- [x] Marquee/lasso selection (drag to select multiple)
- [x] Z-order controls (bring forward, send backward, front, back) with Cmd+]/[ shortcuts
- [ ] Bound text: double-click rectangle/ellipse to add/edit text label inside shape (Excalidraw-style container text with parentId binding, auto-center, move/resize sync, delete cascade)
- [x] External paste (images from clipboard)
- [x] Snap to grid
- [x] Snap to shape edges/centers (smart guides)
- [x] Alignment tools (left, center, right, top, middle, bottom, distribute)
- [x] Rotation handle on selection + Shift for 15-degree increments
- [x] Group/ungroup shapes (Cmd+G / Cmd+Shift+G)
- [x] Lock/unlock shapes (Cmd+L / Cmd+Shift+L)
- [x] Minimap

### Phase 11: Export & Import
Enable sharing and saving.

- [ ] Export to PNG (canvas.toDataURL with background)
- [ ] Export to SVG (shape-to-SVG conversion with RoughJS SVG mode)
- [ ] Export to JSON (serialize shapes + viewport)
- [ ] Import from JSON
- [ ] Import from Excalidraw format (.excalidraw files)
- [ ] Download/export UI

### Phase 12: Library API
Clean, composable public API for library consumers.

- [ ] `<Whiteboard />` wrapper component with sensible defaults
- [ ] Props: initialData, onChange, tools, readOnly, theme, locale
- [ ] Hooks: useWhiteboard(), useViewport(), useSelection(), useShapes()
- [ ] Event callbacks: onShapeCreate, onShapeUpdate, onShapeDelete, onViewportChange
- [ ] Custom tool registration API
- [ ] Custom shape renderer API
- [ ] Headless mode (bring your own UI)
- [ ] API documentation + Storybook

### Phase 13: Persistence (Supabase)
Cloud save/load for the SaaS layer.

- [ ] Supabase project setup
- [ ] Auth (email, Google, GitHub)
- [ ] Database schema (boards, shapes, users)
- [ ] Save/load boards
- [ ] Auto-save (debounced)
- [ ] Board list/dashboard
- [ ] Share via public link

### Phase 14: Collaboration (Y.js)
Real-time multi-user editing.

- [ ] Y.js document structure (Y.Map for shapes, Y.Array for ordering)
- [ ] WebSocket provider (y-websocket or Supabase Realtime)
- [ ] Shape CRDT: create, update, delete sync
- [ ] Cursor presence (awareness protocol)
- [ ] User colors + name labels
- [ ] Conflict resolution
- [ ] Offline support + reconnection sync

### Phase 15: Production Polish
Ship-quality reliability.

- [ ] Performance: viewport culling (skip off-screen shapes), shape caching, render budgeting
- [ ] Large board testing (1000+ shapes)
- [ ] Memory leak profiling
- [ ] Error boundaries
- [ ] Accessibility (keyboard navigation, screen reader)
- [ ] Dark mode / light mode / custom themes
- [ ] Mobile responsive
- [ ] i18n support
- [ ] Comprehensive test suite

### Phase 16: Launch
Go public.

- [ ] Documentation site
- [ ] README with quickstart
- [ ] Contributing guide
- [ ] MIT license
- [ ] npm publish
- [ ] Landing page
- [ ] Demo gallery (examples)
- [ ] Launch on Product Hunt / Hacker News

---

## Architecture Overview

```
packages/react-whiteboard/src/
  components/
    Canvas.tsx                      # Thin shell, delegates to hooks
    Minimap.tsx                     # Overview minimap with viewport click-to-navigate
  core/
    store/
      createStore.ts                # Zustand store: interface + wiring
      shapeActions.ts               # Shape CRUD with history tracking
      viewportActions.ts            # Pan, zoom, animateZoom
      historyActions.ts             # Undo/redo logic
      clipboardActions.ts           # Copy, cut, paste, duplicate
      zOrderActions.ts              # Z-order: bring forward/to front, send backward/to back
      shapeStyleActions.ts          # Shape style defaults (fill, stroke, opacity)
      alignmentActions.ts           # Align left/right/top/bottom/center, distribute
      groupActions.ts               # Group/ungroup shapes
      imagePasteActions.ts          # Clipboard image paste handler
      types.ts                      # StoreApi type for action creators
      index.ts                      # Barrel exports
    renderer/
      index.ts                      # CanvasRenderer class: grid, dispatch, selection, rotation handle
      shapeRenderers.ts             # Shape draw functions: rect, ellipse, path, line, arrow, text
      imageRenderer.ts              # Image shape rendering with caching
  hooks/
    useCanvasSetup.ts               # Canvas init, resize, DPI
    useKeyboardShortcuts.ts         # Keyboard event handling (all shortcuts)
    useTouchGestures.ts             # Pinch zoom, two-finger pan
    useTools.ts                     # Pointer events <-> ToolManager bridge
    useShapeProperties.ts           # Headless hook for shape style control
  tools/
    ToolManager.ts                  # Singleton tool router
    types.ts                        # ITool interface, ToolEventContext, ToolState
    SelectTool.ts                   # Click/drag select, move, resize, rotate
    SelectToolResize.ts             # Resize logic extracted from SelectTool
    RectangleTool.ts                # Drag-to-draw rectangles
    EllipseTool.ts                  # Drag-to-draw ellipses
    DrawTool.ts                     # Freehand with pressure capture
    LineTool.ts                     # Lines with angle snapping
    ArrowTool.ts                    # Arrows with arrowhead options
    TextTool.ts                     # Multiline text with textarea overlay
    BaseLineTool.ts                 # Shared Line/Arrow base class
    TextInputManager.ts             # Textarea lifecycle, auto-resize, viewport sync
  types/
    index.ts                        # All type definitions (incl. ImageShape, GroupShape, FillStyle, StrokeStyle)
  utils/
    canvas.ts                       # Coordinate math, easing, arrowheads
    hitTest.ts                      # Point-in-shape detection
    shapeHitTest.ts                 # Shape-specific hit test logic
    resizeHandles.ts                # Handle position calculations
    rotationHandle.ts               # Rotation handle: position, hit test, drawing
    snapping.ts                     # Snap to grid + snap to shape edges (smart guides)
```

---

## Notes

- Every file stays under 400 lines (ideal: 150-300)
- The library is headless — UI (toolbar, panels) belongs in the consuming app
- Shapes have deterministic `seed` values so RoughJS renders identically across re-renders
- The `pressure` field on path points enables stylus support while gracefully falling back to velocity-based simulation for mouse input
- `animateZoom` uses RAF + easeOutCubic and is cancellable — calling it while an animation is running smoothly transitions to the new target
