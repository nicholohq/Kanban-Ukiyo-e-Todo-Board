# Architecture Overview

> A living document describing the high-level architecture of Ukiyo Kanban. This document evolves as the project grows.

## Current Architecture (v1.0.0)

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                        │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Login/   │  │  Main    │  │  localStorage       │   │
│  │  Signup   │  │  App     │  │  (offline cache)    │   │
│  └─────┬─────┘  └────┬─────┘  └────────────────────┘   │
│        │              │                                  │
│        │     ┌────────┴────────┐                        │
│        │     │   TodoStore     │                        │
│        │     │   AuthStore     │                        │
│        │     │   ToastStore    │                        │
│        │     └────────┬────────┘                        │
│        │              │  fetch()                        │
├────────┼──────────────┼─────────────────────────────────┤
│        │              │                                 │
│        ▼              ▼                                 │
│  ┌─────────────────────────────────────┐                │
│  │  SvelteKit API Routes               │                │
│  │  (Serverless Functions)             │                │
│  │  /api/auth/*       → auth endpoints │                │
│  │  /api/tasks/*      → CRUD endpoints │                │
│  └──────────┬──────────────────────────┘                │
│             │  @libsql/client                           │
│             ▼                                           │
│  ┌──────────────────────┐                               │
│  │  Turso (Edge SQLite) │                               │
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
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

## Data Flow

1. User action → UI component → Store method
2. Store updates local state (optimistic)
3. Store debounce-saves to localStorage (300ms)
4. Store fires server API call (fire-and-forget)
5. API route → Turso query → response
6. On failure: toast notification (no rollback)

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

## Future Architecture Changes

This section will document planned architecture changes as they are approved.
