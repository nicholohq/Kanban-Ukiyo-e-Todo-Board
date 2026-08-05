# Session 004

## Date

2026-08-05

## Objectives

Session 004 — Storage Abstraction:

- Replace direct `localStorage` usage with a storage abstraction.
- Decouple `TodoStore` from the persistence backend.
- Make IndexedDB the primary backend, with localStorage as a fallback.
- Migrate any existing localStorage data into IndexedDB automatically, safely,
  and non-destructively.
- Preserve the existing public API and current application behaviour.

Session 004.5 — Closure & Validation (this log also records the hygiene session
that closes Session 004):

- Declare the previously-transitive `idb` dependency explicitly.
- Add automated tests for the storage layer.
- Complete documentation (this log, ADR-003, architecture overview, session
  template).
- Validate the build and type checks.

## Completed Work

### 1. Storage layer (`src/lib/storage/`)

- `schema.js` — single source of truth for DB name, versions, store names, and
  the legacy localStorage key. Values only, no logic.
- `adapter.js` — the `StorageAdapter` contract as JSDoc typedefs (no runtime
  code). Defines `PersistedState`, `StorageResult`, and the adapter shape.
- `local-storage.js` — `LocalStorageAdapter`, preserving the original
  `utils/storage.js` behaviour (single versioned JSON key, quota-aware writes).
- `indexeddb.js` — `IndexedDBAdapter` over the `idb` wrapper. Stores: `tasks`
  (keyPath `id`, indexed by status/category/priority), `settings` (filters,
  view), `metadata` (migration status). `saveState` commits tasks + settings in
  one atomic `readwrite` transaction.
- `migration.js` — `migrateFromLocalStorage()` (idempotent, verified,
  non-destructive) and `isIndexedDBAvailable()` (environment probe).
- `storage.js` — the `StorageFacade` singleton: lazy single-flight init, backend
  selection (IndexedDB primary, localStorage fallback), one-time migration, and
  the unified `loadState` / `saveState` / `clear` API.

### 2. Compatibility wrapper (`src/lib/utils/storage.js`)

Rewritten from a direct localStorage implementation into a thin wrapper that
forwards `loadState` / `saveState` / `clearState` to the facade. Existing imports
keep working unchanged. Marked legacy; to be removed once callers import the
facade directly.

### 3. `TodoStore` persistence wiring (`src/lib/stores/todoStore.svelte.js`)

The facade's `loadState` / `saveState` are asynchronous (the original localStorage
calls were synchronous). `TodoStore.init()` and `#scheduleSave()` were updated to
`await` them. No public API or behaviour change.

### 4. Session 004.5 — dependency, tests, hardening

- **Dependency:** `idb@^7.1.1` moved from transitive-only to an explicit
  `dependencies` entry. Added `vitest`, `fake-indexeddb`, and `svelte-check` as
  devDependencies, plus `check`, `test`, and `test:watch` scripts.
- **Tests:** 29 tests across four suites in `tests/` (`vitest.config.js` +
  `tests/setup.js` polyfilling IndexedDB via `fake-indexeddb` and a minimal
  in-memory localStorage, reset per test).
- **Hardening fix (found by the tests):** `IndexedDBAdapter.saveState` did not
  honour its all-or-nothing guarantee for a *synchronous* write error — the
  queued `clear()`/`put()`s would auto-commit because the `catch` never aborted
  the transaction. Fixed by aborting the transaction (and swallowing the
  resulting `AbortError`) on any failure. This is a correctness fix within the
  existing contract, not an API change.
- **JSDoc fix:** `getMigrationMetadata` / `markMigrationComplete` typedefs in
  `indexeddb.js` now include the `taskCount` field that was already stored and
  read.

## Migration Strategy

- Runs once, on first facade initialisation with IndexedDB available.
- Short-circuits if migration metadata already records completion (idempotent).
- Reads the legacy localStorage payload; if absent/empty, records a zero-task
  completion and stops.
- Writes the payload into IndexedDB, then **verifies**: the persisted task count
  and every original task ID must be present before completion is recorded.
- The legacy localStorage payload is **never deleted**.

## Build Verification

- `npm run test` — ✅ 29/29 passing (facade, IndexedDB adapter, localStorage
  adapter, migration).
- `npm run check` — ✅ 0 errors (13 pre-existing component warnings, none in the
  storage layer or files touched this session).
- `npm run build` — ✅ Vite client/server compilation succeeds. ⚠️ The
  `adapter-vercel` step fails on Windows with `EPERM: operation not permitted,
  symlink` — the same pre-existing, Windows-only limitation noted in Session 002
  and 003E. It does not affect Vercel's Linux builds and is unrelated to this
  session's changes.

## Test Coverage

| Suite | Scenarios |
|-------|-----------|
| `local-storage-adapter` | metadata, round-trip, empty load, clear, version mismatch, field normalisation |
| `indexeddb-adapter` | init/availability, round-trip, replace-not-duplicate, isEmpty, clear, metadata (incl. taskCount), atomic rollback, uninitialised guard |
| `migration` | success, count + every-id preserved, idempotency, empty-data completion, non-destructive, `isIndexedDBAvailable` present/absent |
| `storage-facade` | IndexedDB selection, localStorage fallback, round-trip, clear, uninitialised getter throws, single-flight `ready()`, compatibility wrapper delegation + re-export |

## Transition State

Per the project's transition-state discipline, this session's intermediate state
is explicit:

### Authority

The **server (Turso via the API) remains the read source of truth**: `TodoStore.init()`
still fetches from the API first and only falls back to local storage on failure.
Session 004 changed *where local data lives* (IndexedDB, behind the facade), not
*who is authoritative*.

### Transitional State

- Snapshot persistence (whole-state writes) — intentionally temporary.
- The compatibility wrapper `utils/storage.js` — retained so callers need not
  change yet.
- Local state is not yet the source of truth (the Engineering Principles' "local
  state is source of truth" is not yet satisfied by design).

### Accepted Limitations

- The server-first `init()` means offline mutations can be overwritten by a
  server fetch on reload. This is a known, accepted limitation of the pre-005
  state.
- Snapshot writes rewrite the full task set on every change (acceptable at
  current scale).

### Exit Criteria

- **Session 005** inverts to local-first (IndexedDB becomes the read source of
  truth), introduces the repository above the facade, and removes persistence
  concerns from `TodoStore` — resolving the authority and overwrite limitations.
- **Session 006** replaces snapshot persistence with operation-based persistence
  beneath the facade.
- The compatibility wrapper is removed once callers import the facade directly.

## Known Limitations

- See Accepted Limitations above.
- No tests yet for `TodoStore` itself (its decomposition and tests are Sessions
  005 / 005.5).
- The Windows-only `adapter-vercel` symlink build error persists (environmental).

## Out of Scope (deferred)

- Local-first inversion, repository extraction, `TodoStore` decomposition — Session 005.
- Operation log / outbox / per-record persistence — Session 006.
- CI, Playwright/integration tests — Session 005.5.

## Readiness for Session 005

Session 004 is **complete and validated**. The storage layer has an explicit
dependency, passing automated tests, an accepted ADR, and reconciled
documentation. The adapter/facade boundary is stable and ready for the repository
to be introduced above it. **Session 005 is ready to begin.**

## Next Session

- Session 005: local-first initialisation, repository extraction, `TodoStore`
  decomposition, separation of device preferences (filters/view) from syncable
  task data, and upsert-only background reconciliation.
