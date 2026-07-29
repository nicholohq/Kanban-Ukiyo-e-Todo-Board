# Session 002

## Date

2026-07-29

## Objectives

- Implement Milestone 002: PWA Foundation
- Make Ukiyo Kanban installable as a Progressive Web App
- Enable offline app shell caching
- Provide non-disruptive update experience

## Architecture Decisions

- **ADR-002**: Progressive Web App Architecture — documents the full PWA architecture including layer separation, cache strategy, update philosophy, and storage roadmap.
- **@vite-pwa/sveltekit**: Chosen over manual service worker for long-term maintainability across milestones.
- **injectManifest from Day 1**: Avoids migration from generateSW at v1.4.
- **SW independent from Storage**: Service worker caches network resources only. Storage abstraction handles data persistence.

## Completed Work

### Infrastructure
- Created `svelte.config.js` with adapter-vercel configuration
- Added `@vite-pwa/sveltekit` plugin with injectManifest mode to `vite.config.js`
- Added `process.env.NODE_ENV` define for Workbox compatibility
- Installed dependencies: @vite-pwa/sveltekit, workbox-*

### Icons
- Created `static/icons/` directory
- Generated icons: icon-192.png, icon-512.png, icon-maskable.png, apple-touch-icon.png
- Added apple-touch-icon link to `app.html`

### Service Worker
- Created `src/service-worker.js` with injectManifest
- Implemented precaching (25 entries, 246.71 KB)
- Runtime caching: NetworkFirst for API, CacheFirst for fonts, StaleWhileRevalidate for Google Fonts CSS
- Cache cleanup on activate (removes stale schema caches)
- Offline navigation fallback via setCatchHandler
- No skipWaiting or clientsClaim — natural lifecycle with idle-aware activation

### PWA Store
- Created `src/lib/stores/pwa.svelte.js`
- Manages install prompt (beforeinstallprompt event)
- Tracks installed state (standalone mode detection)
- SW update detection via updatefound event
- Idle state tracking (pointer, focus, drag events)

### Components
- Created `InstallPrompt.svelte` — ukiyo-e styled install button with platform-specific instructions
- Created `UpdateToast.svelte` — idle-aware update notification, auto-reloads when idle
- Integrated both components into `+layout.svelte`

### Cache Config
- Created `src/lib/sw/cache-config.js`
- Schema-based cache names: ukiyo-shell-v1, ukiyo-static-v1, ukiyo-api-v1, ukiyo-google-fonts-css-v1, ukiyo-google-fonts-files-v1

### Documentation
- Created `docs/features/PWA_FOUNDATION.md` — feature specification
- Created `docs/decisions/ADR-002-pwa-architecture.md` — architecture decision record
- Created `docs/progress/session-002.md` — this session log
- Updated `docs/CHANGELOG.md` — v1.2 PWA Foundation entry
- Updated `docs/ROADMAP.md` — v1.2 items marked complete
- Updated `docs/milestones/milestone-002.md` — progress and checklist
- Updated `docs/ARCHITECTURE_OVERVIEW.md` — added PWA layer, SW/Storage separation
- Updated root `README.md` — PWA section added
- Updated `docs/decisions/INDEX.md` — ADR-002 added

## Build Verification

- ✅ Vite client build: 217 modules transformed, 1.84s
- ✅ SW build: 84 modules, 25.82 KB (8.31 KB gzipped)
- ✅ PWA plugin: injectManifest, 25 entries precached (246.71 KB)
- ✅ manifest.webmanifest generated (506 bytes)
- ✅ registerSW.js generated (148 bytes)
- ⚠️ Vercel adapter: EPERM symlink error on Windows (pre-existing, not PWA-related)

## Important Decisions

- Cache names use schema versioning: `ukiyo-{purpose}-v{schema}`
- No skipWaiting() or clientsClaim() — natural SW lifecycle with idle-aware reload
- SvelteKit native SW registration (no virtual:pwa-register module)
- Icons generated from existing favicon.svg using sharp
- Google Fonts split into two caches (CSS: StaleWhileRevalidate, files: CacheFirst)
- Install prompt is custom ukiyo-e styled with platform-specific instructions

## Lessons Learned

*(Filled in at end of session)*

## Next Session

- Session 003: Begin next milestone as determined by Product Owner
- Remaining open: Vercel adapter symlink issue (Windows environment)
