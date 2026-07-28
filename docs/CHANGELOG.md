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
