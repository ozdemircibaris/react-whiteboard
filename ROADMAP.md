# Whiteboard Project Roadmap

## Tech Stack (Final)
- **Rendering**: Canvas + HTML Overlay (when needed)
- **State**: Zustand
- **Collaboration**: Yjs + WebSocket
- **App**: Vite + React 19 (demo), Next.js (future SaaS)
- **Structure**: Monorepo (pnpm + turborepo)

---

## Phase 1: Project Setup ✅ COMPLETED
- [x] Initialize monorepo with pnpm workspaces
- [x] Setup Turborepo
- [x] Create `packages/react-whiteboard` structure
- [x] Create `apps/web` (Vite + React 19)
- [x] Shared TypeScript config
- [x] ESLint + Prettier config
- [ ] Git hooks (husky + lint-staged) — deferred

## Phase 2: Core Canvas Engine ✅ COMPLETED
- [x] Create Canvas component with ref
- [x] Implement render loop (requestAnimationFrame)
- [x] Viewport state (pan, zoom, bounds)
- [x] Camera/viewport transforms
- [x] Canvas coordinate ↔ screen coordinate utils
- [x] DPI/retina display handling
- [x] Zustand store setup

**Files created:**
- `packages/react-whiteboard/src/core/store.ts` — Zustand store
- `packages/react-whiteboard/src/core/renderer.ts` — Canvas renderer
- `packages/react-whiteboard/src/components/Canvas.tsx` — Canvas component
- `packages/react-whiteboard/src/utils/canvas.ts` — Coordinate utils

## Phase 3: Event System ✅ COMPLETED
- [x] Pointer event handling (down, move, up) — basic
- [x] Mouse wheel zoom
- [x] Pan with Alt+drag / middle mouse
- [x] Touch support (pinch zoom, two-finger pan)
- [x] Keyboard event system (Delete, Escape, Cmd+A, Arrow keys)
- [ ] Event delegation architecture — deferred (not needed yet)

## Phase 4: Shape System ✅ COMPLETED
- [x] BaseShape interface/type
- [ ] Shape registry (plugin system) — deferred
- [x] Shape ID generation (nanoid)
- [x] Z-index/layering system
- [x] Implement shapes:
  - [x] Rectangle
  - [x] Ellipse/Circle
  - [x] Path (freehand)
  - [ ] Line — Phase 8
  - [ ] Arrow — Phase 8
  - [ ] Text — Phase 8
- [x] Shape bounds calculation
- [x] Hit testing (point-in-shape detection)

**Files created:**
- `packages/react-whiteboard/src/utils/hitTest.ts` — Hit testing utilities

## Phase 5: Selection & Interaction ✅ COMPLETED
- [x] Single selection (click)
- [x] Multi-selection (shift+click)
- [ ] Marquee/lasso selection — deferred
- [x] Selection bounds box — rendering only
- [x] Drag to move shapes
- [x] Resize handles (8-point)
- [ ] Rotation handle — Phase 10
- [ ] Snapping — Phase 10

## Phase 6: Tools System ✅ COMPLETED
- [x] Tool state machine
- [x] BaseTool interface
- [x] Implement tools:
  - [x] SelectTool
  - [x] RectangleTool
  - [x] EllipseTool
  - [x] DrawTool (freehand)
  - [ ] LineTool — Phase 8
  - [ ] ArrowTool — Phase 8
  - [ ] TextTool — Phase 8
- [x] Tool cursor management
- [x] Toolbar state sync

**Files created:**
- `packages/react-whiteboard/src/tools/types.ts` — Tool types and interfaces
- `packages/react-whiteboard/src/tools/SelectTool.ts` — Selection tool
- `packages/react-whiteboard/src/tools/RectangleTool.ts` — Rectangle tool
- `packages/react-whiteboard/src/tools/EllipseTool.ts` — Ellipse tool
- `packages/react-whiteboard/src/tools/DrawTool.ts` — Freehand drawing tool
- `packages/react-whiteboard/src/tools/ToolManager.ts` — Tool manager
- `packages/react-whiteboard/src/hooks/useTools.ts` — React hook for tools

## Phase 7: History (Undo/Redo) ✅ COMPLETED
- [x] Command pattern implementation — basic structure
- [x] History stack
- [x] Undo action
- [x] Redo action
- [x] Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, Ctrl+Y)
- [x] CRDT-friendly structure (for future collab)

---

## Phase 8: Core Shapes & Tools ← CURRENT
Complete the essential shapes and tools for a functional whiteboard.

### Text System
- [ ] Text shape type (position, content, fontSize, fontFamily, color, align)
- [ ] TextTool implementation
- [ ] Inline text editing (contenteditable overlay or canvas-based)
- [ ] Text bounds calculation
- [ ] Text hit testing
- [ ] Font size controls

### Line & Arrow
- [ ] Line shape type (start, end, strokeWidth, color)
- [ ] Arrow shape type (extends Line with arrowhead options)
- [ ] LineTool implementation
- [ ] ArrowTool implementation
- [ ] Line/Arrow hit testing (proximity-based)
- [ ] Endpoint handles for editing

### Toolbar Updates
- [ ] Add Text, Line, Arrow buttons to toolbar
- [ ] Tool icons

## Phase 9: Export & Import
Enable sharing and saving work.

- [ ] Export to PNG (canvas.toDataURL)
- [ ] Export to SVG (shape-to-SVG conversion)
- [ ] Export to JSON (serialize shapes)
- [ ] Import from JSON (deserialize)
- [ ] Download UI (export button, format selection)
- [ ] Import from Excalidraw (optional, nice-to-have)

## Phase 10: Editing Polish
Improve the editing experience.

### Copy/Paste
- [ ] Internal copy (Cmd+C)
- [ ] Internal paste (Cmd+V)
- [ ] Duplicate (Cmd+D)
- [ ] Cut (Cmd+X)
- [ ] Paste offset (so pastes don't overlap)
- [ ] External paste (images from clipboard)

### Snapping & Alignment
- [ ] Snap to grid
- [ ] Snap to other shapes (edges, centers)
- [ ] Smart guides (alignment lines)
- [ ] Align tools (left, center, right, top, middle, bottom)
- [ ] Distribute evenly

### Rotation
- [ ] Rotation handle on selection
- [ ] Rotate shapes (update rotation property)
- [ ] Shift+rotate for 15° increments

## Phase 11: Library API
Clean up the public API for library consumers.

- [ ] Clean public API design
- [ ] `<Whiteboard />` wrapper component
- [ ] Props: initialData, onChange, tools, readOnly, etc.
- [ ] Hooks: useWhiteboard, useViewport, useSelection
- [ ] Event callbacks: onShapeCreate, onShapeUpdate, onShapeDelete
- [x] TypeScript types export
- [x] Build setup (tsup)
- [x] Package.json exports config
- [ ] API documentation

## Phase 12: Persistence (Supabase)
Save and load boards from the cloud.

- [ ] Supabase project setup
- [ ] Auth (email, Google, GitHub)
- [ ] Database schema (boards, shapes)
- [ ] Save board
- [ ] Load board
- [ ] Auto-save (debounced)
- [ ] Board list/dashboard
- [ ] Share board (public link)

## Phase 13: Collaboration (Yjs + WebSocket)
Real-time multi-user editing.

- [ ] Yjs document structure
- [ ] WebSocket server setup (or Supabase Realtime)
- [ ] Y.Map for shapes
- [ ] Provider setup (y-websocket or y-supabase)
- [ ] Cursor presence (awareness)
- [ ] User colors/avatars
- [ ] Conflict resolution testing
- [ ] Offline support + sync

## Phase 14: HTML Overlay Layer
Add HTML elements on top of canvas when needed.

- [ ] Overlay container component
- [ ] Viewport transform sync (canvas ↔ overlay)
- [ ] Text editing overlay (if not canvas-based)
- [ ] Context menu overlay
- [ ] Tooltip overlay
- [ ] Properties panel (shape settings)

## Phase 15: Polish & Production
Production-ready quality.

- [ ] Performance profiling
- [ ] Memory leak testing
- [ ] Large board testing (1000+ shapes)
- [ ] Error boundaries
- [ ] Loading states
- [ ] Empty states
- [ ] Accessibility (keyboard navigation)
- [ ] Dark/light mode
- [ ] Responsive design
- [ ] Error tracking (Sentry)

## Phase 16: Launch Prep
Ready for public release.

- [ ] Documentation site
- [ ] README.md
- [ ] Contributing guide
- [ ] License (MIT)
- [ ] npm publish setup
- [ ] Demo/examples
- [ ] Landing page
- [ ] Beta user feedback

---

## Current Focus
**Phase 8: Core Shapes & Tools** ← NEXT

Priority:
1. Text shape + TextTool (most requested feature)
2. Line shape + LineTool
3. Arrow shape + ArrowTool
4. Update toolbar with new tools

---

## Notes
- Each phase should be completable independently
- Test as you go, don't leave testing for the end
- Keep the library headless, UI belongs in the app
- Document public APIs as you build them
- Focus on core features before fancy additions
