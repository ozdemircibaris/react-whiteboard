# Whiteboard Project Roadmap

## Tech Stack (Final)
- **Rendering**: Canvas + HTML Overlay
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
  - [ ] Line — deferred
  - [ ] Arrow — deferred
  - [ ] Text — deferred
  - [x] Path (freehand)
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
- [ ] Rotation handle — deferred
- [ ] Snapping (optional, can defer)

## Phase 6: Tools System ✅ COMPLETED
- [x] Tool state machine
- [x] BaseTool interface
- [x] Implement tools:
  - [x] SelectTool
  - [x] RectangleTool
  - [x] EllipseTool
  - [ ] LineTool — deferred
  - [ ] ArrowTool — deferred
  - [x] DrawTool (freehand)
  - [ ] TextTool — deferred
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

## Phase 8: HTML Overlay Layer
- [ ] Overlay container component
- [ ] Viewport transform sync (canvas ↔ overlay)
- [ ] ReactComponentShape type
- [ ] Shape-to-overlay positioning
- [ ] Selection UI overlay (handles, rotation)
- [ ] Context menu overlay
- [ ] Tooltip overlay

## Phase 9: Library API & Export
- [ ] Clean public API design
- [ ] `<Whiteboard />` component
- [ ] Props: initialData, onChange, tools, etc.
- [ ] Hooks: useWhiteboard, useViewport, useSelection
- [ ] Event callbacks: onShapeCreate, onShapeUpdate, etc.
- [x] TypeScript types export
- [x] Build setup (tsup)
- [x] Package.json exports config

## Phase 10: Demo App - Basic
- [x] App layout (toolbar, canvas)
- [x] Toolbar component — basic
- [ ] Shape properties panel
- [x] Zoom controls — display only
- [x] Keyboard shortcuts help (Instructions component)
- [ ] Dark/light mode
- [ ] Responsive design

## Phase 11: Persistence (Supabase)
- [ ] Supabase project setup
- [ ] Auth (email, Google, GitHub)
- [ ] Database schema (boards, shapes)
- [ ] Save board
- [ ] Load board
- [ ] Auto-save (debounced)
- [ ] Board list/dashboard

## Phase 12: Collaboration (Yjs + WebSocket)
- [ ] Yjs document structure
- [ ] WebSocket server setup (or Supabase Realtime as transport)
- [ ] Y.Map for shapes
- [ ] Provider setup (y-websocket or y-supabase)
- [ ] Cursor presence (awareness)
- [ ] User colors/avatars
- [ ] Conflict resolution testing
- [ ] Offline support + sync

## Phase 13: Export & Import
- [ ] Export to PNG
- [ ] Export to SVG
- [ ] Export to JSON
- [ ] Import from JSON
- [ ] Import from Excalidraw (optional)
- [ ] Copy/paste (internal)
- [ ] Copy/paste (external - images)

## Phase 14: Polish & Production
- [ ] Performance profiling
- [ ] Memory leak testing
- [ ] Large board testing (1000+ shapes)
- [ ] Error boundaries
- [ ] Loading states
- [ ] Empty states
- [ ] Accessibility (keyboard navigation)
- [ ] SEO (for app pages)
- [ ] Analytics setup
- [ ] Error tracking (Sentry)

## Phase 15: Launch Prep
- [ ] Documentation site
- [ ] README.md
- [ ] Contributing guide
- [ ] License (MIT)
- [ ] npm publish setup
- [ ] Demo/examples
- [ ] Landing page
- [ ] Beta user feedback system

---

## Current Focus
**Phase 8: HTML Overlay Layer** ← NEXT

Priority tasks:
1. Overlay container component
2. Viewport transform sync (canvas ↔ overlay)
3. Selection UI overlay (handles, rotation)
4. Context menu overlay

---

## Notes
- Each phase should be completable independently
- Test as you go, don't leave testing for the end
- Keep the library headless, UI belongs in the app
- Document public APIs as you build them
