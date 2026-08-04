# Session 003E

## Date

2026-08-04

## Objectives

- Restore a green Vercel production build by resolving the `@vite-pwa/sveltekit` `swSrc` ENOENT blocker on Vite 8 / Rolldown
- Migrate the PWA service worker strategy from `injectManifest` to `generateSW` (the only viable path absent downgrades/patches/hacks)
- Verify installability (web manifest) and that the generated service worker is the active registered worker
- Preserve the legacy `injectManifest` service worker as a documented fallback for Session 003F

## Root Cause (Confirmed via Vercel Logs)

`@vite-pwa/sveltekit` v1.1.0 hardcodes `swSrc` to `.svelte-kit/output/client/service-worker.js`, which does not exist yet when the SSR `closeBundle` hook runs under Vite 8.1.4 (Rolldown):

```
Error: The 'swSrc' file can't be read. ENOENT: no such file or directory,
open '/vercel/path0/.svelte-kit/output/client/service-worker.js'
  at hook: 'closeBundle'
  at plugin: 'vite-plugin-pwa:sveltekit:build'
```

Failure deployment: `dpl_MeUvwTS65nw7KbZQ48WbFKa92Vs2` (commit `42431b0`).

## Decision

Subagent research confirmed no `swSrc` override, no post-client-build hook, and no upstream fix in the current versions. **`generateSW` was selected** — it lets Workbox build the service worker without requiring the not-yet-built SvelteKit client output. The legacy `src/service-worker.js` (injectManifest) is **preserved** (only comment headers added) so Session 003F can reactivate it if needed.

## Completed Work

### 1. `vite.config.js` — injectManifest → generateSW

- Switched `strategies` to `generateSW`, kept `devOptions {enabled: true, type: 'module'}` and `kit.includeVersionFile`
- Workbox config: `clientsClaim`, `skipWaiting`, `cleanupOutdatedCaches`, `navigateFallback: '/'`
- Runtime caching:
  - `ukiyo-api-v1` — NetworkFirst, 3s timeout, 100 entries, 24h
  - `ukiyo-google-fonts-css-v1` — StaleWhileRevalidate
  - `ukiyo-google-fonts-files-v1` — CacheFirst, 30 entries, 365d
- Manifest additions: `scope: '/'`, `orientation: 'portrait-primary'`, `categories: ['productivity', 'utilities']`

### 2. Legacy files — marked, not deleted

- `src/service-worker.js` and `src/lib/sw/cache-config.js`: LEGACY comment headers added; code untouched. Kept for Session 003F fallback.

### 3. Build fixes (pre-existing compiler errors masked by ENOENT)

- `ContextMenu.svelte`: moved `<svelte:window>` to top level (was inside `{#if}`); replaced `onclick|stopPropagation` / `oncontextmenu|stopPropagation` with explicit `(e) => e.stopPropagation()` handlers
- `TaskCard.svelte`: `onclick|stopPropagation={() => onedit?.(task)}` → explicit handler calling `e.stopPropagation()` then `onedit?.(task)`

### 4. Runtime wiring (SPA mode, `ssr = false`)

The app is SPA-only (`src/routes/+layout.js`: `export const ssr = false`), so registration and the manifest `<link>` are client-injected. `@vite-pwa/sveltekit` removes the plugin's build-time `transformIndexHtml`, so manual wiring was required:

- `svelte.config.js`: `kit.serviceWorker.register: false` — stops SvelteKit from auto-registering the legacy `service-worker.js`
- `src/routes/+layout.svelte`:
  - `onMount`: `await navigator.serviceWorker.register('./sw.js')` before `pwa.init()` so the store's `getRegistration()` snapshot finds the generated worker (plain registration — not `virtual:pwa-register`, to avoid workbox-window auto-reload conflicting with the store's idle-based update lifecycle)
  - `<svelte:head>{@html pwaInfo?.webManifest?.linkTag ?? ''}</svelte:head>` via `virtual:pwa-info` injects the manifest `<link>` at runtime

### 5. Deploys

- Commit `fbc3dec` — migration + build fixes (+63/−10, 5 files)
- Commit `ad624be` — wiring (`svelte.config.js`, `+layout.svelte`)
- Vercel production: `● Ready`, `mode generateSW`, `precache 25 entries`, `Build Completed in /vercel/output [17s]`

## Verification (headless Edge against production)

All 6 runtime checks passed against `https://todo-app-gold-seven.vercel.app/`:

1. Manifest `<link rel="manifest">` present in DOM (client-injected)
2. `manifest.webmanifest` valid: name "Ukiyo Kanban", `display: standalone`, `start_url: /`, 3 icons
3. Active Service Worker registration = `/sw.js` (generateSW output)
4. Legacy `/service-worker.js` NOT registered (SvelteKit auto-registration disabled)
5. `sw.js` served with all generateSW markers: skipWaiting, clientsClaim, `ukiyo-api-v1`, `ukiyo-google-fonts-*`, NavigationRoute
6. No unexpected console errors

Local `npm run build` passes compilation; only the pre-existing Windows Vercel adapter EPERM symlink error remains (Windows-only, does not affect Vercel Linux builds).

## Out of Scope

- `docs/decisions/ADR-002-pwa-architecture.md` — historical record of the original Day-1 decision; left unchanged (superseded in practice by this session)
- Session 003F reactivation of `injectManifest` (legacy files retained for it)
- Workbox v1.4-era features (IndexedDB, sync queue, background sync)

## Next Session

- Session 003F: evaluate whether to reactivate `injectManifest` (legacy `src/service-worker.js` + `cache-config.js` retained) or standardize on `generateSW` and remove the legacy files
