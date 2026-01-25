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

## Phase 4: Shape System
- [x] BaseShape interface/type
- [ ] Shape registry (plugin system)
- [x] Shape ID generation (nanoid)
- [x] Z-index/layering system
- [x] Implement shapes:
  - [x] Rectangle
  - [x] Ellipse/Circle
  - [ ] Line
  - [ ] Arrow
  - [ ] Text
  - [x] Path (freehand)
- [ ] Shape bounds calculation
- [ ] Hit testing (point-in-shape detection)

## Phase 5: Selection & Interaction
- [ ] Single selection (click)
- [ ] Multi-selection (shift+click)
- [ ] Marquee/lasso selection
- [x] Selection bounds box — rendering only
- [ ] Drag to move shapes
- [ ] Resize handles (8-point)
- [ ] Rotation handle
- [ ] Snapping (optional, can defer)

## Phase 6: Tools System
- [ ] Tool state machine
- [ ] BaseTool interface
- [ ] Implement tools:
  - [ ] SelectTool
  - [ ] RectangleTool
  - [ ] EllipseTool
  - [ ] LineTool
  - [ ] ArrowTool
  - [ ] DrawTool (freehand)
  - [ ] TextTool
- [ ] Tool cursor management
- [ ] Toolbar state sync

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
**Phase 4-5: Shape System + Selection & Interaction** ← NEXT

Priority tasks:
1. Hit testing (detect which shape is clicked)
2. Single/multi selection with click
3. Drag to move shapes
4. Resize handles

---

## Notes
- Each phase should be completable independently
- Test as you go, don't leave testing for the end
- Keep the library headless, UI belongs in the app
- Document public APIs as you build them
