# Session 005

## Date

2026-10-16

## Objectives

Session 005 — Notepad (roadmap v1.5 — Productivity):

- Add a third view, **Notes**, beside Board and List.
- Hold long-form plain-text notes in named tabs (create, rename, delete,
  reorder) and remember the open tab per device.
- Persist notes locally through the existing storage facade — a new `notes`
  object store at IndexedDB database **v2**, behind a guarded upgrade — while
  keeping `todoStore` the single snapshot writer.
- Persist notes on the server through a new `notes` table and `/api/notes`
  endpoints, debounced 1000 ms per note.
- Merge local and server notes on load (newer `updatedAt` wins, local-only kept)
  instead of the tasks' server-first replace.
- Promote a two-highlight selection into a board card through a docked panel,
  and export the open note as `.txt`.
- Record the work: ADR-004, changelog, this log, architecture overview,
  roadmap, milestone.

## Completed Work

The feature was built across eight plan tasks (Tasks 1–7 plus this
documentation-and-regression task). Each task was reviewed and approved before
the next began.

### 1. Note model and the pure rules (`src/lib/utils/notes.js`, `view.js`)

- `normalizeNote`, `sortNotes`, `mergeNotes`, `sanitizeFilename`, `noteToTxt`,
  `cardTitleError` — pure functions, no Svelte, no storage, no network.
- `mergeNotes(localNotes, serverNotes)` keys by id, keeps the newer `updatedAt`
  per id, keeps local-only notes, and never drops a note for being absent from
  the server. Identical timestamps keep the local copy.
- `normalizeView` coerces a persisted view to `'board'|'list'|'notes'` (default
  `'board'`).

### 2. Storage carries notes at database v2

- `STORES.NOTES = 'notes'`; `DB_VERSION` 1 → 2 (`schema.js`).
- `IndexedDBAdapter` load/save/clear include the `notes` store; the `upgrade`
  callback creates the three original stores only when `oldVersion < 1` and
  `notes` only when `oldVersion < 2`, so a version bump re-entering `upgrade`
  on an existing database cannot throw `ConstraintError`.
- `LocalStorageAdapter` and the legacy `utils/storage.js` wrapper carry `notes`
  and `activeNoteId`; `view` accepts `'notes'`. `PersistedState` documented
  additively; `STORAGE_VERSION` is unchanged (the payload simply gains fields).
- ADR-004 accepted and listed in `docs/decisions/INDEX.md`.

### 3. The `notes` table

- Added to the inline `SCHEMA` in `src/lib/server/migrate.js` (the copy that
  runs) and mirrored in `src/lib/server/schema.sql`. `IF NOT EXISTS` makes it
  safe to re-run on existing databases.

### 4. The notes API (`/api/notes`)

- `GET`/`POST` collection; `PATCH`/`DELETE` item; `PUT /reorder`, modelled on
  the task routes (401 guard, parameterised `db.execute`, snake_case →
  camelCase, writes scoped `WHERE id = ? AND user_id = ?`).
- `POST` keeps a **client-generated id** when the caller sends one, and is an
  idempotent, user-scoped upsert (`ON CONFLICT(id) DO UPDATE … WHERE
  notes.user_id = excluded.user_id`), so a retried create updates that row
  rather than raising a primary-key conflict and cannot take over another
  user's id. See the divergence note below.
- Five client wrappers added to `src/lib/utils/api.js`.

### 5. The notes store, the single writer and the Notes view

- New `src/lib/stores/notesStore.svelte.js`: `notes`, `activeNoteId`,
  `syncStatus`, `activeNote`, `init()`, `setActive`, `createNote`, `renameNote`,
  `updateBody`, `deleteNote`, `reorderNotes`, `count`.
- `init()` reads local notes from the facade, `GET /api/notes` (a failed fetch
  passes `[]`, which the merge rule reads as "keep everything local"), merges,
  and restores the active note. Nothing is pushed to the server during `init()`.
- Server sync is a 1000 ms debounce holding note **ids**, not text; the text is
  read at flush time, so a tab switch inside the window cannot cross notes.
- `todoStore` remains the single snapshot writer: it imports `notesStore`
  one way (never the reverse), carries `notes` and `activeNoteId` in the
  snapshot, restores the persisted `view` on load, and arms its snapshot effect
  only after `init()` via a `#ready` guard.
- `ViewToggle` gains a third button; `+page.svelte` renders `NotepadView` in
  the view's `{:else}` branch.

### 6. Tabs and export

- `NoteTabs.svelte`: `role="tablist"` strip with drag reorder
  (`svelte-dnd-action` + `animate:flip`) and a `⋯` menu giving keyboard
  reordering (Rename, Move left, Move right, Delete); rename by double-click or
  `Enter`/`F2`; the strip scrolls horizontally.
- Delete is confirmed through the existing `ConfirmDialog`; focus moves to the
  note that takes the deleted tab's place.
- `⇩ Export .txt` writes a Blob download named from `sanitizeFilename(title)`.

### 7. Send to board

- New `SendToBoardPanel.svelte`: a **docked** (not modal) `role="group"` panel
  that replaces the tools row while the note stays visible and selectable —
  the reason the second highlight is possible.
- Two steps (`1 of 2 · Title`, `2 of 2 · Description`) with `⌖ Use selection`
  in each, a column `<select>` from `STATUSES`, and a tag chip carrying the
  note's name. Title validation reuses `cardTitleError`, so an empty or
  duplicate title is refused with `TaskForm`'s wording and the panel stays open.
- `submitCard` calls `todoStore.addTask({ …data, tags: note ? [note.title] : [] })`
  and never mutates the note.

## Build Verification

- `npm test` — ✅ **58 passed (58) across 7 files** (the 29 original tests plus
  29 added by this feature).
- `npm run check` — ✅ **0 errors and 14 warnings in 6 files**. 13 are
  pre-existing; the one new warning is the accepted `state_referenced_locally`
  in `NoteTabs.svelte:29` (the same pattern as `KanbanColumn.svelte:21`,
  deliberate for the drag mirror). `login/+page.svelte`'s `a11y_autofocus` is
  pre-existing.
- `npm run build` — ⚠️ **not a usable exit-code gate in this environment.** All
  three Vite phases succeed — the SSR build, the client build (247 modules), and
  the service-worker build (84 modules) — and the compiled server output
  includes `api/notes/_server.js`, `api/notes/_id_/_server.js` and
  `api/notes/reorder/_server.js`. The build then fails at the
  `@sveltejs/adapter-vercel` step with the pre-existing, Windows-only
  `EPERM: operation not permitted, symlink` (documented since
  `session-002.md:76`, and in `session-003c/d/e` and `session-004.md:95`). This
  is environmental and unrelated to the notepad; the exit code says nothing
  about this code. `npm run build` was therefore used **only as a compile
  check**.
- **The real gates are `npm test`, `npm run check`, the compile phase above,
  and the dev-server probe below.**

### Notes API end-to-end probe (hermetic)

The only automated coverage of the notes path. Run with `.env` loaded into the
process, `TURSO_AUTH_TOKEN` cleared, and `TURSO_DB_URL` **overridden** to a
throwaway local file database — the URL used began with `file:`
(`file:C:/Users/nicholo/AppData/Local/Temp/opencode/notes-regress-<ts>.db`);
the live Turso database was never contacted. `npm run dev` was started on port
5218, two users were registered via `POST /api/auth/signup`, and the sequence
below was run with a cookie-persisting session per user. The server was stopped
afterwards and port 5218 confirmed no longer listening.

| # | Request | Observed |
|---|---------|----------|
| 0 | `GET /api/notes` (no session) | 401 `{"error":"Not authenticated."}` |
| 1 | `GET /api/notes` (user1) | 200 `[]` |
| 2 | `POST /api/notes` with client id | 201, body id equals the sent id |
| 3 | `POST` same id, changed title | 201 — `createdAt` unchanged, `updatedAt` advanced |
| 4 | `PATCH /api/notes/{id}` `{body}` | 200, updated row |
| 5 | `PATCH /api/notes/{id}` `{}` | 400 `{"error":"No fields to update."}` |
| 6 | `PATCH /api/notes/does-not-exist-xyz` | 404 `{"error":"Note not found."}` |
| 7 | `PUT /api/notes/reorder` `{noteIds:[id]}` | 200 `{"ok":true}` |
| 8 | `PUT /api/notes/reorder` `{}` | 400 `{"error":"noteIds is required."}` |
| 9 | `GET /api/notes` (user2) | 200 `[]` |
| 10 | `POST /api/notes` user1's id (user2) | 404 `{"error":"Note not found."}` |
| 11 | `GET /api/notes` (user1) | 200 — user1's note unchanged |
| 12 | `DELETE /api/notes/{id}` | 200 `{"ok":true}` |
| 13 | `DELETE /api/notes/{id}` again | 404 `{"error":"Note not found."}` |
| 14 | `GET /api/notes` (user1) | 200 `[]` |

Full output: `.superpowers/sdd/2026-10-16-notepad/regress8-results.json` (git-
ignored scratch, not committed).

## Automated Test Coverage

| Suite | Scenarios |
|-------|-----------|
| `notes-utils` | `normalizeNote`, `sortNotes`, `mergeNotes` (local-only kept, newer wins both ways, server-newer, server-only kept, no `undefined`, position order), `sanitizeFilename`, `noteToTxt`, `cardTitleError` |
| `view` | the three views, fallback to board |
| `notes-storage` | IndexedDB round-trip (notes/activeNoteId/notes view), no duplication, clear, **v1 → v2 upgrade without losing tasks**; localStorage round-trip, pre-notes payload normalisation, notes view not coerced |
| `storage-facade` | notes + active note through the facade (plus the original Session 004 cases) |
| `migration` | the task migration stays undisturbed with notes present (plus the original cases) |
| `indexeddb-adapter`, `local-storage-adapter` | unchanged from Session 004 |

58 tests across 7 files (29 original + 29 added).

## Deviations and Decisions

Recorded here because nowhere else will.

1. **Session reorder.** This work is **Session 005**, roadmap **v1.5 —
   Productivity**, confirmed 2026-10-16. The local-first inversion, the
   repository and the `TodoStore` decomposition move to **Session 006** (their
   tests to **006.5**, operation-based persistence to **007**). ADR-003 carries
   a dated, decision-unchanged amendment at the foot of its roadmap section.
   Reason accepted: ADR-004's "`todoStore` is the single snapshot writer" only
   holds pre-repository; Session 006 reuses `mergeNotes`; and 006 sits above the
   facade, so there is no `DB_VERSION` collision.
2. **The plan's Task 5 init order was reversed.** The plan said to run
   `notesStore.init()` *after* `todoStore.init()`. It is implemented the other
   way round: `todoStore.init()` is what arms the snapshot writer (`#ready =
   true`), and its guarded effect reads `notesStore.notes`, so with the plan's
   order the writer's first snapshot would carry an empty note set. Applied at
   the root page as a controller ruling.
3. **A call site the plan never mentioned.** `src/routes/login/+page.svelte`
   also calls `todoStore.init()`, so it needed the same notes-first order;
   without it, logging in armed the writer with an empty note set. Found in
   review and fixed afterwards (commit `5837f09`).
4. **Task 7's brief omitted two declared props.** `SendToBoardPanel` takes
   `open` and `seed`; the brief's wiring passed neither. Both are now passed.
5. **`POST /api/notes` accepts a client-generated id** — a deliberate
   divergence from the tasks API, which assigns its own server-side id. Because
   notes merge on load, a note created offline must be re-sendable without
   duplicating, and the client's id is what makes the merge stable; a
   server-assigned id would resurrect the client's note as a second copy. The
   `POST` is also an idempotent, user-scoped upsert (commit `3e2fd24`), so a
   retried create does not 500.
6. **The plan's Task 2 Files list omitted two test files**
   (`tests/storage-facade.test.js`, `tests/migration.test.js`); the plan was
   corrected at commit `a0cda87`.

## Transition State (mandatory)

### Authority

- **Reads:** the server (Turso via `/api/*`) remains the source of truth for
  **tasks** — `todoStore.init()` still fetches server-first. For **notes** the
  merged local+server set is authoritative in memory; merge-on-load keeps the
  newer `updatedAt` per id and never drops a local-only note.
- **Writes:** `todoStore` is the **single snapshot writer** for the persisted
  local state (tasks **and** notes, plus `filters`, `view`, `activeNoteId`).
  `notesStore` holds note state and drives server sync but writes no snapshot.
- **Server writes:** tasks sync per mutation (unchanged); notes sync debounced
  1000 ms, one `PATCH` per note.

### Transitional State

- Snapshot persistence (whole-state writes through the facade) — intentionally
  temporary; superseded by operation-based persistence.
- The local-first inversion is **not** done: tasks still read server-first, so
  an offline task mutation can be overwritten by a server fetch on reload. For
  notes specifically this is already avoided by merge-on-load.
- The compatibility wrapper `src/lib/utils/storage.js` is still in use.
- The ❖ "already sent" mark (§9.3) is not implemented; see Out of Scope.

### Accepted Limitations

- **A failed note *create* never reaches the server.** `notesStore`'s flush
  calls `updateNote` (`PATCH`) only. A note created while the server was
  unreachable has no server row, so its later `PATCH` returns 404 and it never
  reaches the server. The plan's claim that a failed save "reaches the server on
  the next edit" therefore holds for a failed *update* but **not** for a failed
  *create*. Nothing is lost locally — the text and the IndexedDB snapshot
  survive — so this is a sync gap, not data loss. Candidate fix (a follow-up,
  not part of this feature): make the flush use the now-idempotent `POST` as a
  universal upsert, or track which notes the server has confirmed.
- **Local notes are cached device-wide, not per-user — a privacy limitation
  wider than the task baseline** (§9.2). Sign-out clears nothing locally
  (`auth.svelte.js`), and `notesStore.init()` **merges** the notes already in
  local storage with the signed-in user's server copy, so on a shared device
  signing in as a second account shows the **first** account's note text
  **online and persistently** — not only on an offline fallback. Tasks differ:
  `todoStore.init()` fetches the current user's tasks and **replaces** local
  state (`todoStore.svelte.js`), so a previous user's tasks surface only when the
  server is unreachable. Notes widen the exposure beyond that baseline; this is
  accepted for this session and **deferred to Session 006**. It is not fixed here
  deliberately: clearing the local notes on sign-out would destroy a user's
  not-yet-synced notes — the opposite of this feature's promise — and the correct
  fix is to scope the locally cached notes **by user id**, the per-user repository
  Session 006 exists to build (the work the session reorder moved out of 005).
- **Client-generated ids are trusted by the server**; uniqueness is the
  client's responsibility (ADR-004).
- The snapshot now grows with note bodies rather than staying bounded by task
  count (ADR-004).

### Exit Criteria

- **Session 006** — the local-first inversion and the repository above the
  facade: makes local state the read source of truth, removes persistence from
  `TodoStore`, and fixes the shared-device (per-user) caching limitation.
  Session 006 reuses `mergeNotes`.
- **Session 006.5** — tests for `TodoStore` and the repository.
- **Session 007** — operation-based persistence beneath the facade; replaces
  snapshot persistence and can carry the confirmed-writes tracking that closes
  the failed-create sync gap.

## Known Limitations

- The failed-note-*create* sync gap (Accepted Limitations, above) — a
  follow-up.
- `npm run build` cannot exit 0 on Windows (`adapter-vercel` EPERM symlink) —
  environmental, documented since Session 002.
- No automated test covers `TodoStore`/`notesStore` themselves (runes + Svelte);
  the stores are exercised by the pure-layer tests, the API probe, the compile
  phase and the dev-server boot only.
- No automated coverage of the manual browser behaviour in the section below.

## Out of Scope (deferred)

Two items from the design spec's §9 are deferred; a third is resolved. No
`docs/BACKLOG.md` entry was covered by this feature (its export/import and
markdown items are unrelated), so the backlog is unchanged.

1. **The ❖ "already sent" mark — §9.3, unresolved, shipped unbuilt.** A
   `<textarea>` cannot style a range, so nothing in Tasks 1–8 marks sent text.
   The three options are: a mirrored layer behind the textarea, a "sent from
   this note" list in the tools row, or a literal `❖ ` character inserted into
   the text. The docked panel from Task 7 makes the mirrored layer newly
   feasible. Pick an option and it becomes a small follow-up task.
2. **Shared-device caching — §9.2.** Not fixed here, and the record does not
   claim parity with tasks: notes widen the exposure (merge-on-load keeps a
   previous account's note text visible **online and persistently**, where tasks
   replace their local state and surface a previous user's rows only when
   offline). Accepted for this session and **deferred to Session 006**, whose
   per-user repository is the fix. See Accepted Limitations.
3. **§9.1 — the session slot and roadmap version — resolved.** Session 005,
   roadmap v1.5 Productivity, confirmed 2026-10-16. (The brief said "the three
   deferred items below"; only two are actually deferred.)

## Outstanding verification (human-required)

**The agent had no browser available, so none of the checks below were
executed, and none is ticked. The human partner must run the design spec's §7
manual table (the 13 rows quoted verbatim and unticked below), the mobile-width
check and the two plan-derived rows before the milestone is considered
behaviourally verified.**
Nothing the agent ran — the test suite, the type check, the compile phase, or the
API probe — can establish any of them.

Design spec §7 manual table, quoted verbatim from
`docs/superpowers/specs/2026-10-16-notepad-design.md`:

- [ ] 1. Toggle to Notes, type a paragraph, reload — Text is still there
- [ ] 2. Type, then check the board on a second device/browser — Note synced
- [ ] 3. Rename a tab, reload — Name persisted
- [ ] 4. Highlight a line → Send to board → title filled → highlight a second block → ⌖ Use selection → Send — One card in To Do, tagged with the note name, carrying that description
- [ ] 5. Send with the description left empty — Card created, description empty
- [ ] 6. Clear the title, press Next — Blocked with a message; nothing created
- [ ] 7. Use a title identical to an existing card — Same message `TaskForm` shows; panel stays open
- [ ] 8. Export .txt — File downloads, name matches the tab, content matches
- [ ] 9. DevTools offline, type, reload — Text survives from IndexedDB
- [ ] 10. Type offline, then load the app online with the server reachable — Local writing is kept, not replaced; it reaches the server on the next edit
- [ ] 11. Delete a tab — Confirm dialog, then gone; task half unaffected
- [ ] 12. Arrow keys in the tab strip, Escape from the send panel — Focus behaves
- [ ] 13. Regress: board, list, drag, filter, search, task undo — Unchanged

Mobile-width check (DevTools device mode, ~390 px; the spec's table has no
mobile row):

- [ ] The header's three toggle buttons fit or wrap without clipping.
- [ ] The tab strip scrolls horizontally.
- [ ] The send panel docks bottom-anchored.

Two further human-required rows come from the implementation plan rather than the
spec's §7 table (so they carry no §7 row number), quoted verbatim from
`docs/superpowers/plans/2026-10-16-notepad.md` and likewise unticked:

- [ ] **Sync window (Review Focus 5):** type in note A, immediately click note B within one second, type in B, then reload. **Expected:** A holds only A's text and B holds only B's text — nothing lost, nothing crossed.
- [ ] **One writer (plan Task 5, step 8.7):** add a task on the board, then immediately type in the note and reload. **Expected:** both the new task and the new text survive — one snapshot carries tasks and notes together, neither overwrote the other.

Note for row 10: the API endpoints the note sync calls are exercised by the probe
above, but the sync behaviour itself (and "local writing is kept, not replaced")
is a browser check and is not claimed here. Note also the failed-create sync gap
in Accepted Limitations: row 10's "reaches the server on the next edit" holds for
a failed *update* but not for a failed *create*.

## Next Session

- **Session 006** — local-first inversion: the repository above the facade,
  `TodoStore` decomposition, separation of device preferences
  (`filters`/`view`) from syncable data, upsert-only background reconciliation,
  reuse of `mergeNotes`, and per-user (not device-wide) local caching.
- Human: run the 13 manual rows, the mobile check and the two plan-derived rows above.

## End of session

Session 005 is **implementation-complete and green on every gate the
environment allows**, and is **not yet behaviourally verified** — the manual
browser rows above are outstanding. The milestone is carried forward rather
than closed as behaviourally complete; see `docs/milestones/milestone-003.md`.
