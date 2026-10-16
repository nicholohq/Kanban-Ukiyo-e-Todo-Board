# Changelog

All notable changes to this project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Storage layer: `StorageFacade` (`src/lib/storage/`) with IndexedDB primary and localStorage fallback behind a stable `loadState`/`saveState`/`clear` contract
- `StorageAdapter` contract (JSDoc typedefs) with `IndexedDBAdapter` and `LocalStorageAdapter` implementations
- Automatic localStorage → IndexedDB migration: idempotent, integrity-verified (task count + every task id), non-destructive
- Atomic IndexedDB writes (tasks + settings in a single transaction, aborted on any failure)
- Automated storage-layer test suite (Vitest + fake-indexeddb): 29 tests across facade, adapters, and migration
- `check`, `test`, and `test:watch` npm scripts
- ADR-003: Storage Layer Architecture
- Session progress-log template with mandatory transition-state sections (`docs/progress/TEMPLATE.md`)
- Session 004 progress log
- Notes view — a third view beside Board and List, with named tabs (create, rename, delete, reorder)
- Docked two-highlight send-to-board flow (title, then description; new cards land in To Do, tagged with the note's name)
- `.txt` export of the open note
- `notes` table and `/api/notes` endpoints (`GET`/`POST`, `PATCH`/`DELETE`, `PUT /reorder`), with client-generated note ids
- Notes persisted at IndexedDB database v2 (`notes` object store, guarded `oldVersion` upgrade)
- ADR-004: Notepad Persistence
- Session 005 progress log
- Project philosophy and engineering principles documents
- Engineering guide with AI collaboration rules
- Architecture overview
- Release strategy (SemVer)
- Product roadmap (v1.1–v2.0)
- Feature proposal template
- Architecture Decision Records (ADR-001)
- Milestone tracking (Engineering Foundation, PWA Foundation)
- Session-based progress logging
- Backlog for future ideas
- Complete docs/ directory structure

### Changed

- `TodoStore` persistence now goes through the storage facade (async `loadState`/`saveState` awaited in `init()` and the debounced save)
- `src/lib/utils/storage.js` reduced to a thin compatibility wrapper forwarding to the facade (marked legacy)
- `idb` promoted from a transitive dependency to an explicit `dependencies` entry
- `IndexedDBAdapter.saveState` hardened to abort the transaction on a synchronous write error, preserving the all-or-nothing guarantee (found via the new tests)
- Architecture Overview reconciled to describe the implemented storage layer
- Root README updated with Documentation section
- `TodoStore` is now the single snapshot writer for tasks **and** notes; `notesStore` holds note state and server sync only
- The persisted `view` is restored on load (previously an online load reset to Board)
- `DB_VERSION` is now 2 (adds the `notes` object store behind a guarded upgrade)

---

## [1.2.0] — 2026-07-29

PWA Foundation milestone.

### Added

- PWA installability via @vite-pwa/sveltekit (injectManifest mode)
- Web App Manifest with theme_color, background_color, standalone display
- PWA icons (192x192, 512x512, maskable, apple-touch-icon 180x180)
- Service Worker with precaching (25 entries, 246.71 KB)
- Runtime caching strategies (NetworkFirst for API, CacheFirst for fonts, StaleWhileRevalidate for Google Fonts CSS)
- Offline app shell (precached index.html)
- Custom install prompt component (ukiyo-e styled)
- Update toast with idle-aware activation (respects drag, edit, dialog interactions)
- PWA store for install state, update detection, and idle tracking
- Cache versioning with schema-based names (ukiyo-{purpose}-v{version})
- Schema versioning configuration (src/lib/sw/cache-config.js)
- ADR-002: Progressive Web App Architecture
- Feature specification: docs/features/PWA_FOUNDATION.md

### Changed

- svelte.config.js created with adapter-vercel
- vite.config.js updated with @vite-pwa/sveltekit plugin, process.env.NODE_ENV define
- src/app.html: added apple-touch-icon link
- src/routes/+layout.svelte: integrated InstallPrompt and UpdateToast components

---

## [1.0.0] — 2026-07-12

Initial Release.

### Added

- Kanban board with drag-and-drop (To Do / In Progress / Done)
- List view with status grouping and expandable descriptions
- Full CRUD for tasks (title, description, priority, category, tags, due date, status)
- User authentication (signup / login with bcryptjs password hashing)
- JWT session management (httpOnly cookies, 7-day expiry)
- Cloud persistence via Turso edge SQLite
- Offline fallback to localStorage with versioned persistence
- Debounced search across task titles and descriptions
- Multi-dimensional filtering (category, priority, tags with live counts)
- Drag-and-drop reordering within and across Kanban columns
- Responsive design (desktop 3-column grid, tablet, mobile)
- Accessibility features (keyboard navigation, focus trapping, aria-live toasts, reduced motion)
- Ukiyo-e visual design system (CSS custom properties, 4px borders, hard shadows, seigaiha texture)
- Google Fonts integration (Noto Serif JP, Zen Kaku Gothic New)
- Seed data for first-launch demo experience
- SvelteKit SPA configuration (ssr: false)
- Vercel deployment configuration (adapter-vercel)
