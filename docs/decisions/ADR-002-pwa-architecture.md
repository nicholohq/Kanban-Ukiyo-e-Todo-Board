# ADR-002: Progressive Web App Architecture

## Status

Accepted

## Date

2026-07-29

## Context

Ukiyo Kanban is a web application that requires network access to load. While it has a localStorage fallback for data persistence, the app shell itself is not available offline. The project's Engineering Principles mandate Offline First (Principle 1) and Mobile First (Principle 2). The roadmap targets PWA Foundation as v1.2.

Key architectural decisions needed:
1. Whether to adopt PWA architecture
2. Which service worker approach to use (plugin vs manual, generateSW vs injectManifest)
3. How to structure caching, updates, and storage

## Decision

### 1. PWA Architecture is Adopted

The project becomes a Progressive Web App. This aligns with Offline First and Mobile First engineering principles.

### 2. Service Worker is an Infrastructure Layer

The service worker is managed by `@vite-pwa/sveltekit` with Workbox, not hand-written. This reduces long-term maintenance burden across milestones v1.2 through v2.0.

### 3. injectManifest from Day 1

We use `injectManifest` strategy immediately rather than starting with `generateSW` and migrating later. The complexity difference is minimal (~15 lines of SW code), and we avoid a known migration at v1.4 (IndexedDB, sync queue).

### 4. SW and Storage are Architecturally Independent

The service worker caches network resources only. It has no knowledge of application data storage (localStorage or future IndexedDB). This clean separation ensures each layer can evolve independently.

### 5. Cache Schema Versioning

Cache names use schema versions (e.g., `ukiyo-shell-v1`), not application versions. Schema versions increment only when cache structure changes, not when the app is released.

### 6. Idle-Aware Update Activation

Updates activate when the application is idle (no drag, no focused input, no open dialog, no recent pointer events). This prevents interruption during active user interactions.

### 7. Storage Migration is Deferred

localStorage remains the data layer for v1.2. IndexedDB migration is a v1.4 concern.

## Consequences

**Positive:**
- App is installable and offline-capable
- Consistent with Offline First and Mobile First principles
- Plugin reduces long-term SW maintenance burden
- injectManifest avoids known migration at v1.4
- Clean separation of concerns (SW vs Storage)
- Schema versioning prevents unnecessary cache invalidation
- Idle-aware updates respect user workflow

**Negative:**
- Adds dependencies: @vite-pwa/sveltekit, workbox-precaching, workbox-core, workbox-routing, workbox-strategies, workbox-expiration, workbox-cacheable-response
- Plugin may have bugs or lag behind Vite/SvelteKit updates
- iOS limitations persist (no push notifications, no background sync, manual install only)
- Vite 8 build-ordering issue (#101) may require mitigation
- Safari proactive eviction may clear caches on infrequently visited apps

## Plugin Selection

`@vite-pwa/sveltekit` is chosen over manual service worker:

| Factor | Manual SW | @vite-pwa/sveltekit |
|--------|-----------|---------------------|
| Initial complexity | Low (small SW) | Low (plugin config) |
| Long-term maintenance | High (grows per milestone) | Low (plugin handles lifecycle) |
| Flexibility | Highest (full control) | High (injectManifest) |
| Dependency count | Zero | ~7 transitive (Workbox) |
| Community support | None | Strong (3.9k stars, 3.4M weekly) |
| Migration path | N/A | generateSW → injectManifest |

The maintenance burden over v1.2-v2.0 favors the plugin approach. The long-term cost of manually managing precaching, cache versioning, and lifecycle across multiple milestones exceeds the cost of the dependency.

## SW Strategy

`injectManifest` from Day 1 over `generateSW`:

| Factor | generateSW → injectManifest | injectManifest Day 1 |
|--------|---------------------------|---------------------|
| Setup complexity | Low | Medium (but minimal: ~15 extra lines) |
| Migration cost | Medium (rewrite at v1.4) | Zero |
| Future maintenance | Two phases | One consistent phase |
| Risk profile | Migration risk at v1.4 | No migration risk |

Since v1.4's requirements (IndexedDB, sync queue, background sync) are known, starting with injectManifest avoids unnecessary technical debt.

## Storage Philosophy

The service worker and storage layer are independent:

| Layer | Responsibility | Knows About |
|-------|---------------|-------------|
| Service Worker | Cache network resources | HTTP requests, cache headers |
| Application | Business logic, UI | Tasks, filters, auth |
| Storage Abstraction | Persistence interface | save/load contract |
| Storage Implementation | Actual persistence | localStorage or IndexedDB |

This separation ensures:
- SW can be updated without touching storage
- Storage can be migrated without touching SW
- Each layer has a single responsibility

## Update Philosophy

Updates are non-disruptive by design:
1. New SW installs and enters "waiting" state
2. No `skipWaiting()` — the current SW continues serving
3. When application is idle, prompt user to reload
4. Reload activates the new SW

This prevents data loss during active interactions (drag, edit, form input).

## Long-Term Consequences

**v1.3 (Mobile Experience):** No SW changes needed. Touch gestures, navigation, safe areas are application-layer concerns.

**v1.4 (Offline First / IndexedDB):** Storage layer migrates from localStorage to IndexedDB. SW may be extended with BackgroundSyncPlugin for offline mutations. SW architecture does not block this.

**v1.5 (Productivity):** New application features. SW may need new runtime cache routes.

**v2.0 (AI Features):** AI endpoints may need new caching strategies. Cross-origin request handling already supports this.
