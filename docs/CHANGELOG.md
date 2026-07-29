# Changelog

All notable changes to this project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

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

- Root README updated with Documentation section

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
