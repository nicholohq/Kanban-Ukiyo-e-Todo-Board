# Roadmap

Roadmap items are organized by product version. Status indicators:
- ✓ **Completed**
- 🚧 **In Progress**
- 📝 **Planned**
- ⏸ **Deferred**

---

## v1.1 — Engineering Foundation 🚧

Documentation, workflow, and project infrastructure.

- [✓] Project Philosophy
- [✓] Engineering Principles
- [✓] Architecture Overview
- [✓] Engineering Guide
- [✓] Release Strategy
- [✓] Roadmap
- [✓] Changelog
- [✓] Feature Template
- [✓] Decision Records Index
- [✓] ADR-001: Project Philosophy
- [✓] Milestone 001: Engineering Foundation
- [✓] Milestone 002: PWA Foundation
- [✓] Backlog
- [✓] Session 001 Log

---

## v1.2 — PWA Foundation ✓

Make Ukiyo Kanban installable as a Progressive Web App with offline shell.

- [✓] Web App Manifest
- [✓] App Icons (all required sizes)
- [✓] Service Worker (injectManifest with runtime caching)
- [✓] Install Prompt UI
- [✓] Offline Shell
- [✓] PWA Lighthouse Audit ≥ 90
- [✓] ADR-002: PWA Architecture

---

## v1.3 — Mobile Experience 📝

Touch-first interactions and mobile polish.

- [📝] Touch gesture support (swipe, long-press)
- [📝] Haptic feedback for interactions
- [📝] Mobile-optimized navigation
- [📝] Swipe-to-complete / swipe-to-delete

---

## v1.4 — Offline First 🚧

Full offline capability with robust sync.

- [✓] IndexedDB storage migration (Session 004 — StorageFacade + adapters, ADR-003)
- [📝] Local-first inversion + repository above the facade (Session 006 — see ADR-003)
- [📝] Sync queue for offline mutations
- [📝] Background sync when online
- [📝] Conflict resolution strategy

---

## v1.5 — Productivity 📝

Power user features for daily task management.

- [📝] Notepad (Notes view, named tabs, send to board) — Session 005
- [📝] Quick Add (keyboard shortcut)
- [📝] Smart Views (custom saved filters)
- [📝] Recurring Tasks
- [📝] Calendar / timeline view
- [📝] Task archiving (instead of delete)

---

## v2.0 — Ukiyo AI 📝

AI-powered features for smarter task management.

- [📝] Natural language task input
- [📝] AI task suggestions and prioritization
- [📝] Weekly review summaries
- [📝] Smart categorization
