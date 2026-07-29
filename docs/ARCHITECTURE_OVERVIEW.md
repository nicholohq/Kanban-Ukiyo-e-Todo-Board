# Architecture Overview

> A living document describing the high-level architecture of Ukiyo Kanban. This document evolves as the project grows.

## Current Architecture (v1.2.0)

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
│  │  Login/   │  │  Main    │  │  Storage Abstraction           │    │
│  │  Signup   │  │  App     │  │  src/lib/utils/storage.js      │    │
│  └─────┬─────┘  └────┬─────┘  │  save/load interface           │    │
│        │              │        │  ⟹ localStorage (current)      │    │
│        │     ┌────────┴────────┐│  ⟹ IndexedDB (future v1.4)    │    │
│        │     │   TodoStore     │└──────────────────────────────┘    │
│        │     │   AuthStore     │                                    │
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
| **Single runes store** | One TodoStore class for all task state |
| **JWT in httpOnly cookies** | Secure token approach, prevents XSS theft |
| **Turso edge SQLite** | Low-latency edge database, simple SQL |
| **localStorage fallback** | Offline resilience, no network dependency |
| **No CSS framework** | Hand-written CSS for full aesthetic control |
| **Vercel adapter** | Zero-config deployment, serverless API routes |
| **@vite-pwa/sveltekit (injectManifest)** | Long-term SW maintainability; avoids v1.4 migration |
| **SW independent from Storage** | Service worker caches network resources only; storage layer handles persistence |
| **Schema-based cache versioning** | Cache versions represent structure, not app version |

## Data Flow (Online)

1. User action → UI component → Store method
2. Store updates local state (optimistic)
3. Store debounce-saves to localStorage (300ms)
4. Store fires server API call (fire-and-forget)
5. API route → Turso query → response
6. On failure: toast notification (no rollback)
7. Service Worker caches API GET responses for offline fallback

## Data Flow (Offline)

1. User opens app → Service Worker serves precached app shell
2. App shell JS/CSS loaded from precache
3. TodoStore.init() runs → API call fails (offline)
4. TodoStore falls back to storage abstraction → reads from localStorage
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
| PWA | @vite-pwa/sveltekit + Workbox (injectManifest) |

## Future Architecture Changes

This section will document planned architecture changes as they are approved.
