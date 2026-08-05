# ADR-003: Storage Layer Architecture

## Status

Accepted

## Date

2026-08-05

## Context

Through v1.2, application state (tasks, filters, view) was persisted directly to
`localStorage` via `src/lib/utils/storage.js`. `TodoStore` imported and called
that module directly, coupling the store to a single, synchronous storage
backend.

The roadmap's Offline First direction (v1.4 and the Session 005–007 sequence)
requires persistence that can grow: a larger and more structured local store,
per-record access, and eventually an operation log — none of which `localStorage`
serves well. Before any of that can happen, the application needs a persistence
**boundary** so the backend can change without the store changing.

Session 004's objective was deliberately narrow: introduce that boundary and move
the default backend to IndexedDB, **while preserving existing behaviour and the
existing public API**. It was explicitly *not* to make the app fully offline-first
(that inversion is Session 005) and *not* to introduce operation-based persistence
(that is Session 006).

Per the Engineering Guide, storage changes are ADR-eligible; this record captures
the decision.

## Decision

### 1. A StorageFacade is the single persistence entry point

Application code talks to one object — the `StorageFacade` singleton
(`src/lib/storage/storage.js`) — exposing a minimal contract:

- `loadState()`
- `saveState(state)`
- `clear()`

The facade owns lazy, single-flight initialisation, backend selection, and the
one-time migration. No application code imports an adapter or `idb` directly.

### 2. Backends implement a common StorageAdapter contract

`src/lib/storage/adapter.js` defines the `StorageAdapter` contract (JSDoc typedefs
only — no runtime code). Two backends implement it:

- `IndexedDBAdapter` (`indexeddb.js`) — the primary backend, via the `idb` wrapper.
- `LocalStorageAdapter` (`local-storage.js`) — the fallback, preserving the exact
  behaviour of the original `utils/storage.js`.

The facade selects IndexedDB when available and falls back to localStorage
otherwise. The store is unaware of which backend is active.

### 3. Snapshot persistence, chosen as a migration strategy

`saveState` persists the whole application state (tasks + filters + view) as one
unit, mirroring the original localStorage model. This was chosen deliberately
because it minimises migration risk, preserves behaviour, keeps the public API
unchanged, and makes the IndexedDB write a single atomic transaction. It is
understood to be transitional: operation-based persistence is a Session 006
concern and is out of scope here.

### 4. Automatic, verified, non-destructive migration

On first initialisation with IndexedDB available, the facade migrates any legacy
`localStorage` payload into IndexedDB (`migration.js`):

- **Idempotent** — migration metadata short-circuits repeat runs; a zero-task
  start still records completion.
- **Verified** — after writing, the task count and every task ID are checked to
  match the source before completion is recorded.
- **Non-destructive** — the legacy `localStorage` payload is never deleted.

### 5. IndexedDB writes are atomic

`saveState` commits the task and settings writes in a single `readwrite`
transaction. If any write fails — synchronously or asynchronously — the
transaction is aborted so a failed save never partially applies.

### 6. Local persistence is isolated from networking and the service worker

The storage layer persists **local** application state only. It has no knowledge
of the server API, the Turso database, or the service worker cache. This mirrors
the SW/Storage independence established in ADR-002 and keeps each layer evolving
on its own axis: the store's server synchronisation (currently fire-and-forget
API writes) sits above the storage layer, not inside it.

### 7. The facade contract is stable and evolves additively

> The StorageFacade provides a stable public contract that may evolve additively
> when required by future roadmap milestones without breaking existing callers.

Callers should be able to rely on `loadState` / `saveState` / `clear` remaining
valid. The backends beneath the facade may change; the contract in front of it
does not break.

### 8. A compatibility wrapper preserves existing imports

`src/lib/utils/storage.js` is retained as a thin wrapper that forwards
`loadState` / `saveState` / `clearState` to the facade, so existing imports keep
working during the transition. It is marked legacy and slated for removal once
callers import the facade directly.

## Consequences

**Positive:**

- `TodoStore` is decoupled from the persistence backend; the backend can change
  without touching the store.
- IndexedDB provides more headroom and structure than localStorage, with atomic
  writes.
- Migration is safe: idempotent, verified, and non-destructive.
- The adapter/facade seam is the stable boundary future sessions build on
  (repository above it in Session 005; the persistence strategy evolving beneath
  it in Session 006).
- localStorage remains a working fallback for environments without IndexedDB.

**Negative:**

- Adds one runtime dependency (`idb`), previously only transitively present.
- Snapshot persistence rewrites the full task set on every save; this is
  acceptable at current scale and is intentionally temporary (superseded in
  Session 006).
- A second persistence path (the compatibility wrapper) exists during the
  transition and must eventually be removed.

## Contract Stability

| Aspect | Guarantee |
|--------|-----------|
| Public methods | `loadState`, `saveState`, `clear` — stable |
| Evolution | Additive only; existing callers never break |
| Backend | May change (localStorage → IndexedDB → future) without contract change |
| Scope | Local persistence only — never networking, sync, or SW concerns |

## Relationship to the Roadmap

- **Session 004 (this ADR):** the storage boundary and IndexedDB backend.
- **Session 005:** a repository is introduced *above* the facade; the application
  inverts to local-first. The facade contract is unaffected.
- **Session 006:** the persistence strategy beneath the facade evolves from
  snapshot to operation-based. Any contract change will be additive and recorded
  in its own ADR.

The specific shape of that Session 006 evolution is intentionally deferred until
the operation model is designed, and is not decided here.
