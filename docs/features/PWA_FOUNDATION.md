# Feature: PWA Foundation

## Overview

Make Ukiyo Kanban installable as a Progressive Web App with offline shell caching, a non-disruptive update experience, and platform-specific install flows.

## Motivation

The project's engineering principles mandate Offline First (Principle 1) and Mobile First (Principle 2). The app already has localStorage fallback for data, but the app shell itself requires network access to load. PWA support completes the offline picture and enables installation as a first-class app.

## User Story

As a user, I want to install Ukiyo Kanban on my device so that it opens without browser chrome and works even when I have no internet connection.

## Acceptance Criteria

- [ ] App installs on Chrome desktop via custom install prompt
- [ ] App installs on Android Chrome via custom install prompt
- [ ] iOS instructions shown when install is requested on Safari
- [ ] App shell loads from cache without network access
- [ ] Existing offline task workflow continues to function
- [ ] Update notifications are non-disruptive (respect idle state)
- [ ] Lighthouse PWA score ≥ 90
- [ ] No regressions in authentication
- [ ] No regressions in task CRUD or drag-and-drop

## Architecture

### Layer Separation

```
Browser
    ↓
Service Worker (network caching)
    - Precaches app shell and static assets
    - Runtime caches fonts and API responses
    - Has NO knowledge of application data storage
    ↓
Application Layer (Svelte components, stores, API calls)
    ↓
Storage Abstraction (src/lib/utils/storage.js)
    ↓
localStorage (current) → IndexedDB (future v1.4)
```

### Cache Strategy

| Cache | Strategy | Purpose |
|-------|----------|---------|
| ukiyo-shell-v1 | precache (cache-first) | App shell: /, /login |
| ukiyo-static-v1 | precache (cache-first) | Vite JS/CSS (content-hashed) |
| ukiyo-api-v1 | NetworkFirst (timeout: 3s) | API GET responses |
| ukiyo-google-fonts-css-v1 | StaleWhileRevalidate | Google Fonts stylesheet |
| ukiyo-google-fonts-files-v1 | CacheFirst | Font files (max 30, 365 days) |

### Update Strategy

Updates activate when the application is idle:
- No active drag (kanban drag-and-drop)
- No focused input/textarea
- No open dialog
- No pointer event within 1000ms
- Or user taps "Refresh now" in toast

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PWA Plugin | @vite-pwa/sveltekit | Long-term maintenance, injectManifest migration path |
| SW Strategy | injectManifest (Day 1) | Avoid known migration at v1.4; minimal complexity delta |
| Cache Versioning | schema versioned | Cache versions represent structure, not app version |
| Update Strategy | idle-aware | Non-disruptive; respects UX Before Feature Count |
| Storage | localStorage (unchanged) | Deferred to v1.4; SW and Storage are independent layers |

## Future Extensions

| Milestone | Extension | Impact |
|-----------|-----------|--------|
| v1.4 | IndexedDB + sync queue | Extend SW with BackgroundSyncPlugin |
| v1.4 | Background sync | SW handles sync events |
| v2.0 | AI asset caching | New runtime cache route for AI endpoints |

## Known Limitations

- iOS: No programmatic install prompt (user must use Share → Add to Home Screen)
- iOS: No push notifications, no background sync
- Firefox: No install prompt (user must use Menu → Install)
- Safari desktop: Limited service worker support
- Google Fonts: Cached on first load (cannot be precached due to external origin)
- Vite 8: Known build-ordering issue with injectManifest (#101); requires workaround if encountered
