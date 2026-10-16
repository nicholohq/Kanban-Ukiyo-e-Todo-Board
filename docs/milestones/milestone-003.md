# Milestone 003: Notepad

## Objective

Give the board a companion for long-form writing: a third view for notes that
autosaves to the device and the account, keeps one named tab per subject, and can
promote a two-highlight selection into a card on the board.

Session 005, roadmap v1.5 — Productivity. Design approved 2026-10-16 by the
Product Owner and the Architecture Authority.

## Deliverables

- [ ] Notes as a third view alongside Board and List
- [ ] `notesStore` holding note state and server sync, with `todoStore` as the single snapshot writer
- [ ] Named tabs: create, rename, delete, reorder (drag and keyboard), active note remembered per device
- [ ] `notes` object store at IndexedDB database v2, with a guarded upgrade for existing databases
- [ ] `notes` table in the boot migration and `/api/notes` CRUD + reorder endpoints
- [ ] Merge-on-load: the newer `updatedAt` per note wins, local-only notes are never dropped
- [ ] Docked two-highlight send-to-board panel (title, then description; lands in To Do, tagged with the note's name)
- [ ] `.txt` export of the open note
- [ ] ADR-004: Notepad Persistence
- [ ] Documentation (design spec, implementation plan, milestone, progress log)

## Acceptance Criteria

- [ ] `npm test` passes (58 tests once the storage and pure layers land)
- [ ] `npm run check` passes
- [ ] All 13 rows of the design spec's manual test table pass
- [ ] A note survives a reload, an offline reload, and an overnight gap
- [ ] A v1 IndexedDB database upgrades to v2 without losing tasks
- [ ] Highlighting text and sending it creates a card without altering the note
- [ ] An empty or duplicate card title is refused with the app's existing wording
- [ ] Notes are absent from header search, filters, counts and the board
- [ ] No regressions to authentication or task CRUD
- [ ] Documentation updated (Definition of Done)

## Architecture Decisions

| Decision | Choice | ADR |
|----------|--------|-----|
| Notes persistence | New `notes` table and `/api/notes`, client-generated note ids | ADR-004 |
| Local shape | `notes` object store at database v2, upgrade guarded on `oldVersion` | ADR-004 |
| Single writer | `todoStore` saves notes with the tasks in one snapshot | ADR-004 |
| Load semantics | Merge on load — newer `updatedAt` per id wins, local-only notes kept | ADR-004 |
| Server sync | Debounced 1000 ms, one `PATCH` per changed note | ADR-004 |

## Progress

- 2026-10-16: Design approved. Implementation plan written
  (`docs/superpowers/plans/2026-10-16-notepad.md`). Not started.

## Blockers

- The ❖ "already sent" mark is undecided (design spec §9.3) — the feature ships
  without it; a `<textarea>` cannot style a text range.
- Local notes are cached device-wide rather than per-user (design spec §9.2), so
  text can be visible to a different account signing in offline on the same
  device. Consistent with tasks today; Session 006 is where it is fixed.

## Lessons Learned

*(Filled in after completion)*

## Completion Checklist

- [ ] src/lib/utils/notes.js
- [ ] src/lib/utils/view.js
- [ ] src/lib/storage/schema.js, indexeddb.js, local-storage.js, adapter.js, utils/storage.js
- [ ] src/lib/server/migrate.js, schema.sql
- [ ] src/routes/api/notes/* (+server.js, [id], reorder)
- [ ] src/lib/utils/api.js
- [ ] src/lib/stores/notesStore.svelte.js
- [ ] src/lib/stores/todoStore.svelte.js
- [ ] src/lib/components/NotepadView.svelte, NoteTabs.svelte, SendToBoardPanel.svelte, ViewToggle.svelte
- [ ] src/routes/+page.svelte
- [ ] tests/notes-utils.test.js, tests/view.test.js, tests/notes-storage.test.js, tests/fixtures.js
- [ ] docs/decisions/ADR-004-notepad-persistence.md + INDEX.md
- [ ] docs/progress/session-005.md
- [ ] docs/CHANGELOG.md, docs/ARCHITECTURE_OVERVIEW.md, docs/ROADMAP.md
- [ ] Root README.md updated if user-facing

## Retrospective

*(Filled in after completion)*
