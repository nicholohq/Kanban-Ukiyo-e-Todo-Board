# Milestone 003: Notepad

## Objective

Give the board a companion for long-form writing: a third view for notes that
autosaves to the device and the account, keeps one named tab per subject, and can
promote a two-highlight selection into a card on the board.

Session 005, roadmap v1.5 — Productivity. Design approved 2026-10-16 by the
Product Owner and the Architecture Authority.

## Deliverables

- [x] Notes as a third view alongside Board and List
- [x] `notesStore` holding note state and server sync, with `todoStore` as the single snapshot writer
- [x] Named tabs: create, rename, delete, reorder (drag and keyboard), active note remembered per device
- [x] `notes` object store at IndexedDB database v2, with a guarded upgrade for existing databases
- [x] `notes` table in the boot migration and `/api/notes` CRUD + reorder endpoints
- [x] Merge-on-load: the newer `updatedAt` per note wins, and a local-only note is never dropped while it is `pending` — a confirmed one the server no longer lists is treated as deleted (amended 2026-10-17)
- [x] Docked two-highlight send-to-board panel (title, then description; lands in To Do, tagged with the note's name)
- [x] `.txt` export of the open note
- [x] ADR-004: Notepad Persistence
- [x] Documentation (design spec, implementation plan, milestone, progress log)

## Acceptance Criteria

- [x] `npm test` passes (58 tests once the storage and pure layers land)
- [x] `npm run check` passes
- [ ] All 13 rows of the design spec's manual test table pass
- [ ] A note survives a reload, an offline reload, and an overnight gap
- [x] A v1 IndexedDB database upgrades to v2 without losing tasks
- [ ] Highlighting text and sending it creates a card without altering the note
- [ ] An empty or duplicate card title is refused with the app's existing wording
- [ ] Notes are absent from header search, filters, counts and the board
- [ ] No regressions to authentication or task CRUD
- [x] Documentation updated (Definition of Done)

## Architecture Decisions

| Decision | Choice | ADR |
|----------|--------|-----|
| Notes persistence | New `notes` table and `/api/notes`, client-generated note ids | ADR-004 |
| Local shape | `notes` object store at database v2, upgrade guarded on `oldVersion` | ADR-004 |
| Single writer | `todoStore` saves notes with the tasks in one snapshot | ADR-004 |
| Load semantics | Merge on load — newer `updatedAt` per id wins; a `pending` local-only note is kept, a confirmed one missing from the server is dropped | ADR-004 |
| Server sync | Debounced 1000 ms, one `PATCH` per changed note | ADR-004 |

## Progress

- 2026-10-16: Design approved. Implementation plan written
  (`docs/superpowers/plans/2026-10-16-notepad.md`). Not started.
- 2026-10-16: **Session 005 built the feature** across Tasks 1–7 (commits
  `d93f2b2` … `200aa89`) and this task recorded it. `npm test` 58/58 across 7
  files; `npm run check` 0 errors, 14 warnings (13 pre-existing plus the accepted
  `state_referenced_locally` in `NoteTabs.svelte`); the hermetic `/api/notes`
  probe passed all 15 checks against a throwaway `file:` database; all three Vite
  build phases compiled (the build still fails at the pre-existing Windows
  `adapter-vercel` EPERM symlink, so it was used only as a compile check).
- **Deliverables are ticked because the implementation exists on this branch** —
  established by the automated tests, the API probe, the type check and the
  compile phase. **A row whose truth depends on a manual browser check the agent
  did not run is deliberately left unticked.** The agent had no browser, so the
  design spec's 13-row manual table and the mobile-width check are recorded
  verbatim and unticked under **"Outstanding verification (human-required)"** in
  `docs/progress/session-005.md`, and must be run by the human partner before the
  milestone is considered behaviourally verified. The milestone is
  **implementation-complete, not behaviourally verified** — the code being
  finished is not the same as the behaviour being verified.
- 2026-10-17: **Two load-path bugs found by the first manual verification run**
  (the human partner reported them): a stale local copy out-ranking a newer
  server row (`3837cee`), and a note deleted on one device resurrecting on every
  reload of another (`2408d67`). Both were diagnosed before being fixed, both
  carry failing-first tests, and both are recorded in the design spec's §5.4
  amendments and ADR-004; `npm test` is now **68/68**. The deletion fix is the
  reported merge blocker, so the milestone remains **implementation-complete,
  not behaviourally verified** pending the manual matrix — which now includes a
  cross-device deletion row.
- 2026-10-17 (later): **The human partner's retest passed.** The cross-device
  deletion case now holds — delete on A → reload B → gone → reload B again →
  still gone — and §7 manual rows **1, 2, 3, 4 and 13** passed. §7 rows **5–12**,
  the mobile-width check and the offline cases **9–10** are **outstanding, not
  failed**: the mobile check is runnable locally by device emulation, and the
  offline cases need a service worker, which dev does not register (steps in
  `session-005.md`). The matrix is therefore **not clean**, so the milestone
  stays implementation-complete rather than behaviourally verified.

## Blockers

- **Carried forward (undecided).** The ❖ "already sent" mark is undecided (design
  spec §9.3) — the feature ships without it; a `<textarea>` cannot style a text
  range. Options recorded in `session-005.md`; a small follow-up once one is
  chosen.
- **Carried forward to Session 006 — a privacy limitation wider than tasks.**
  Local notes are cached device-wide rather than per-user (design spec §9.2):
  sign-out clears nothing locally and merge-on-load keeps a previous account's
  note text visible to the next account on a shared device **online and
  persistently**. Tasks replace their local state on load, so a previous user's
  tasks surface only when offline — notes do not share that bound. Accepted for
  this session; not fixed here because clearing local notes on sign-out would
  destroy unsynced text. The fix is to scope the cached notes by user id, which
  is Session 006's per-user repository.
- **New, non-blocking follow-up.** `notesStore`'s flush only `PATCH`es, so a note
  created while the server was unreachable never reaches the server (its later
  `PATCH` returns 404). Nothing is lost locally. Candidate fix recorded under
  Accepted Limitations in `session-005.md`.

## Lessons Learned

- The single-writer guard is order-sensitive: the writer arms at the end of
  `todoStore.init()` and its effect reads `notesStore.notes`, so `notesStore.init()`
  must run first — at the root page **and** at the login page. The plan's order was
  reversed; the login call site was missed until review.
- Trusting the client's note id (rather than minting one server-side) is what makes
  merge-on-load stable; the follow-on is that `POST` had to become an idempotent
  upsert so a retried create does not 500.

## Completion Checklist

- [x] src/lib/utils/notes.js
- [x] src/lib/utils/view.js
- [x] src/lib/storage/schema.js, indexeddb.js, local-storage.js, adapter.js, utils/storage.js
- [x] src/lib/server/migrate.js, schema.sql
- [x] src/routes/api/notes/* (+server.js, [id], reorder)
- [x] src/lib/utils/api.js
- [x] src/lib/stores/notesStore.svelte.js
- [x] src/lib/stores/todoStore.svelte.js
- [x] src/lib/components/NotepadView.svelte, NoteTabs.svelte, SendToBoardPanel.svelte, ViewToggle.svelte
- [x] src/routes/+page.svelte
- [x] tests/notes-utils.test.js, tests/view.test.js, tests/notes-storage.test.js, tests/fixtures.js
- [x] docs/decisions/ADR-004-notepad-persistence.md + INDEX.md
- [x] docs/progress/session-005.md
- [x] docs/CHANGELOG.md, docs/ARCHITECTURE_OVERVIEW.md, docs/ROADMAP.md
- [x] Root README.md updated if user-facing — **done.** Its Features list now
  reads "Three views" and names the Notes notepad (named tabs, send-to-board,
  `.txt` export). The README was outside the original committed file list, so it
  was flagged as a follow-up during Task 8 and corrected in the fix round that
  followed.

## Retrospective

- The feature was delivered as eight reviewed tasks; the two defects that reached
  review (the init order at the login page, the two missing `SendToBoardPanel`
  props) were both wiring slips rather than design failures, and both are fixed.
- The verification the environment allows (tests, type check, compile, the API
  probe) is green; the browser behaviour the design spec calls for is not verified
  and is carried forward to the human partner.
