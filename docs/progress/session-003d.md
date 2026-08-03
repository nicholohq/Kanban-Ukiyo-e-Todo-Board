# Session 003D

## Date

2026-08-03

## Objectives

- Add quick actions on mobile: context menu, swipe-to-reveal delete, and undo
- Provide an undo toast after destructive actions (delete)
- Support the context menu via right-click, long-press, and keyboard (Shift+F10 / Menu key)
- Add Ctrl/Cmd+Z undo keyboard shortcut (guarded against text fields)
- Keep the delete flow going through the existing ConfirmDialog (swipe never deletes directly)

## Completed Work

### Phase 0 — CSS Foundation

- `src/app.css`: `touch-action: manipulation` on `button`, `.btn`, `.icon-btn`, `a` — removes the 300ms tap delay on mobile and prevents double-tap zoom on quick controls
- Added `.no-select { user-select: none; }` utility used during active gestures

### Phase 1 — Undo Stack (todoStore)

- Added additive undo support to `todoStore.svelte.js` (no CRUD methods changed):
  - `#undoStack` (array) with `#maxUndoDepth = 10`
  - `pushUndo(description)` — captures `$state.snapshot(this.tasks)` before a reversible action
  - `undo()` — pops the snapshot, restores `this.tasks`, shows a toast (`Undid: …`)
  - `canUndo` getter

### Phase 2 — ContextMenu.svelte (new)

- Generic task action menu: Edit, Delete, Duplicate, Mark Done/Reopen, Cancel
- `role="menu"` / `role="menuitem"` with roving tabindex; Arrow keys, Home/End, Escape close
- Positioned via props (`x`/`y`), clamped to the viewport with `env(safe-area-inset-*)` padding
- Click-outside, scroll, and resize close; `Escape` closes; Tab closes and moves on (not a focus trap)
- Focus returns to the opener on close; opener captured when the menu opens
- 300ms just-opened guard on the overlay click so the synthetic click from a long-press finger-lift doesn't instantly dismiss the menu

### Phase 3 — UndoToast.svelte (new)

- `role="status"` + `aria-live="polite"` toast with Undo and dismiss actions
- Auto-dismiss timer (default 5000ms) started via `$effect` on open, and restarted when a new message arrives while already open
- `fly`/`fade` transitions; bottom-left, safe-area aware; respects `prefers-reduced-motion`

### Phase 4 — Context Menu on Cards (board view)

- `TaskCard.svelte`:
  - `oncontextmenu` prop; `contextmenu` handler `preventDefault`s the native menu and opens ours
  - Long-press: 500ms timer, 10px move cancel, opens menu at touch point; haptic `vibrate(20)`
  - Guard against Android double-fire (native `contextmenu` + timer) via the `longPressed` flag
  - `tabindex="0"`, `aria-label`, keyboard trigger via Shift+F10 / Menu key (positioned at the card rect)
  - Tap-to-edit suppressed after a long-press (trailing click is swallowed by `longPressed`)
  - `-webkit-touch-callout: none` on the card
- `KanbanBoard.svelte` / `KanbanColumn.svelte` / `TaskList.svelte`: pass `oncontextmenu` through

### Phase 5 — SwipeRow.svelte (new)

- Swipe-to-reveal-actions row (mobile only), reveals a Delete button — the gesture itself never deletes
- `touch-action: pan-y` so vertical scrolling wins; horizontal lock after 10px of horizontal intent
- Elastic overscroll; snap to revealed (128px) past threshold (default 96px) or snap back
- Haptic `vibrate(10)` on crossing the threshold; `onswipeleft` fired at threshold
- Capture-phase click guard swallows the synthetic post-swipe click so child controls don't fire
- Tap on the revealed row collapses it
- Delete button is `aria-hidden`/`tabindex="-1"` (pointer-only affordance; the row-actions button is the AT path)

### Phase 6 — Swipe + Undo Integration

- `TaskRow.svelte` wrapped in `<SwipeRow disabled={!isTouch}>` (isTouch via `maxTouchPoints`/`ontouchstart`)
- Row `oncontextmenu` + keyboard trigger (Shift+F10 / Menu); `tabindex="0"` with targeted `svelte-ignore` comments
- `+page.svelte` `confirmDelete` now: `pushUndo('Delete task')` → `deleteTask(id)` → shows UndoToast; Undo button calls `todoStore.undo()`
- ConfirmDialog message simplified (delete is no longer "can't be undone")
- Duplicate, Mark Done/Reopen routed through the context menu; Edit and Delete reuse existing flows

### Phase 7 — Keyboard Shortcut

- Ctrl/Cmd+Z on `svelte:window` calls `todoStore.undo()`, guarded to skip INPUT/TEXTAREA/contentEditable targets so in-field undo isn't hijacked
- Escape-to-close-sidebar behavior preserved

## Build Verification

- ✅ Svelte compile: 222 modules transformed (was 218), no errors
- ✅ No new `vite-plugin-svelte` diagnostics introduced (9 total, all pre-existing: login autofocus, TaskForm `state_referenced_locally` ×7, KanbanColumn line 21)
- ✅ No TypeScript/JSDoc errors (`checkJs` off); all new JSDoc annotations type-consistent with existing props
- ⚠️ Build still blocked only by pre-existing environmental issues: `@vite-pwa/sveltekit` swSrc ENOENT race and Vercel adapter EPERM symlink (untouched this session)

## Out of Scope

- PWA swSrc race and Vercel adapter EPERM — pre-existing environment issues, intentionally not fixed
- Delete flow deliberately still routes through ConfirmDialog per spec; swipe reveals Delete but never deletes directly

## Next Session

- Resolve the two build-blocking environment issues (swSrc race, EPERM symlink) to restore a green production build
- Remaining mobile polish from Session 003B plan as prioritized
