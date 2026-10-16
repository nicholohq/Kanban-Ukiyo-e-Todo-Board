# Architecture Overview

> A living document describing the high-level architecture of Ukiyo Kanban. This document evolves as the project grows.

## Current Architecture (Notepad — Session 005)

```
┌───────────────────────────────────────────────────────────────────────┐
│                          Browser (SPA)                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Service Worker Layer                                        │    │
│  │  Responsibility: Cache network resources only                │    │
│  │                                                              │    │
│  │  Precached:          Runtime Cached:                         │    │
│  │  - App shell (/, /login)  → ukiyo-api-v1 (NetworkFirst)     │    │
│  │  - JS/CSS (Vite chunks)   → google-fonts-* (SWR/CacheFirst) │    │
│  │  - Icons                  → offline fallback (setCatchHandler)│   │
│  │                                                              │    │
│  │  The SW has NO knowledge of application data storage.        │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                    │                                 │
│  ┌───────────┐  ┌──────────┐  ┌───┴────────────────────────────┐    │
│  │  Login/   │  │  Main    │  │  StorageFacade                 │    │
│  │  Signup   │  │  App     │  │  src/lib/storage/storage.js    │    │
│  └─────┬─────┘  └────┬─────┘  │  loadState/saveState/clear     │    │
│        │              │        │  ⟹ IndexedDB (tasks, notes)    │    │
│        │     ┌────────┴────────┐│  ⟹ localStorage (fallback)    │    │
│        │     │   TodoStore     │└──────────────────────────────┘    │
│        │     │   AuthStore     │                                    │
│        │     │   NotesStore    │                                    │
│        │     │   ToastStore    │                                    │
│        │     │   PwaStore      │                                    │
│        │     └────────┬────────┘                                    │
│        │              │  fetch()                                   │
├────────┼──────────────┼─────────────────────────────────────────────┤
│        │              │                                             │
│        ▼              ▼                                             │
│  ┌─────────────────────────────────────┐                            │
│  │  SvelteKit API Routes               │                            │
│  │  (Serverless Functions)             │                            │
│  │  /api/auth/*       → auth endpoints │                            │
│  │  /api/tasks/*      → CRUD endpoints │                            │
│  │  /api/notes/*      → CRUD endpoints │                            │
│  └──────────┬──────────────────────────┘                            │
│             │  @libsql/client                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                           │
│  │  Turso (Edge SQLite) │                                           │
│  └──────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **SPA mode** | Todo boards are interactive; SSR adds complexity |
| **Svelte 5 runes** | Modern reactivity model ($state, $derived, $effect) |
| **Single runes store** | One `TodoStore`/`NotesStore` class per domain for task and note state |
| **JWT in httpOnly cookies** | Secure token approach, prevents XSS theft |
| **Turso edge SQLite** | Low-latency edge database, simple SQL |
| **StorageFacade + adapters** | Decouple TodoStore from persistence; IndexedDB primary, localStorage fallback, behind one stable contract (ADR-003) |
| **IndexedDB primary backend** | More headroom and structure than localStorage, with atomic writes |
| **Automatic verified migration** | One-time localStorage → IndexedDB move; idempotent, integrity-checked, non-destructive |
| **localStorage fallback** | Offline resilience where IndexedDB is unavailable |
| **Notes: one snapshot writer** | `todoStore` saves tasks **and** notes in one atomic snapshot; `notesStore` holds note state and server sync only (ADR-004) |
| **Notes: merge on load** | The newer `updatedAt` per id wins and local-only notes are kept — long-form text is too costly to lose — instead of the tasks' server-first replace (ADR-004) |
| **Notes: client-generated ids** | `POST /api/notes` stores the client's id, because merge-on-load reconciles by id (ADR-004) |
| **Notes: debounced sync** | One `PATCH` per note, 1000 ms after typing stops; a document body cannot be sent per keystroke (ADR-004) |
| **No CSS framework** | Hand-written CSS for full aesthetic control |
| **Vercel adapter** | Zero-config deployment, serverless API routes |
| **@vite-pwa/sveltekit (generateSW)** | Restores a green Vite 8 production build; injectManifest blocked by swSrc ENOENT at SSR closeBundle. Legacy `src/service-worker.js` retained as documented fallback (Session 003F) |
| **SW independent from Storage** | Service worker caches network resources only; storage layer handles persistence |
| **Schema-based cache versioning** | Cache versions represent structure, not app version |

## Data Flow (Online)

**Tasks** (server-first):

1. User action → UI component → Store method
2. Store updates local state (optimistic)
3. Store debounce-saves via the storage facade — IndexedDB primary (300ms)
4. Store fires server API call (fire-and-forget)
5. API route → Turso query → response
6. On failure: toast notification (no rollback)
7. Service Worker caches API GET responses for offline fallback

**Notes** (merged, deliberately divergent — ADR-004):

- **Write path:** `notesStore` updates local state optimistically, then queues the
  note's **id** for a 1000 ms debounce; the flush reads each note's current text
  and sends one `PATCH /api/notes/{id}` per changed note. (`todoStore` still
  writes the local snapshot with the tasks, so a note and a task in the same
  session cannot clobber one another.)
- Create and delete fire immediately (`POST` / `DELETE`); reorder fires
  `PUT /api/notes/reorder`.
- **Load path:** read local notes from the facade, `GET /api/notes`, then
  **merge** by id — the newer `updatedAt` per note wins, and a local-only note
  is kept rather than replaced. A failed fetch passes `[]`, which the merge
  reads as "keep everything local". Nothing is pushed to the server during
  load: a locally-newer note that **has a server row** is `PATCH`ed on the next
  edit, while a note created while the server was unreachable has no server row
  and so cannot reach the server that way — it stays local-only, its text and
  IndexedDB snapshot safe (ADR-004; `session-005.md` Accepted Limitations).
- This is the deliberate divergence from tasks: tasks **replace** local state
  with the server copy (server-first), notes **merge** with it.

## Data Flow (Offline)

1. User opens app → Service Worker serves precached app shell
2. App shell JS/CSS loaded from precache
3. TodoStore.init() runs → API call fails (offline)
4. TodoStore falls back to the storage facade → reads from IndexedDB (or localStorage if IndexedDB is unavailable)
5. Tasks displayed to user from local data
6. CRUD operations work locally; server sync fails silently
7. Toast: "Offline — changes saved locally"

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | JavaScript (ESM, JSDoc types) |
| Framework | SvelteKit 2 + Svelte 5 |
| Build | Vite |
| Database | Turso (libSQL client) |
| Auth | bcryptjs + JWT (jsonwebtoken) |
| Drag & Drop | svelte-dnd-action |
| CSS | Hand-written with custom properties |
| Hosting | Vercel (adapter-vercel) |
| Fonts | Noto Serif JP + Zen Kaku Gothic New |
| PWA | @vite-pwa/sveltekit + Workbox (generateSW); legacy injectManifest fallback in `src/service-worker.js` |

## Storage Layer

Introduced in Session 004 (see [ADR-003](./decisions/ADR-003-storage-layer.md)).
Local persistence sits behind a single facade so `TodoStore` is unaware of the
backend. Since Session 005 the snapshot it writes also carries the notes, which
`notesStore` populates but never persists itself (ADR-004).

```
TodoStore
   │  (via legacy wrapper src/lib/utils/storage.js during the transition)
   ▼
StorageFacade            src/lib/storage/storage.js
   │  lazy single-flight init · backend selection · one-time migration
   ▼
StorageAdapter (contract) src/lib/storage/adapter.js  (JSDoc typedefs only)
   ├── IndexedDBAdapter    src/lib/storage/indexeddb.js   (primary; atomic writes)
   └── LocalStorageAdapter src/lib/storage/local-storage.js (fallback)
```

- **Facade contract:** `loadState()`, `saveState(state)`, `clear()`. Stable;
  evolves additively without breaking callers. `PersistedState` gained `notes`
  and `activeNoteId`; `view` accepts `'notes'` (ADR-004).
- **Object stores (IndexedDB v2):** `tasks`, `notes`, `settings`
  (`view`, `activeNoteId`), `metadata` (migration). The `notes` store arrives at
  database version 2 behind a guarded `oldVersion` upgrade that leaves the
  existing stores alone.
- **Backend selection:** IndexedDB when available, otherwise localStorage.
- **Migration:** on first IndexedDB init, legacy localStorage state is migrated
  once — idempotent, integrity-verified (task count + every id), and the legacy
  payload is never deleted.
- **Persistence model:** whole-state snapshots (intentionally temporary).
- **Scope:** local persistence only — no networking, sync, or service-worker
  concerns (mirrors the SW/Storage independence in ADR-002).

The storage layer does **not** yet make local state the source of truth: `TodoStore`
still reads server-first and falls back to local storage. That inversion, the
repository above the facade, and the evolution of the persistence model beneath it
are planned for later sessions (Session 006 and 007 — see the amendment at the foot
of ADR-003). Notes are a partial exception: they merge with the server copy on load
rather than being replaced by it (ADR-004).

## Future Architecture Changes

This section will document planned architecture changes as they are approved.
