# Notepad — Design

**Date:** 2026-10-16
**Status:** Draft for approval (Plan Mode — no code written)
**Author:** OpenCode (Implementation Engineer)
**Requires approval from:** Product Owner (Nicholo) · Architecture Authority (ChatGPT)

---

## 1. Why this exists

Ukiyo Kanban holds short, descriptive task titles. It has no place for the *other*
kind of writing that happens while studying: a surge of ideas, a rough essay plan,
a list of things to do written out in full sentences. Today that lands outside the
app — a note on a phone, a scrap of text — and gets lost.

The notepad puts that writing inside the tool that is already open, one click from
the board, and gives it a path back: the good parts get sent to the board as real
cards.

## 2. What it is

> As the single user of this app, I want a notepad that lives beside my board, holds
> long-form text in tabs I can name after each subject, saves itself as I write, and
> lets me promote a line into a card — so that the ideas I have mid-class are still
> there when I come back to them.

## 3. Scope

**In**

- A third view in the existing Board / List toggle: **Notes**.
- Multiple notes, shown as a tab strip; each tab is one note named after a subject.
- Plain-text writing area, autosaved to the device and to the account. Local writing is
  merged on load, never replaced by the server copy.
- **Send to board** — a guided two-step promotion of highlighted text into a card.
- **Export .txt** for the note you are looking at.
- Tabs: add, rename, delete, reorder.

**Out (non-goals for this piece of work)**

- Rich text, bold/italic, images, tables, markdown rendering.
- Checkboxes or tickable items inside the notepad. The board is where things get
  ticked; the notepad is where they get written.
- Sharing, collaboration, co-editing (none exists in the app yet; notes stay private).
- Notes appearing in the header search, or in category/priority/tag filters.
- Offline mutation queues. Notes sync after typing stops and merge on load; a queue of
  offline mutations, background sync, and conflict resolution remain out of scope
  (roadmap v1.4).

**Anti-goals — this fails even if it works**

- Losing text. Text not yet on the server must still be on the device, and must survive
  a reload — merge-on-load keeps the server copy from overwriting it. That is
  protection, not rescue: a save that failed is not re-attempted on its own, and reaches
  the server only when that note is next edited. Queued retries are out of scope (§3 Out,
  roadmap v1.4).
- Adding friction to the board. Existing task behaviour, keyboard handling, and the
  undo stack must be untouched.
- A second text editor. The notepad is not a document editor and must not grow into one.

## 4. The decided UI

### 4.1 Where it lives

`ViewToggle.svelte` becomes three buttons — `▦ Board` · `☰ List` · `✎ Notes` — with
the same `aria-pressed` semantics as today. Choosing Notes renders a new
`NotepadView` in `main.content`, exactly where `KanbanBoard` / `TaskList` render now.
The board is not visible while writing; you toggle back.

`todoStore.view` gains `'notes'` as a valid value. It persists with the rest of the
view state, so the app reopens on whatever you were last looking at.

### 4.2 Anatomy

```
At rest
┌──────────────────────────────────────────────────────────────┐
│ header: 浮世 Ukiyo Kanban · search · [Board|List|Notes] · ＋   │
├──────────────────────────────────────────────────────────────┤
│ ┌─ Sociology ─┬─ Ideas ─┬─ To-do ─┬ ＋ ─────────────────────┐ │
│ ├───────────────────────────────────────────────────────────┤ │
│ │   writing area — plain text, full width, roomy line       │ │
│ │   height, comfortable for paragraphs                      │ │
│ ├───────────────────────────────────────────────────────────┤ │
│ │  → Send to board   ⇩ Export .txt   ⋯                   Saved│ │
│ └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

With the send panel open (step 1 of 2)
┌──────────────────────────────────────────────────────────────┐
│ ┌─ Sociology ─┬─ Ideas ─┬─ To-do ─┬ ＋ ─────────────────────┐ │
│ ├───────────────────────────────────────────────────────────┤ │
│ │   writing area — shorter, still visible and selectable    │ │
│ ├───────────────────────────────────────────────────────────┤ │
│ │ 1 of 2 · Title                                            │ │
│ │ What should this card be called?                          │ │
│ │ ┌──────────────────────────────┐   未 To Do ▾             │ │
│ │ │ Read Ch. 4 and pull two quotes│   ⌖ Use selection        │ │
│ │ └──────────────────────────────┘                          │ │
│ │                              Cancel    Next →             │ │
│ └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- The paper treatment follows the app's existing print aesthetic: `--paper`,
  `--border`, `--shadow`, `--radius`.
- **One name per note.** The tab label *is* the note's name (its subject). The
  mockups also showed a secondary title line above the writing area; that is
  dropped — two names for one note is a choice you would have to make twice.
- The send panel **docks** into the notepad card in place of the tools row, so the
  writing area stays on screen and still selectable above it.

### 4.3 Tabs

- `＋` adds a note named `Untitled` and puts the cursor in the name.
- Rename: double-click the tab, or `⋯ → Rename`.
- Delete: `⋯ → Delete`, confirmed with the existing `ConfirmDialog`.
- Reorder: drag, plus `⋯ → Move left / Move right` so it is reachable without a drag.
- The tab strip scrolls horizontally on narrow screens.
- The note you had open is remembered per device and reopened next visit.
- No limit on the number of tabs.

### 4.4 Writing and saving

- A single plain-text field for the whole note body. Line breaks are preserved;
  nothing is interpreted.
- Local save: the existing 300 ms debounced `saveState` path, extended to carry notes.
- Server sync: debounced **1000 ms after typing stops**, one `PATCH` per note
  carrying only that note's `title` and `body`. This is a new agent-facing pattern —
  tasks sync per mutation; a document body cannot.
- A reload never drops local writing: see the merge rule in §5.4.
- `Saved` / `Saving…` indicator lives in the tools row, mirroring `todoStore.saveStatus`.
- Every path (local and server) is a save, never a "save" button.

### 4.5 Send to board (two-step)

Triggered from the tools bar, or from a small popover that appears over the selection.

The flow uses a **docked panel**, not a floating dialog. It takes the place of the tools
row at the bottom of the notepad card and shrinks the writing area rather than covering
it. The note stays visible and selectable while the panel is open — which is the only
reason the second highlight is possible at all.

1. **Step 1 — Title.** The panel reads `1 of 2 · Title` and asks *"What should this card
   be called?"* Pressing **Send to board** with text highlighted carries that selection
   into the title; the panel opens with it filled. The box is editable, so typing works
   too, and **⌖ Use selection** re-reads whatever is highlighted right now.
2. **Step 2 — Description.** `2 of 2 · Description`, *"Anything to keep with it?"* The
   next highlight becomes the description through the same **⌖ Use selection** button.
   Skippable.
3. **Send to board** creates the card through the existing task path and closes the panel.

A highlight is read only when you ask for it, so the panel never holds the note's
selection hostage while you work.

- Destination column: `未 To Do` by default, changeable in the panel.
- **Title is required.** An empty title blocks **Next**, with an inline message saying so.
- **Duplicate titles are refused**, reusing the message `TaskForm` already shows
  (*"A task with this title already exists"*). The panel stays open with the title
  selected so it can be edited. One rule in the app, not two — and it means
  `todoStore.addTask()`'s silent `null` return can never present itself as a dead button.
- The note's name rides along as a task **tag** (tags are free-form), so a card can be
  traced back to the note it came from.
- The text stays in the note after sending. It is marked so you can see it already
  became a card (marking approach open — see §9).
- One send makes one card. Two highlights sent separately make two cards.
- Cancel or `Escape` at any point closes the panel, creates nothing and changes nothing.

### 4.6 Export .txt

- Exports the note currently open. Filename is the note name, sanitised for the file
  system (`Sociology.txt`). Content is the body exactly as written, `\n` line endings,
  UTF-8.
- Client-side only — a Blob and a download link. No server round trip.
- Known device caveat: a download triggered inside an installed iOS PWA may open in a
  new tab rather than the Files app. Accepted; not solved here.

### 4.7 Empty states

- No notes at all: a short line — *"Start a note for a subject you're studying"* —
  and a single button that creates the first tab.
- Empty note: placeholder text in the writing area, nothing else. No illustrations.

### 4.8 Mobile

- The toggle keeps all three options; on narrow headers it wraps to the same
  second-row position the search box already uses.
- Notes view takes the full width; the tab strip scrolls sideways.
- The send panel docks the same way: bottom-anchored, writing area shrinking above it.
  Highlight-then-**⌖ Use selection** works with touch selection.
- The `＋` FAB stays "New task" in this pass, even in Notes view — one new thing at a
  time. Flagged in §9 as worth revisiting.

### 4.9 Accessibility and keyboard

- Tab strip: `role="tablist"` / `role="tab"` / `aria-selected`, arrow keys move between
  tabs, `Enter` renames.
- Third toggle button matches the existing `aria-pressed` contract.
- The send panel is docked, not modal, so focus is never trapped — reaching back into
  the note to highlight the description depends on that. It is a `role="group"` labelled
  "Send to board"; `Escape` closes it and returns focus to the tools bar; **⌖ Use
  selection** is a real button, reachable by keyboard. Each step's question is
  announced, and blocking on an empty or duplicate title is announced with it.
- `Saved` status is announced through a polite live region.
- No new global shortcuts. `Ctrl/Cmd+K` (search), `Ctrl/Cmd+Z` (task undo, already
  disabled inside text fields) and `Escape` keep their current behaviour.

## 5. Data model

### 5.1 Server table (`notes`)

```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT 'Untitled',
  body TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_position ON notes(user_id, position);
```

Added to the inline `SCHEMA` in `src/lib/server/migrate.js` (the file that is actually
executed) and mirrored in `src/lib/server/schema.sql` (reference copy, currently not
read). `IF NOT EXISTS` means the boot-time migration applies it to existing databases.

### 5.2 API

Following the task routes exactly: `locals.user` guard returning 401, `getDb()`,
parameterised `db.execute`, snake_case → camelCase row mapping, every write scoped
`WHERE id = ? AND user_id = ?`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/notes` | All notes for the signed-in user, ordered by `position` |
| `POST` | `/api/notes` | Create a note |
| `PATCH` | `/api/notes/[id]` | Update `title` / `body`, and `updated_at` |
| `DELETE` | `/api/notes/[id]` | Delete a note |
| `PUT` | `/api/notes/reorder` | Persist tab order (mirrors `/api/tasks/reorder`) |

Client wrappers go in `src/lib/utils/api.js` next to the task ones.

The service worker needs no change: the Workbox config caches any `/api/*` GET with
`NetworkFirst`.

### 5.3 Local persistence

Notes ride the existing facade rather than introducing a second one:

- `src/lib/storage/schema.js` — add `NOTES: 'notes'` to `STORES`; bump `DB_VERSION`
  1 → 2.
- `src/lib/storage/indexeddb.js` — include the `notes` store in load/save/clear.
  **Critical:** the `upgrade` callback currently creates all stores unconditionally.
  Bumping the version re-runs it against existing databases and throws
  `ConstraintError`. It must be guarded on `oldVersion` / `objectStoreNames.contains`.
- `src/lib/storage/adapter.js` — add `notes` and `activeNoteId` to the documented
  `PersistedState` shape.
- `src/lib/storage/local-storage.js` and `src/lib/utils/storage.js` — carry the same
  fields so the fallback path is not a dead end.
- `PersistedState` gains `notes: Note[]`, `activeNoteId: string|null`; `view` accepts
  `'notes'`.

Facade contract stays additive (`ADR-003` §7), so no caller breaks. `ADR-003`'s
documented scope is unchanged: this is still local persistence, still snapshot-based,
still unaware of the network.

### 5.4 Stores: one writer, a separate syncer, and a merge on load

**`notesStore` does not save the snapshot.** One store owns the persisted state, and that
stays `todoStore`, whose constructor `$effect` already snapshots and debounce-saves
through the facade. Extending it to carry notes means one atomic writer and one
`PersistedState`, and removes the possibility of two stores rewriting the same record in
turn — the fastest way to lose a paragraph.

- `todoStore` imports `notesStore` **one way** and includes `notes` and `activeNoteId` in
  the snapshot it saves (300 ms debounce, unchanged). `notesStore` never imports
  `todoStore`, so there is no cycle. The send flow talks to tasks from the component, not
  from a store.
- New `src/lib/stores/notesStore.svelte.js` holds state and server sync only:
  - `notes = $state([])`, `activeNoteId = $state(null)`, `syncStatus = $state('idle')`.
  - Mutations are optimistic: local state first, then the API call with
    `.catch(() => toasts.error(...))`.
  - **Server sync is its own 1000 ms debounce** after typing stops — one `PATCH` per note,
    carrying only that note's `title` and `body`.
- **`init()` merges; it does not replace.** `todoStore.init()` currently replaces local
  state whenever the server fetch succeeds. For a paragraph written on a train that is a
  data loss, and §3 names losing text an anti-goal, so the notes path runs its own
  sequence:

  1. Read local notes from the facade.
  2. `GET /api/notes`.
  3. Merge by id, keeping the **newer `updatedAt`** for each note.
  4. Keep every local-only note. Nothing is dropped for being absent from the server.
  5. Write the merged set back to the facade.

  Nothing is pushed to the server during `init()`: a local-only or locally-newer note
  reaches the server the next time that note is edited, which is what fires the sync
  debounce. There is no retry loop, and none is claimed. Where both sides changed the
  same note, the newer copy wins and the older is discarded — real conflict resolution
  is v1.4.

  > **Flush corrected — 2026-10-16.** The shipped flush is `PATCH`-only
  > (`updateNote`, `notesStore.svelte.js`), one call per pending note, so the
  > paragraph above holds only for a note that already has a server row: a
  > locally-newer such note does reach the server on its next edit. A note
  > **created** while the server was unreachable has no server row, so its
  > `PATCH` returns 404 and it stays local-only — nothing is lost locally (the
  > text and the IndexedDB snapshot survive). §7's row 10 therefore holds for a
  > failed *update* but not a failed *create*. Recorded as an accepted limitation
  > in `docs/progress/session-005.md` (Accepted Limitations); it is consistent
  > with the trade-offs ADR-004 records under its Negative consequences.

  Tasks keep their existing server-first behaviour. The divergence is deliberate and is
  one of the two items §9.4 puts in front of the Architecture Authority.

## 6. Files affected

**New**

- `src/lib/stores/notesStore.svelte.js`
- `src/lib/components/NotepadView.svelte` — view shell, tab strip, tools
- `src/lib/components/NoteTabs.svelte` — tab strip + per-tab menu
- `src/lib/components/SendToBoardPanel.svelte` — the docked two-step promotion flow
- `src/routes/api/notes/+server.js`, `src/routes/api/notes/[id]/+server.js`,
  `src/routes/api/notes/reorder/+server.js`
- `tests/notes-storage.test.js` (adapter round-trip + v1 → v2 upgrade)

**Changed**

- `src/lib/components/ViewToggle.svelte` — third button
- `src/routes/+page.svelte` — render `NotepadView`; init the notes store
- `src/lib/stores/todoStore.svelte.js` — accept `'notes'` in `view`; become the single
  snapshot writer by importing `notesStore` and including `notes` + `activeNoteId`
- `src/lib/storage/{schema,indexeddb,adapter,local-storage}.js` +
  `src/lib/utils/{storage,api}.js`
- `src/lib/server/migrate.js`, `src/lib/server/schema.sql`
- `src/lib/index.js` — export the new store/component
- `tests/fixtures.js` — `makeNotes()` and a `sampleState` that carries notes

## 7. Testing plan

**Automated** (`npm test`, Vitest + fake-indexeddb, conventions already in `tests/`)

- Notes survive a save/load round-trip through `IndexedDBAdapter`.
- Same through `LocalStorageAdapter`, including normalising a payload with no `notes`.
- An existing **v1** database opens at v2: the `notes` store appears and every task
  survives. This test exists specifically to catch the `upgrade` guard bug.
- `migration.js` still short-circuits safely with notes present.
- Facade `loadState()` returns notes.
- **One writer:** a task change followed by a note change each persist the combined
  snapshot — neither wipes the other.
- **Merge on load:** a note that exists only locally survives `init()`; where a note
  exists on both sides, the newer `updatedAt` wins.
- **Title validation:** an empty or duplicate title blocks creation and surfaces the
  message.

**Manual**

| # | Step | Expected |
|---|---|---|
| 1 | Toggle to Notes, type a paragraph, reload | Text is still there |
| 2 | Type, then check the board on a second device/browser | Note synced |
| 3 | Rename a tab, reload | Name persisted |
| 4 | Highlight a line → Send to board → title filled → highlight a second block → ⌖ Use selection → Send | One card in To Do, tagged with the note name, carrying that description |
| 5 | Send with the description left empty | Card created, description empty |
| 6 | Clear the title, press Next | Blocked with a message; nothing created |
| 7 | Use a title identical to an existing card | Same message `TaskForm` shows; panel stays open |
| 8 | Export .txt | File downloads, name matches the tab, content matches |
| 9 | DevTools offline, type, reload | Text survives from IndexedDB |
| 10 | Type offline, then load the app online with the server reachable | Local writing is kept, not replaced; it reaches the server on the next edit |
| 11 | Delete a tab | Confirm dialog, then gone; task half unaffected |
| 12 | Arrow keys in the tab strip, Escape from the send panel | Focus behaves |
| 13 | Regress: board, list, drag, filter, search, task undo | Unchanged |

## 8. Process requirements

- **ADR-004 required.** This touches the database (new table), the storage layer
  (object store + version bump), API design, and the state pattern (a second store, one
  writer, merge-on-load). All of those are ADR-eligible under Engineering Guide §5. Per
  §9 the Architecture Authority must approve before implementation.
- **Documentation, same task as the build** (§4 hard rule): `CHANGELOG.md`,
  `docs/progress/session-xxx.md`, the current milestone document,
  `docs/ARCHITECTURE_OVERVIEW.md` (storage diagram + data flow),
  `docs/ROADMAP.md` / `docs/BACKLOG.md`, `docs/decisions/INDEX.md` + `ADR-004`,
  and `docs/features/` if this becomes a feature document.
- The build must be its own session — Session 005, roadmap v1.5. It does not belong
  inside the in-flight v1.4 Offline First work: the repository and local-first inversion
  are Session 006 (see the amendment at the foot of ADR-003), and this design
  deliberately avoids touching them.

## 9. Open items for the Product Owner / Architecture Authority

1. **Where does it sit? — resolved 2026-10-16.** Session 005, roadmap v1.5 —
   Productivity. The repository and local-first inversion previously earmarked for
   Session 005 move to Session 006, whose tests follow at 006.5.
2. **Shared-device caching — resolved 2026-10-16: accepted, deferred to Session
   006.** Local persistence is device-wide, not per-user. For tasks this surfaces a
   previous user's rows only when the server is unreachable (the task load replaces
   local state with the current user's copy). For notes it is **wider**: sign-out
   clears nothing, and merge-on-load keeps the notes already in local storage, so a
   second account signing in on a shared device sees the first account's note text
   **online and persistently**. Accepted for this session; the fix is to scope the
   cached notes by user id, the per-user repository Session 006's local-first
   inversion builds (see the amendment at the foot of ADR-003, and
   `docs/progress/session-005.md` Accepted Limitations).
3. **How the "already sent" mark appears.** `❖` cannot be styled inside a plain
   `<textarea>`. Options: (a) a mirrored layer behind the textarea, so sent ranges are
   highlighted without altering the text; (b) no inline mark, instead a small "sent from
   this note" list under the tools row; (c) a literal `❖ ` character inserted into the
   text — visible everywhere, but it edits the user's writing. The docked panel makes
   (a) newly feasible, since the note is now a live, selectable surface; that is as far
   as this draft goes. Which of the three we build is still open.
4. **Two divergences from the task path, for confirmation.** Notes sync 1000 ms after
   typing stops (one `PATCH` per note) rather than per mutation, and `init()` merges
   local writing with the server instead of letting the server replace it. Both are
   deliberate, both protect §3's first anti-goal, and both are new patterns sitting
   beside the task path.

Resolved on 2026-10-16 and now built into §4 and §5: snapshot ownership, the docked
send panel, merge on load, and title validation.

## 10. Decisions

### 10.1 Agreed with the Product Owner, 2026-10-16

- **One writer.** `todoStore` owns the persisted snapshot and saves notes with it;
  `notesStore` holds state and server sync only.
- **The send flow is a docked panel**, not a focus-trapped popup, so the note stays
  selectable between the two highlights.
- **Local notes merge on load** instead of being replaced by the server copy. A
  local-only note survives; pushing it to the server is not part of this (see §5.4).
- **Titles are validated:** an empty title blocks Next, and a duplicate reuses
  `TaskForm`'s existing message and keeps the panel open.

### 10.2 Calls I made (check these while reading)

- Notes is a third view — your choice — not a slide-in panel. The smaller docked panel
  in §4.5 is the send flow only.
- One name per note (the tab label). The secondary title line from the mockups is
  dropped.
- Plain text only; no checkboxes in the notepad.
- New cards land in To Do, tagged with the note's name, created through the existing
  task path.
- Sending does not remove text from the note.
- Export .txt exports the open note only.
- Notes are excluded from header search and from category/priority/tag filters.
- The "New task" button and FAB keep their meaning in Notes view; `＋` in the tab strip
  is the one that makes a note.
- Tabs get keyboard-accessible reordering, not drag-only.
- Tasks keep their server-first load; notes merge. The two paths differ on purpose.

## 11. Reference

Mockups that led to this design, in the order they were shown:

`Entry point (A/B/C)` · `Chosen: Notes view` · `Send flow` · `Two-highlight send`

They live in `.superpowers/brainstorm/manual-1792165001.76368/content/` and are not
committed. `.superpowers/` should be added to `.gitignore`.
