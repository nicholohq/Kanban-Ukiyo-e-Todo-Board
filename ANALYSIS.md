# 浮世 Kanban — Ukiyo-e Todo Board

**Complete Codebase Analysis**

*Reverse-engineered for AI-assisted development. This document is the single source of truth for understanding the project without access to the source code.*

---

# Executive Summary

## What This Project Is

A full-featured kanban-style todo board application with a Japanese woodblock-print (*ukiyo-e*) aesthetic. Users can create, edit, delete, filter, search, and reorder tasks across a drag-and-drop Kanban board or a grouped list view. Tasks are persisted to a cloud edge-SQLite database (Turso) with localStorage fallback for offline resilience.

## What Problem It Solves

Provides a visually distinctive, fully offline-capable task management tool with multi-column Kanban workflow (To Do / In Progress / Done), authentication, and cloud sync — designed as a portfolio piece and demonstration of SvelteKit + Svelte 5 runes capabilities.

## Target Users

- **Primary**: Portfolio evaluators (recruiters, clients of Nicholo Dela Rosa)
- **Secondary**: Users who want a simple, aesthetic kanban board with search/filter capabilities

## Current Development Stage

**Production-deployed, feature-complete MVP.** The application is live at `ukiyo-tanban.vercel.app`. Core features are stable: authentication (JWT + bcryptjs), CRUD on tasks, drag-and-drop reordering, dual-view (board/list), search, multi-dimensional filtering, offline localStorage persistence, responsive layout, and accessibility essentials.

## Overall Vision

A portfolio piece demonstrating modern SvelteKit development with Svelte 5 runes, edge database integration, and Japanese aesthetic design. Not intended as a commercial product — MIT licensed, sample/portfolio project.

---

# High Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                        │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Login/   │  │  Main    │  │  localStorage       │   │
│  │  Signup   │  │  App     │  │  (offline cache)    │   │
│  │  Page     │  │  Page    │  │                     │   │
│  └─────┬─────┘  └────┬─────┘  └────────────────────┘   │
│        │              │   Svelte 5 runes state           │
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
│  │  SvelteKit API Routes (Server-side) │               │
│  │                                     │                │
│  │  /api/auth/login     → POST         │                │
│  │  /api/auth/signup    → POST         │                │
│  │  /api/auth/logout    → POST         │                │
│  │  /api/auth/me        → GET          │                │
│  │  /api/tasks          → GET, POST    │                │
│  │  /api/tasks/:id      → PATCH, DELETE│                │
│  │  /api/tasks/reorder  → PUT          │                │
│  └──────────┬──────────────────────────┘                │
│             │  @libsql/client                           │
│             ▼                                           │
│  ┌──────────────────────┐                               │
│  │  Turso (Edge SQLite) │                               │
│  │  AWS ap-northeast-1  │                               │
│  │  libsql://ukiyo-     │                               │
│  │  kanban-....turso.io │                               │
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **SPA mode** (`ssr = false`) | Todo boards are inherently interactive; SSR adds complexity without benefit. All rendering is client-side. |
| **Svelte 5 runes** | Modern Svelte reactivity model ($state, $derived, $effect) replaces legacy stores. Provides fine-grained reactivity. |
| **Single runes store** (`TodoStore`) | One class holds all task state, filters, view mode, and CRUD — simpler than multiple stores. Derived values provide projections. |
| **JWT in httpOnly cookies** | Standard secure token approach. httpOnly prevents XSS token theft. SameSite=lax for CSRF protection. |
| **Turso edge SQLite** | Low-latency edge-hosted SQLite via libSQL protocol. Chosen for simplicity over Postgres (no connection pooling needed for a todo app). |
| **localStorage fallback** | When server is unreachable, app continues working with cached data. First-time users get seed data. |
| **No CSS framework** | Hand-written CSS with custom properties gives full control over the ukiyo-e aesthetic without framework overhead. |
| **Vercel adapter** | Zero-config deployment. Serverless functions host the SvelteKit API routes alongside the static SPA. |

---

# Folder Structure

```
todo-app/
├── .env                          # Turso DB URL, auth token, JWT secret (LIVE credentials)
├── .env.local                    # Auto-generated Vercel OIDC token (do not commit)
├── .gitignore
├── .npmrc                        # engine-strict=true
├── jsconfig.json                 # Extends .svelte-kit/tsconfig.json, allows JS with bundler module resolution
├── package.json                  # Project metadata, scripts, dependencies
├── vite.config.js                # Vite config with SvelteKit + Vercel adapter
├── README.md                     # Project documentation
│
├── .github/
│   └── workflows/                # Empty — no CI workflows configured
│
├── .vercel/                      # Vercel project link metadata (auto-generated)
│   ├── README.txt
│   ├── repo.json                 # Contains project ID: prj_S9mIvazskLsV0Y6pxH2ssXgw07n9
│   ├── output/                   # Build output
│   └── ...
│
├── .vscode/
│   └── extensions.json           # Recommends svelte.svelte-vscode
│
├── build/                        # Static build output (SPA)
│   ├── index.html
│   ├── favicon.svg
│   ├── robots.txt
│   ├── .nojekyll
│   └── _app/immutable/           # Bundled JS/CSS assets
│
├── node_modules/                 # Dependencies
│
├── static/                       # Static assets served at root
│   ├── favicon.svg               # Sakura blossom SVG icon
│   ├── robots.txt                # Allow all crawlers
│   └── .nojekyll                 # GitHub Pages compatibility
│
├── src/                          # Application source code
│   ├── app.html                  # SPA shell with Google Fonts preconnect
│   ├── app.css                   # Design system (CSS variables, reset, utilities)
│   ├── hooks.server.js           # Server hooks: auto-migration + JWT validation
│   │
│   ├── lib/
│   │   ├── index.js              # Placeholder (SvelteKit $lib alias)
│   │   │
│   │   ├── assets/
│   │   │   └── favicon.svg       # Svelte logo (unused duplicate — app.html uses /favicon.svg)
│   │   │
│   │   ├── server/               # Server-only code (never imported client-side)
│   │   │   ├── auth.js           # bcryptjs hashing + JWT sign/verify
│   │   │   ├── db.js             # Turso client singleton (lazy init)
│   │   │   ├── id.js             # UUID v4 generator (crypto.randomUUID)
│   │   │   ├── migrate.js        # Schema auto-migration on startup
│   │   │   └── schema.sql        # Raw SQL schema (reference — inline in migrate.js)
│   │   │
│   │   ├── stores/               # Runes-based state management
│   │   │   ├── auth.svelte.js    # Auth state (user, login/signup/logout/check)
│   │   │   ├── toasts.svelte.js  # Toast notification store (also aria-live channel)
│   │   │   └── todoStore.svelte.js  # Central task store (CRUD, filters, drag-drop, persistence)
│   │   │
│   │   ├── utils/                # Client-side utility functions
│   │   │   ├── api.js            # Fetch wrappers for REST endpoints
│   │   │   ├── dates.js          # Due-date formatting & overdue detection
│   │   │   ├── filters.js        # Pure filter/search helpers
│   │   │   ├── seedData.js       # Sample tasks for first-launch demo
│   │   │   └── storage.js        # localStorage persistence with versioning
│   │   │
│   │   └── components/           # Svelte UI components (19 total)
│   │       ├── Header.svelte
│   │       ├── Sidebar.svelte
│   │       ├── Toast.svelte
│   │       ├── Loader.svelte
│   │       ├── Modal.svelte
│   │       ├── ConfirmDialog.svelte
│   │       ├── AddTaskForm.svelte
│   │       ├── EditTaskModal.svelte
│   │       ├── TaskForm.svelte
│   │       ├── ViewToggle.svelte
│   │       ├── KanbanBoard.svelte
│   │       ├── KanbanColumn.svelte
│   │       ├── TaskCard.svelte
│   │       ├── TaskList.svelte
│   │       ├── TaskRow.svelte
│   │       ├── CategoryFilter.svelte
│   │       ├── PriorityFilter.svelte
│   │       ├── TagFilter.svelte
│   │       └── EmptyState.svelte
│   │
│   └── routes/                   # SvelteKit routes (pages + API)
│       ├── +layout.js            # Layout config: ssr = false (SPA mode)
│       ├── +layout.svelte        # Root layout: imports app.css, initializes auth
│       ├── +page.svelte          # Main app page (auth-guarded, Kanban or List view)
│       │
│       ├── login/
│       │   └── +page.svelte      # Login/Signup page
│       │
│       └── api/
│           ├── auth/
│           │   ├── login/+server.js     # POST: authenticate user
│           │   ├── signup/+server.js    # POST: create user
│           │   ├── logout/+server.js    # POST: clear session cookie
│           │   └── me/+server.js        # GET: current user info
│           │
│           └── tasks/
│               ├── +server.js           # GET: list tasks, POST: create task
│               ├── [id]/+server.js      # PATCH: update task, DELETE: remove task
│               └── reorder/+server.js   # PUT: reorder tasks within a column
│
└── .svelte-kit/                  # Generated SvelteKit scaffolding (do not edit)
    ├── tsconfig.json
    ├── ambient.d.ts
    ├── generated/
    ├── output/
    └── vercel-tmp/
```

---

# Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Language** | JavaScript (ESM) | — | Plain JS with JSDoc type annotations. No TypeScript compilation step. |
| **Runtime** | Node.js | 20+ (required) | Server-side execution |
| **Framework** | SvelteKit | 2.63.0 | Full-stack web framework (routing, SSR/SPA, API endpoints) |
| **UI Library** | Svelte | 5.56.1 | Reactive UI components with runes API |
| **Build Tool** | Vite | 8.0.16 | Dev server and production bundler |
| **Database** | Turso (libSQL) | — | Edge-hosted SQLite via `@libsql/client` |
| **Auth** | bcryptjs | 3.0.3 | Password hashing (synchronous) |
| **Auth** | jsonwebtoken | 9.0.3 | JWT creation and verification |
| **Drag & Drop** | svelte-dnd-action | 0.9.70 | Lightweight drag-and-drop for Svelte |
| **Hosting** | Vercel | — | Adapter: `@sveltejs/adapter-vercel` |
| **CSS** | Hand-written | — | CSS custom properties, no framework |
| **Fonts** | Noto Serif JP | — | Google Font — serif headings |
| **Fonts** | Zen Kaku Gothic New | — | Google Font — sans-serif body |
| **Icons** | Unicode/emoji | — | No icon library; uses symbols (☰, ✎, 🗑, ＋, ×, etc.) |
| **Animations** | Svelte built-in | — | `svelte/transition` (fly, fade, scale), `svelte/animate` (flip) |

## Why Each Technology

- **SvelteKit 2 + Svelte 5**: Portfolio showcase of modern Svelte capabilities (runes, snippets, $effect, $derived). The developer chose the newest version intentionally.
- **Plain JavaScript with JSDoc**: Deliberate choice to avoid TypeScript compilation complexity while still getting type hints in editors. The `jsconfig.json` is configured for bundler module resolution.
- **Turso (libSQL)**: Edge-hosted SQLite offers lower latency than traditional databases for a global audience. No connection pooling or ORM overhead. Simple SQL for a simple schema.
- **bcryptjs (sync)**: Database operations are already async (Turso), so the sync bcrypt calls don't block the event loop significantly. Simpler than async bcrypt.
- **@sveltejs/adapter-vercel**: Direct deployment to Vercel with minimal configuration. API routes become serverless functions.
- **svelte-dnd-action**: Minimal drag-and-drop library that works as a Svelte `use:` action. No wrapper components needed.
- **Hand-written CSS**: The ukiyo-e aesthetic requires specific visual choices (4px borders, offset shadows) that CSS frameworks would fight against.

---

# Application Flow

## Startup Sequence

1. **Server process starts** (Vercel serverless function or local Vite dev server)
2. **`hooks.server.js` runs module-level code**: if `TURSO_DB_URL` is set, calls `migrate()` to create tables/indexes
3. **Client loads `app.html`**: Google Fonts preconnect, SvelteKit bootstrap JS loads
4. **`+layout.svelte` mounts**: imports `app.css` (design system), calls `auth.check()` in `onMount`
5. **User arrives at `/`** (or is redirected from `/login`):
   - `+page.svelte` checks `auth.user` — if not authenticated, `goto('/login')`
   - If authenticated, calls `todoStore.init()` to fetch tasks from API
   - Shows `Loader` component during initialization (minimum 450ms, reduced motion respected)
   - Once `ready`, renders the main app layout

## Routing

```
/login           → Login/Signup page (unauthenticated)
/                → Main app page (auth-guarded, SPA)
/api/auth/login  → POST: authenticate
/api/auth/signup → POST: register
/api/auth/logout → POST: logout
/api/auth/me     → GET: current user
/api/tasks       → GET: list tasks, POST: create task
/api/tasks/:id   → PATCH: update, DELETE: remove
/api/tasks/reorder → PUT: reorder column
```

The app runs as an **SPA** (`ssr = false`). All routing happens client-side except API calls.

## Authentication Flow

```
Login/Signup
│
├─ Signup: POST /api/auth/signup
│   ├─ Validate username + password (min 6 chars)
│   ├─ Check username uniqueness
│   ├─ Hash password (bcryptjs, 10 rounds)
│   ├─ Insert user into Turso
│   ├─ Create JWT (7d expiry)
│   └─ Set httpOnly session cookie
│
├─ Login: POST /api/auth/login
│   ├─ Look up username in Turso
│   ├─ Compare password hash
│   ├─ Create JWT (7d expiry)
│   └─ Set httpOnly session cookie
│
├─ GET /api/auth/me (called on every page load)
│   └─ Read session cookie, verify JWT, return user
│
└─ POST /api/auth/logout
    └─ Delete session cookie
```

## Main App Flow

```
User is authenticated
│
├─ Header
│   ├─ Brand logo + task count
│   ├─ Search bar (debounced 250ms, Ctrl+K focus shortcut)
│   ├─ View toggle (Board / List)
│   └─ New task button
│
├─ Sidebar (filters)
│   ├─ Category filter (checkboxes with counts)
│   ├─ Priority filter (checkboxes with counts)
│   ├─ Tag filter (pill buttons with counts)
│   └─ Clear all filters button
│
├─ Main Content
│   ├─ Board view (default)
│   │   ├─ 3 columns: To Do / In Progress / Done
│   │   └─ Drag-and-drop cards between columns
│   │
│   └─ List view
│       ├─ Grouped by status
│       ├─ Expandable descriptions
│       └─ Checkbox toggle complete/incomplete
│
├─ AddTaskForm (modal)
│   └─ TaskForm with title, description, priority, category, due date, tags
│
├─ EditTaskModal (modal)
│   └─ TaskForm pre-filled with existing data
│
├─ ConfirmDialog (modal)
│   └─ Delete confirmation
│
└─ Toast notifications (bottom-right)
```

## Data Flow for Task Operations

### CREATE task

```
1. User fills TaskForm, clicks submit
2. TodoStore.addTask(input)
   ├─ Validate title (required, no duplicate)
   ├─ Create Task object with defaults + ID
   ├─ this.tasks = [task, ...this.tasks] (optimistic update)
   ├─ this.#scheduleSave(snapshot) → localStorage (300ms debounce)
   ├─ createTask(task) → POST /api/tasks
   └─ On error: toast "Failed to save task to server."
```

### UPDATE task

```
1. User edits task in EditTaskModal, clicks Save
2. TodoStore.updateTask(id, patch)
   ├─ Check duplicate title if changing title
   ├─ Map over tasks, update matching id
   ├─ Optimistic local update
   ├─ apiUpdateTask(id, patch) → PATCH /api/tasks/:id
   └─ On error: toast "Failed to sync update to server."
```

### DELETE task

```
1. User clicks Delete, confirm via ConfirmDialog
2. TodoStore.deleteTask(id)
   ├─ Filter out task from this.tasks
   ├─ apiDeleteTask(id) → DELETE /api/tasks/:id
   └─ On error: toast "Failed to sync deletion to server."
```

### DRAG & DROP (Kanban)

```
1. User starts dragging a card in KanbanColumn
2. svelte-dnd-action handles drag visuals (via svelte-dnd-action)
3. handleConsider fires on drag start: sets dragging=true, syncs items from event
4. handleFinalize fires on drop:
   ├─ Gets ordered IDs from event
   ├─ TodoStore.setColumn(status, orderedIds)
   │   ├─ Rebuilds tasks array with new column order + status
   │   └─ reorderTasks(status, orderedIds) → PUT /api/tasks/reorder
   └─ On error: toast "Failed to sync reorder to server."
```

## Offline / Init Flow

```
TodoStore.init()
├─ Try fetchTasks() → GET /api/tasks
│   ├─ Success → this.tasks = server data
│   └─ Failure → fall back to localStorage
│       ├─ Has persisted data → load it
│       └─ No persisted data → generate seed tasks
```

---

# Features

## 1. User Authentication

**Purpose**: Secure access to tasks with username/password accounts.

**Files**: 
- `src/lib/server/auth.js` — bcryptjs hash + JWT helpers
- `src/lib/stores/auth.svelte.js` — AuthStore class with check/login/signup/logout
- `src/routes/api/auth/login/+server.js` — POST login endpoint
- `src/routes/api/auth/signup/+server.js` — POST signup endpoint
- `src/routes/api/auth/logout/+server.js` — POST logout endpoint
- `src/routes/api/auth/me/+server.js` — GET current user endpoint
- `src/routes/login/+page.svelte` — Login/Signup UI
- `src/hooks.server.js` — JWT session validation on every request

**Flow**: See Authentication Flow above.

**Known limitations**:
- No password reset flow
- No email verification
- No rate limiting on login attempts
- No test mode / demo accounts
- No token refresh mechanism

## 2. Kanban Board (Board View)

**Purpose**: Visual task management with drag-and-drop across three columns.

**Files**:
- `KanbanBoard.svelte` — 3-column grid layout, delegates to KanbanColumn
- `KanbanColumn.svelte` — Single column with svelte-dnd-action, handles drag events
- `TaskCard.svelte` — Card display with priority dot, description, category chip, due date, tags

**How it works**:
- `TodoStore.board` is a `$derived` that groups `filteredTasks` by status
- Each column receives its status + task array
- `svelte-dnd-action` is applied to the column body via `use:dndzone`
- Drag events update a local `items` array during drag
- On finalize, `TodoStore.setColumn()` rebuilds the global task array and syncs to server
- Column counts, empty state "Drop tasks here", overdue indicators

**Limitations**:
- No infinite scroll for long columns
- No card archiving (only delete)
- No swimlanes or sub-columns

## 3. List View

**Purpose**: Tabular task list grouped by status with expandable descriptions.

**Files**:
- `TaskList.svelte` — Groups filtered tasks by status, renders TaskRow
- `TaskRow.svelte` — Expandable row with checkbox, meta badges, edit/delete buttons

**How it works**:
- Filtered tasks are bucketed by status into `grouped` derived
- Each group has a header with status name + count
- Rows show title (expandable if description exists), priority badge, category badge, tag chips, due date
- Checkbox toggles done/todo via `TodoStore.toggleDone()`
- Inline expand/collapse for descriptions (slide transition)

## 4. Search

**Purpose**: Full-text search across task titles and descriptions.

**Files**:
- `Header.svelte` — Search input with debounced store updates
- `filters.js` — `filterTasks()` applies search as substring match

**How it works**:
- Search input in Header bind to local `q` state (not store directly)
- `$effect` debounces writes to store at 250ms
- Second `$effect` syncs store changes back to input (e.g., when "Clear filters" is clicked)
- `Ctrl+K` or `Cmd+K` focuses the search input
- Search is case-insensitive, matches against `title + " " + description`

## 5. Multi-Dimensional Filtering

**Purpose**: Filter tasks by category, priority, and tags simultaneously.

**Files**:
- `Sidebar.svelte` — Container for filter groups + clear button
- `CategoryFilter.svelte` — Checkbox list for categories (work/personal/study/other) with counts
- `PriorityFilter.svelte` — Checkbox list for priorities (low/medium/high) with priority dots + counts
- `TagFilter.svelte` — Toggle pill buttons for tags with counts
- `filters.js` — `filterTasks()`, `countBy()`, `collectTags()`, `emptyFilters()`, `isFilterActive()`

**How it works**:
- Filters live in `TodoStore.filters` as `{ search, categories, priorities, tags }`
- Each dimension uses AND logic across dimensions, OR within a dimension
- Counts are derived: `categoryCounts`, `priorityCounts`, `tagCounts` from `countBy()`
- "Clear all filters" button is disabled when no filters are active
- On mobile, sidebar becomes a drawer with backdrop overlay

## 6. Drag & Drop (Kanban Columns)

**Purpose**: Reorder tasks within and across columns by dragging.

**Files**:
- `KanbanColumn.svelte` — `svelte-dnd-action` integration
- `TodoStore.setColumn()` — State manipulation for reorder
- `api/reorder/+server.js` — PUT endpoint with transaction

**How it works**:
- `svelte-dnd-action` mutates a local `items` array during drag
- `on:consider` sets `dragging = true` to prevent store resync from clobbering drag state
- `on:finalize` commits via `TodoStore.setColumn(status, orderedIds)`
- Server sync: UPDATE each task's status + position inside a transaction

## 7. Cloud Sync + Offline Persistence

**Purpose**: Tasks persist to Turso with localStorage as fallback.

**Files**:
- `storage.js` — Versioned localStorage persistence
- `TodoStore` constructor — `$effect.root()` watches state changes, saves to localStorage
- `TodoStore.init()` — Fetches from server, falls back to localStorage, then seed data

**How it works**:
- Every state change triggers `#scheduleSave(snapshot)` (300ms debounce)
- `saveState()` writes versioned JSON to localStorage key `ukiyo-kanban`
- If quota exceeded, shows toast error
- On init, if server fetch fails, loads from localStorage or generates seed tasks

## 8. Seed Data

**Purpose**: Demo tasks on first launch (no account or no saved state).

**Files**:
- `seedData.js` — `createSeedTasks()` generates 7 Japanese/portfolio-themed tasks

**How it works**:
- Called when `TodoStore.init()` has no server data and no localStorage data
- Tasks have realistic titles, descriptions, priorities, categories, tags, and relative due dates
- Content is themed: "Sketch the seigaiha wave pattern", "Study 20 new kanji", "Brew a pot of sencha"

## 9. Responsive Design

**Breakpoints**:
- Desktop: 3-column grid, static sidebar, full header
- 768px: Single column board, sidebar becomes drawer, hamburger menu appears, search moves below brand
- 520px: Tighter padding, stacked form controls, full-width buttons

**Files**: All component `<style>` blocks with `@media` queries.

## 10. Accessibility

**Features**:
- `aria-live` region on Toast container for screen reader announcements
- Keyboard-navigable modals with focus trapping (Tab/Shift+Tab cycling)
- `Escape` closes modals and sidebar
- `prefers-reduced-motion` disables all animations
- `:focus-visible` ring (gold color)
- `aria-label` on all icon-only buttons
- `role="status"` on loader and toasts
- `aria-expanded` on expandable task rows
- `aria-pressed` on view toggle buttons
- Visually-hidden utility class

---

# Components

## Modal.svelte

**Purpose**: Generic modal dialog wrapper with backdrop, focus trap, and escape key handling.

**Props**: `open` (bindable), `title`, `onclose`, `children` (Snippet)

**Behavior**:
- Backdrop click closes
- `Escape` key closes
- Focus trap (Tab cycling within modal)
- Saves and restores previously focused element
- Body scroll lock while open
- Animations: backdrop fade, modal scale

## TaskForm.svelte

**Purpose**: Reusable form for creating and editing tasks.

**Props**: `initial` (existing task data for edit), `submitLabel`, `onsubmit`, `oncancel`, `ondelete`, `isDuplicate`

**Fields**:
- Title (required, max 120 chars, duplicate check)
- Description (max 600 chars)
- Priority (select: low/medium/high)
- Category (select: work/personal/study/other)
- Due date (date input)
- Tags (inline chip input: type + Enter/Comma, backspace to remove last)

**Validation**:
- Title required
- Duplicate title check (via isDuplicate callback)
- Tags normalized to lowercase, trimmed, deduplicated

## AddTaskForm.svelte

Wrapper around Modal + TaskForm for new task creation. Calls `todoStore.addTask()`.

## EditTaskModal.svelte

Wrapper around Modal + TaskForm for editing. Passes `initial` and `onrequestdelete`. Calls `todoStore.updateTask()`.

## ConfirmDialog.svelte

**Purpose**: Generic delete/action confirmation dialog.

**Props**: `open`, `title`, `message`, `confirmLabel`, `onconfirm`, `oncancel`

## Header.svelte

**Props**: `onnew`, `ontogglesidebar`

**Features**:
- Brand logo (kanji "浮世") + title + subtitle showing "X of Y tasks"
- Search bar with debounce, clear button, Ctrl+K focus shortcut
- ViewToggle component
- New task button
- Sticky header with indigo background
- Hamburger button visible only on mobile

## Sidebar.svelte

**Props**: `open`, `onclose`

**Features**:
- Contains CategoryFilter, PriorityFilter, TagFilter
- "Clear all filters" button (disabled when no active filters)
- Desktop: static left sidebar with sticky positioning
- Mobile: slide-in drawer with backdrop overlay, body scroll lock

## KanbanBoard.svelte

**Props**: `onedit`, `onnew`

Renders a 3-column grid of KanbanColumn components. Shows EmptyState when filters produce no results.

## KanbanColumn.svelte

**Props**: `status`, `tasks`, `onedit`

**Features**:
- Styled header with kanji character (未/進/済), column name, item count
- `svelte-dnd-action` applied to card container
- Drag state management (local `items` array, `dragging` flag to prevent store clobber)
- Empty state: "Drop tasks here" dashed placeholder
- Max height with scroll on desktop

## TaskCard.svelte

**Props**: `task`, `onedit`

**Features**:
- Priority color dot
- Title (2-line clamp with ellipsis)
- Description (2-line clamp)
- Category chip (gold border)
- Due date badge with overdue detection (red when overdue)
- Tag count badge
- Done state: muted opacity, line-through title
- Edit button (pencil icon)

## TaskList.svelte

**Props**: `onedit`, `ondelete`, `onnew`

Groups filtered tasks by status. Shows EmptyState when no tasks (with CTA button for first-time) or when filters produce no results.

## TaskRow.svelte

**Props**: `task`, `onedit`, `ondelete`

**Features**:
- Checkbox to toggle done/todo
- Title (truncated, expandable if description exists)
- Priority badge with dot + color
- Category badge
- Tag chips
- Due date with overdue flag
- Expandable description (slide animation)
- Edit + Delete icon buttons

## CategoryFilter.svelte / PriorityFilter.svelte / TagFilter.svelte

**Props**: None — all use `todoStore` directly

**Features**:
- CategoryFilter: 4 checkboxes (work/personal/study/other) with counts
- PriorityFilter: 3 checkboxes (low/medium/high) with color dots and counts
- TagFilter: Toggle pill buttons, dynamically generated from `todoStore.availableTags`
- "No tags yet." empty state in TagFilter

## ViewToggle.svelte

Toggle between Board (▦) and List (☰) views. Uses `aria-pressed` for selected state.

## Toast.svelte

**Features**:
- Fixed bottom-right position
- Stacking notifications
- Types: success (matcha left border), error (vermilion), info (indigo)
- Kanji markers (✓/!/｢)
- Auto-dismiss (3s default, 5s for errors)
- Manual dismiss via × button
- `role="status" aria-live="polite"` for screen readers
- Fly-in / fade-out transitions

## Loader.svelte

**Features**:
- Full-screen indigo overlay
- Spinning ring + pulsing kanji character ("世")
- Bilingual loading text ("読み込み中 · Loading")
- Fade-out transition

## EmptyState.svelte

**Props**: `kanji`, `title`, `message`, `children` (Snippet)

**Features**:
- Large kanji character in a circular container
- Title + message text
- Optional action slot (e.g., "New task" button)

---

# Services

## Server-Side Services

### auth.js (`src/lib/server/auth.js`)

**Purpose**: Password hashing and JWT management.

```javascript
hashPassword(password)  → string hash
verifyPassword(password, hash) → boolean
createToken(user)  → JWT string (7 day expiry)
verifyToken(token) → decoded payload or null
```

- Uses `bcryptjs` (sync) with 10 salt rounds
- Uses `jsonwebtoken` for JWT
- Secret from `JWT_SECRET` env var
- Token payload: `{ userId, username }`

### db.js (`src/lib/server/db.js`)

**Purpose**: Singleton Turso client factory.

```javascript
getDb() → @libsql/client instance
```

- Lazy initialization: creates client on first call
- Uses `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` env vars
- Throws if `TURSO_DB_URL` is missing

### id.js (`src/lib/server/id.js`)

```javascript
makeId() → UUID v4 string (crypto.randomUUID)
```

### migrate.js (`src/lib/server/migrate.js`)

**Purpose**: Auto-create database schema on server startup.

- Called from `hooks.server.js` at module level
- Creates `users` and `tasks` tables + indexes if not exist
- Uses `db.executeMultiple()` to run all DDL in one call
- Only runs if `TURSO_DB_URL` is set (safe for non-database environments)

## Client-Side Services

### api.js (`src/lib/utils/api.js`)

**Purpose**: Thin fetch wrappers for all REST endpoints.

```javascript
fetchTasks()         → GET  /api/tasks → Task[]
createTask(task)     → POST /api/tasks → Task
updateTask(id, patch)→ PATCH /api/tasks/:id → Task
deleteTask(id)       → DELETE /api/tasks/:id → undefined
reorderTasks(col, ids)→ PUT /api/tasks/reorder → undefined
```

- All throw on non-ok responses
- JSON content type

### storage.js (`src/lib/utils/storage.js`)

**Purpose**: Versioned localStorage persistence.

```javascript
loadState() → { tasks, filters, view } | null
saveState(state) → { ok: true } | { ok: false, reason: 'quota'|'unavailable'|'error' }
clearState() → void
```

- Storage key: `ukiyo-kanban`
- Version: 1 (with migration function for future schema changes)
- Handles: unavailable storage, JSON parse errors, version mismatch, quota exceeded

### filters.js (`src/lib/utils/filters.js`)

**Purpose**: Pure functions for filtering and counting.

**Key functions**:
- `emptyFilters()` — Returns default filter state (no filters active)
- `isFilterActive(filters)` — Boolean check
- `filterTasks(tasks, filters)` — AND across dimensions (search, categories, priorities, tags), OR within tags dimension
- `countBy(tasks, field)` — Counts values per field (supports arrays like tags)
- `collectTags(tasks)` — Unique sorted tag list

### dates.js (`src/lib/utils/dates.js`)

**Purpose**: Date formatting and overdue logic.

```javascript
formatDueDate(iso) → "Jul 9" (short month + day)
isOverdue(iso, status) → boolean (if past due and not done)
daysUntil(iso) → number | null (negative = past)
dueRelative(iso) → "Today" | "Tomorrow" | "3d overdue" | "in 5d" | ""
```

- All functions handle null/empty/NaN gracefully
- Timezone naive — compares dates as yyyy-mm-dd (midnight UTC)

### seedData.js (`src/lib/utils/seedData.js`)

**Purpose**: Generates 7 demo tasks with relative dates.

- Called when no persisted state exists
- Content is Japanese/portfolio themed
- Dates computed relative to load time (Due today, tomorrow, +2d, +4d, +30d)
- Includes mix of statuses: 3 todo, 2 in-progress, 2 done
- IDs generated by store's `makeId()` function

---

# Database

## Schema (Turso / SQLite)

### `users` Table

```sql
CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    username     TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at   INTEGER NOT NULL
);
```

### `tasks` Table

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    title        TEXT NOT NULL,
    description  TEXT DEFAULT '' NOT NULL,
    priority     TEXT NOT NULL DEFAULT 'medium',    -- low, medium, high
    category     TEXT NOT NULL DEFAULT 'work',       -- work, personal, study, other
    tags         TEXT DEFAULT '[]' NOT NULL,         -- JSON array string
    due_date     TEXT,                               -- yyyy-mm-dd
    status       TEXT NOT NULL DEFAULT 'todo',       -- todo, in-progress, done
    position     INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,                   -- epoch ms
    updated_at   INTEGER NOT NULL                    -- epoch ms
);
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
```

### Key Design Decisions

- **`id` is TEXT (UUID)**: Generated client-side via `crypto.randomUUID()`. Allows offline task creation without coordination.
- **`tags` is JSON string**: SQLite stores JSON arrays as text. The `rowToTask()` helper parses them.
- **`due_date` is TEXT**: ISO date string (yyyy-mm-dd) without time component. Simpler than storing timestamps for date-only data.
- **`position` is INTEGER**: Stored but not used for ordering in GET (task ordering is positional in the array). The reorder endpoint updates position.
- **`created_at`/`updated_at` are INTEGER epoch ms**: Consistent across server and client.
- **`user_id` is TEXT (UUID)**: Foreign key to users table.
- **No cascade delete**: Tasks are deleted explicitly by user_id + id.
- **Varchar length not specified**: SQLite does not enforce VARCHAR length.
- **No ON DELETE CASCADE**: Tasks remain orphaned if a user is deleted (no user deletion endpoint exists).

## Migration Strategy

- **Auto-migration on startup**: `hooks.server.js` runs `migrate()` at module level if `TURSO_DB_URL` is set
- **Idempotent**: Uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`
- **No rollback**: Schema only moves forward. Additive changes only.
- **No migration tool**: Not using Prisma/Sequelize — raw SQL for simplicity.

## Seed Strategy

- No seed script — seed data is generated client-side in `seedData.js`
- First-time users with no server data and no localStorage get 7 demo tasks

---

# API Documentation

## Authentication

### POST /api/auth/signup

Create a new user account.

**Request Body**:
```json
{ "username": "string", "password": "string" }
```

**Validation**:
- `username`: required
- `password`: required, minimum 6 characters
- Usernames are lowercased
- Duplicate username returns 409

**Response** (201):
```json
{ "id": "uuid", "username": "string" }
```

**Cookies Set**: `session` (httpOnly, sameSite=lax, secure in production, 7d maxAge)

**Errors**: 400 (validation), 409 (duplicate username)

### POST /api/auth/login

Authenticate an existing user.

**Request Body**:
```json
{ "username": "string", "password": "string" }
```

**Response** (200):
```json
{ "id": "uuid", "username": "string" }
```

**Cookies Set**: `session` as above.

**Errors**: 400 (missing fields), 401 (invalid credentials — generic message "Invalid username or password.")

### POST /api/auth/logout

Clear the session cookie.

**Response** (200):
```json
{ "ok": true }
```

### GET /api/auth/me

Get the currently authenticated user.

**Cookie Required**: `session` JWT

**Response** (200):
```json
{ "id": "uuid", "username": "string" }
```

**Errors**: 401 (not authenticated)

## Tasks

All task endpoints require authentication.

### GET /api/tasks

List all tasks for the authenticated user.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "priority": "low|medium|high",
    "category": "work|personal|study|other",
    "tags": ["string"],
    "dueDate": "yyyy-mm-dd|null",
    "status": "todo|in-progress|done",
    "position": 0,
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
]
```

**Ordering**: By `position ASC, created_at DESC`.

**Errors**: 401 (not authenticated)

**Note**: The `rowToTask()` function converts snake_case DB columns to camelCase.

### POST /api/tasks

Create a new task.

**Request Body** (all fields optional except title):
```json
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "category": "work|personal|study|other",
  "tags": ["string"],
  "dueDate": "yyyy-mm-dd|null",
  "status": "todo|in-progress|done"
}
```

**Response** (201): Full task object as above.

**Errors**: 400 (title required), 401 (not authenticated)

### PATCH /api/tasks/:id

Update specific fields of a task.

**Request Body**: Any subset of allowed fields: `title`, `description`, `priority`, `category`, `tags`, `dueDate`, `status`

**Response** (200): Full updated task object.

**Errors**: 400 (no fields to update), 401 (not authenticated), 404 (task not found or not owned)

**Security**: Tasks are scoped by `user_id` — cannot modify another user's tasks.

### DELETE /api/tasks/:id

Delete a task.

**Response** (200): `{ "ok": true }`

**Errors**: 401 (not authenticated), 404 (not found or not owned)

### PUT /api/tasks/reorder

Reorder tasks within a column.

**Request Body**:
```json
{
  "column": "todo|in-progress|done",
  "taskIds": ["uuid1", "uuid2", "..."]
}
```

**Transaction**: Uses `db.transaction('write')` to update all tasks atomically.

**Response** (200): `{ "ok": true }`

**Errors**: 400 (invalid column or taskIds), 401 (not authenticated), 500 (transaction failure)

---

# AI System

There is **no AI system** in this project. The application is a traditional CRUD todo board with no machine learning, LLM integration, or AI features.

---

# Business Logic

## Task Validation Rules

1. **Title must be non-empty** (after trimming whitespace)
2. **Title must not be a duplicate** (case-insensitive, trimmed comparison across all existing tasks)
3. **Title max length**: 120 characters (client-side)
4. **Description max length**: 600 characters (client-side)
5. **Priority defaults to 'medium'** if invalid value provided
6. **Category defaults to 'other'** if invalid value provided
7. **Status defaults to 'todo'** if invalid value provided
8. **Tags are normalized**: lowercased, trimmed, deduplicated; commas split into multiple tags
9. **Due date**: Stored as null if empty string provided
10. **IDs are UUID v4** generated client-side via `crypto.randomUUID()` or fallback

## Business Rules

1. **Users only see their own tasks** — all task queries filter by `user_id`
2. **Tasks have an implicit ordering** — determined by position in the client-side array, synced via `position` field
3. **Done tasks are never overdue** — `isOverdue()` returns false for done tasks regardless of due date
4. **Seed data is generated, not persisted** — each first launch generates fresh relative dates
5. **Offline writes are optimistic** — local state updates immediately, server sync is fire-and-forget with toast on failure
6. **localStorage is the fallback, not the primary store** — server data always takes precedence

## Edge Cases

- **Duplicate title detection** ignores the task being edited (via `exceptId` parameter)
- **Empty tags array** is valid and stored as `[]`
- **Drag-and-drop at same position** still triggers a server sync (no-op optimization not implemented)
- **localStorage quota exceeded** shows a specific toast warning
- **Server unreachable on init** falls back to localStorage, then seed data

---

# State Management

## Architecture

The application uses **Svelte 5 runes** for all state management. Three store classes exist:

### 1. TodoStore (`todoStore.svelte.js`)

The central application store. A singleton class instance exported as `todoStore`.

**Primitive State** ($state):
| Field | Type | Description |
|-------|------|-------------|
| `tasks` | Task[] | All tasks (unfiltered, unsorted) |
| `filters` | Filters | Current filter state |
| `view` | 'board' \| 'list' | Current view mode |
| `saveStatus` | 'idle' \| 'loading' \| 'saving' \| 'saved' \| 'error' | localStorage persistence status |

**Derived State** ($derived):
| Field | Type | Description |
|-------|------|-------------|
| `filteredTasks` | Task[] | Tasks passing all filters |
| `availableTags` | string[] | All unique tags across tasks |
| `categoryCounts` | Record | Category → count |
| `priorityCounts` | Record | Priority → count |
| `tagCounts` | Record | Tag → count |
| `board` | Record<Status, Task[]> | Filtered tasks grouped by status |
| `counts` | { total, filtered, todo, in-progress, done } | Headline counts |

**Persistence**:
- Constructor sets up `$effect.root()` with a nested `$effect` that watches state
- On any state change, debounces 300ms, then writes to localStorage
- Uses `$state.snapshot()` to take a static copy for serialization

### 2. AuthStore (`auth.svelte.js`)

**State**: `user` (object or null), `loading` (boolean)

**Methods**: `check()`, `login()`, `signup()`, `logout()`

All methods communicate with API endpoints. The store exposes `user` and `loading` as `$state` fields.

### 3. ToastStore (`toasts.svelte.js`)

**State**: `items` — array of `{ id, message, type }`

**Methods**: `push()`, `success()`, `error()`, `info()`, `dismiss()`

- Auto-dismiss via `setTimeout` (3s default, 5s for errors)
- Immutable updates (`this.items = [...this.items, newItem]`)
- Incrementing ID counter

## Why Not SvelteKit's $page store?

The app runs as SPA with no SSR, so traditional SvelteKit store patterns (page store, session store) were less relevant. The runes-based class approach allows the TodoStore to encapsulate both state and methods in a single cohesive module.

---

# Authentication & Authorization

## Authentication Method

- **Password hashing**: bcryptjs with 10 salt rounds (synchronous)
- **Session format**: JWT signed with `JWT_SECRET`
- **JWT payload**: `{ userId, username }` with 7-day expiry
- **Cookie**: Named `session`, httpOnly, SameSite=lax, Secure in production, path=/
- **Token verification**: On every request via `hooks.server.js`

## Session Lifecycle

1. Login/Signup → JWT created → httpOnly cookie set with 7d maxAge
2. Each subsequent request → `hooks.server.js` reads cookie, verifies JWT, sets `event.locals.user`
3. Invalid/expired JWT → cookie deleted
4. Logout → cookie deleted

## Authorization

- **API-level**: All task endpoints check `locals.user` and return 401 if absent
- **Data scoping**: All queries include `user_id = ?` to scope data to the authenticated user
- **Page-level**: `+page.svelte` checks `auth.user` in `onMount` and redirects to `/login`
- **No role system**: Single user role (no admin, no permissions)
- **No CSRF token**: Relies on SameSite=lax for basic CSRF protection

## Security Considerations

**Strengths**:
- httpOnly cookie prevents XSS token theft
- SameSite=lax prevents most CSRF
- Password hashing with bcrypt (10 rounds)
- No tokens exposed to client JavaScript
- API scopes queries by user_id (no cross-user data access)

**Weaknesses**:
- No password strength validation beyond min 6 chars
- No rate limiting on login attempts
- No token refresh mechanism (token can't be revoked before 7 days unless cookie is deleted)
- JWT secret stored in environment variable only (no rotation mechanism)
- No request validation middleware beyond presence checks
- No CSP headers configured

---

# Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `TURSO_DB_URL` | Yes | Turso database connection URL (e.g., `libsql://ukiyo-kanban-...turso.io`) |
| `TURSO_AUTH_TOKEN` | No (but needed for cloud DB) | Turso authentication token |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |

These are set in:
- `.env` (local development — contains live credentials!)
- Vercel project dashboard (production)
- The `getSecret()` function in `auth.js` throws if `JWT_SECRET` is missing
- The `getDb()` function in `db.js` throws if `TURSO_DB_URL` is missing

**⚠️ CRITICAL**: The `.env` file in this repository contains **live production credentials** including the Turso auth token and JWT secret. This is a security concern — the `.env` file should not be committed.

---

# Configuration

## vite.config.js

```javascript
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        sveltekit({
            compilerOptions: {
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes('node_modules') ? undefined : true
            },
            adapter: adapter()
        })
    ]
});
```

- **Svelte 5 runes**: Enabled for all files except node_modules
- **Vercel adapter**: No custom configuration passed
- **The `adapter` option is nested inside plugins.sveltekit**, which is incorrect in the SvelteKit config structure. The `adapter` should be at the root level of `svelte.config.js`, not inside `vite.config.js`. This appears to be a configuration mistake — though it may work because the SvelteKit adapter settings may pick it up from here in certain configurations.

## jsconfig.json

```json
{
    "extends": "./.svelte-kit/tsconfig.json",
    "compilerOptions": {
        "allowJs": true,
        "checkJs": false,
        "moduleResolution": "bundler"
    }
}
```

- Extends the generated SvelteKit TypeScript config
- Allows JavaScript but skips type-checking (`checkJs: false`)
- Uses bundler module resolution (for modern imports with .js extensions)

## .npmrc

```
engine-strict=true
```

Enforces Node.js version requirements from package.json (even though package.json doesn't specify engines — this would need `engines` field in package.json to be effective).

## .gitignore

Ignores: node_modules, build output (.output, .vercel, .netlify, .wrangler, /.svelte-kit, /build), OS files, .env files (except .env.example and .env.test), Vite timestamps.

---

# Development Workflow

## Installation

```bash
npm install
```

Requires Node.js 20+.

## Environment Setup

Create `.env` file:
```
TURSO_DB_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
JWT_SECRET=your-secret
```

## Development

```bash
npm run dev        # Start dev server at http://localhost:5173
```

- Vite dev server with HMR
- Server hooks auto-run migrations on startup
- SPA mode — no SSR

## Build

```bash
npm run build      # Production build via Vite
```

- Output goes to `.svelte-kit/output/` and the `build/` directory
- Adapter-vercel prepares output for Vercel deployment

## Preview

```bash
npm run preview    # Preview production build locally
```

## Testing

**No testing infrastructure is configured.** There are no tests, no test framework, no test runner. The project does not have vitest, jest, playwright, or any other testing dependency.

## Linting / Formatting

**None configured.** No ESLint, Prettier, or other linting/formatting tools in the project.

## Deployment

- **Platform**: Vercel
- **Trigger**: Push to `main` branch
- **Build**: Vercel detects `@sveltejs/adapter-vercel` and builds automatically
- **Serverless**: API routes run as Vercel serverless functions
- The `.vercel/` directory contains the project link metadata

---

# Coding Standards

## Naming Conventions

| Element | Convention | Examples |
|---------|-----------|----------|
| Files | kebab-case | `kanban-board.svelte`, `auth.svelte.js`, `seedData.js` |
| Classes | PascalCase | `TodoStore`, `AuthStore`, `ToastStore` |
| Functions | camelCase | `makeId()`, `getDb()`, `filterTasks()` |
| Variables | camelCase | `db`, `authToken`, `filteredTasks` |
| Constants | UPPER_SNAKE | `TOKEN_EXPIRY`, `SALT_ROUNDS`, `STORAGE_KEY` |
| Private fields | # prefix | `#saveTimer`, `#savedFlagTimer` |
| Props destructuring | camelCase | `{ onedit, onnew }` |

## File Organization

- **Svelte components**: One component per file, PascalCase filename, `.svelte` extension
- **Store files**: Named `*.svelte.js` (SvelteKit convention for client-only files that use runes)
- **Server files**: Under `lib/server/`, never imported client-side
- **Utils**: Pure functions, no Svelte imports
- **Route files**: `+server.js` for API endpoints, `+page.svelte` for pages, `+layout.js/svelte` for layouts

## Error Handling

- **API handlers**: Try/catch with structured JSON error responses
- **Client fetch**: `.catch()` on promises with toast notification
- **localStorage**: Catch DOMException for quota errors
- **Auth**: Try/catch for network errors, `throw new Error(message)` for business logic
- **Dates**: NaN checks, null handling throughout
- **No global error boundary** — unhandled errors crash the app

## JSDoc Annotations

The project uses JSDoc for type information throughout:

```javascript
/** @type {{ onnew?: () => void, ontogglesidebar?: () => void }} */
let { onnew, ontogglesidebar } = $props();

/**
 * @param {string} message
 * @param {'success'|'error'|'info'} [type]
 * @returns {number}
 */
push(message, type = 'info', timeout = 3000) { ... }
```

## Imports

- Server: `$lib/server/...` alias
- Stores: `$lib/stores/...` alias
- Utils: `$lib/utils/...` alias
- Components: `$lib/components/...` alias
- SvelteKit: `$app/environment`, `$app/navigation`
- Svelte: `svelte`, `svelte/transition`, `svelte/animate`
- External: package names

## Code Patterns

1. **Immutable array updates**: `this.tasks = [...this.tasks, newItem]` or `this.tasks = this.tasks.map(...)`
2. **Immutable object updates**: `this.filters = { ...this.filters, search: value }`
3. **Store interactions**: Components import the singleton store directly and read reactive fields
4. **Props-down, events-up**: Parent passes callbacks (onedit, onnew, ondelete) to children
5. **$effect for side effects**: Watching store changes, debouncing, focus management
6. **$derived for computed values**: Filtered lists, counts, categories/priorities/tags

---

# External Integrations

| Integration | Purpose | Authentication | Files |
|-------------|---------|---------------|-------|
| **Turso** | Edge SQLite database | URL + auth token via env vars | `db.js`, `migrate.js`, all `+server.js` |
| **Google Fonts** | Noto Serif JP + Zen Kaku Gothic New | None (public CDN) | `app.html` |
| **Vercel** | Hosting + deployment | Vercel CLI / GitHub integration | `vite.config.js`, `.vercel/` |

No other external integrations (no analytics, no error tracking, no email service, no CDN for assets beyond fonts).

---

# Performance Considerations

## Current Optimizations

- **Debounced search** (250ms) — prevents excessive filter re-computations
- **Debounced localStorage** (300ms) — batches rapid state changes
- **`$derived` memoization** — filtered/list/board computations only rerun when dependencies change
- **Drag-state gating** — store doesn't clobber local drag items mid-drag
- **CSS animations** — respects `prefers-reduced-motion`
- **Minimal dependencies** — only 1 runtime dependency (svelte-dnd-action)

## Potential Bottlenecks

- **Task array operations are O(n)**: `map`, `filter`, `find` on the entire task list could slow down with hundreds/thousands of tasks
- **No pagination**: All tasks loaded at once via single GET /api/tasks
- **No optimistic UI rollback**: Server failures show toasts but don't revert local state
- **localStorage writes on every state change**: Could be costly with large task sets (JSON.stringify of full state)
- **No memoization of complex derivations**: The `board` and `grouped` derivations iterate all tasks every time
- **No image optimization**: No images used

---

# Security

| Aspect | Current State | Risk |
|--------|--------------|------|
| Authentication | JWT + httpOnly cookie | Low |
| Authorization | user_id scoping on all queries | Low |
| Password hashing | bcryptjs, 10 rounds | Low |
| Input validation | Basic presence checks, missing sanitization | Medium |
| XSS | Minimal — template literals could expose injection | Medium |
| CSRF | SameSite=lax cookie | Low |
| Secrets in env | `.env` file with live credentials committed | **Critical** |
| Rate limiting | None | Medium |
| CSP headers | Not configured | Medium |
| SQL injection | Parameterized queries (`args` array) | Low |
| Dependency vulnerabilities | Unknown — no audit run | Medium |

## Identified Security Issues

1. **Live credentials committed**: `.env` contains working Turso credentials and JWT secret
2. **No rate limiting**: Login endpoint could be brute-forced
3. **No CSP**: Missing Content-Security-Policy headers
4. **No input sanitization**: Title/description user input rendered directly in HTML
5. **No data validation on server**: Server trusts client-provided data shapes in POST/PATCH
6. **Synchronous bcrypt**: `hashSync`/`compareSync` blocks the event loop (though briefly)

---

# Known Bugs

## 1. vite.config.js misconfiguration

**File**: `vite.config.js`

**Issue**: The `adapter()` is passed inside the sveltekit plugin options, not at the SvelteKit config level. In standard SvelteKit projects, the adapter is configured in `svelte.config.js`, not in `vite.config.js` as a plugin option.

**Impact**: May work due to adapter-vercel's auto-detection, but violates the documented configuration pattern.

**Affected files**: `vite.config.js`

## 2. lib/assets/favicon.svg is a Svelte logo (unused)

**File**: `src/lib/assets/favicon.svg`

**Issue**: This file is the Svelte logo SVG, while the actual favicon used is `static/favicon.svg` (a sakura blossom). The `lib/assets/favicon.svg` appears to be a leftover from initial scaffolding.

**Impact**: None — unused, but confusing.

## 3. No task count badge update on filter change in header

**Issue**: The header subtitle shows `{todoStore.counts.filtered} of {todoStore.counts.total} tasks`. The `filtered` count correctly reflects active filters, but the `total` count does not update when filters change — it shows the total across ALL tasks. This is actually correct behavior (shows "X filtered of Y total"), so not a bug.

## 4. localStorage persistence writes on every state change including drag-intermediate

**Issue**: The `$effect.root()` in TodoStore watches `$state.snapshot(this.tasks)` which changes during drag operations (as the array is being rebuilt). The 300ms debounce mitigates this, but rapid drag operations will trigger intermediate saves.

**Severity**: Low — 300ms debounce prevents excessive writes.

---

# Technical Debt

## Architecture

1. **No test infrastructure**: Zero tests across the entire codebase. Any changes require manual verification.
2. **No TypeScript**: Using plain JS with JSDoc types provides minimal type safety. No build-time type checking.
3. **Config file structure**: `adapter()` placed inside sveltekit plugin options in vite.config.js instead of a proper `svelte.config.js`.
4. **No CI/CD pipeline**: `.github/workflows/` is empty. No automated testing or linting on PRs.
5. **Server-side code importable on client?**: files under `src/lib/server/` are SvelteKit protected — they can only be imported in server routes, since the `$lib/server` alias is server-only by convention. However, there is no explicit guard.

## Code Quality

1. **`auth.js` uses sync bcrypt**: `hashSync`/`compareSync` could block the event loop under load. Should be `hash`/`compare` (async).
2. **`db.js` has no connection timeout**: If Turso is unreachable, the request hangs.
3. **`migrate.js` runs at import time**: Schema migration runs on module import (in `hooks.server.js`). In serverless environments, this runs on every cold start.
4. **No request validation middleware**: Each API handler validates independently. No schema-based validation.
5. **Hardcoded constants in components**: STATUSES, CATEGORIES, PRIORITIES are defined in todoStore but treated as de facto global constants.

## UX/UI

1. **No loading state for individual API calls**: After initial `init()`, task CRUD operations have no loading indicator — the UI updates optimistically while server sync happens silently.
2. **No error recovery on server failure**: If a server sync fails, the local state is already updated. A page refresh would lose un-synced changes (unless localStorage has them).
3. **No confirmation on navigation away with unsaved changes**: Not relevant in SPA mode, but still worth noting.

---

# TODOs

Collected from the codebase:

| Location | Comment | Type |
|----------|---------|------|
| `storage.js:36-38` | `// Example for the future: if (data.version === 1) { ... data.version = 2; }` | Future migration path |
| `storage.js:37` | Comment about future schema migration | Placeholder |
| `lib/index.js:1` | `// place files you want to import through the $lib alias in this folder.` | Default comment |

No explicit TODO, FIXME, or HACK comments found in the codebase. The `storage.js` migration function and `lib/index.js` are the only placeholder comments.

---

# Future Roadmap

Based on architecture analysis and comments:

## Likely Next Steps

1. **Add tests**: The most critical missing piece. Unit tests for stores, utils, and API handlers.
2. **Add TypeScript**: Converting JSDoc types to proper TypeScript.
3. **svelte.config.js**: Properly configure SvelteKit with a dedicated config file.
4. **CI/CD pipeline**: GitHub Actions for linting, testing, and type-checking.

## Missing Features (Potential)

1. **User profile**: No username change, no password change, no account deletion
2. **Task archiving**: Instead of permanent delete, archive tasks
3. **Sorting**: Tasks ordered by position but no user-controllable sort
4. **Multiple boards**: Only one kanban board per user
5. **Collaboration**: Single-user only
6. **Export/Import**: No data portability
7. **Dark mode**: Only one theme
8. **Keyboard shortcuts**: Only Ctrl+K for search
9. **Undo/redo**: No history
10. **Push notifications**: No reminders for due tasks
11. **PWA**: No service worker or manifest for installable app
12. **OAuth login**: Only username/password
13. **Rate limiting**: Especially on auth endpoints
14. **Analytics**: No usage tracking

---

# Complete Dependency Graph

```
package.json (project root)
├── @sveltejs/adapter-vercel     → Vercel deployment
├── @sveltejs/kit                → Routing, hooks, server endpoints
├── @sveltejs/vite-plugin-svelte → Svelte compilation in Vite
├── svelte                       → UI components, runes, transitions
├── vite                         → Dev server, bundling
├── @libsql/client               → Turso/libSQL database driver
├── bcryptjs                     → Password hashing
├── jsonwebtoken                 → JWT auth tokens
└── svelte-dnd-action            → Drag-and-drop (runtime dependency)
```

## Module Relationship Diagram

```
hooks.server.js
├── migrate.js → db.js → @libsql/client → Turso
└── auth.js → bcryptjs, jsonwebtoken

+layout.svelte → auth.svelte.js → fetch()

+page.svelte
├── auth.svelte.js
├── todoStore.svelte.js
│   ├── storage.js (localStorage)
│   ├── seedData.js
│   ├── filters.js
│   ├── api.js (fetch → +server.js → db.js → Turso)
│   └── toasts.svelte.js
└── Components
    ├── Header → ViewToggle
    ├── Sidebar
    │   ├── CategoryFilter
    │   ├── PriorityFilter
    │   └── TagFilter
    ├── KanbanBoard → KanbanColumn → TaskCard
    ├── TaskList → TaskRow
    ├── AddTaskForm → Modal → TaskForm
    ├── EditTaskModal → Modal → TaskForm
    ├── ConfirmDialog → Modal
    ├── Toast
    └── Loader

API Endpoints (+server.js)
├── auth/login   → auth.js, db.js
├── auth/signup  → auth.js, db.js, id.js
├── auth/logout
├── auth/me
├── tasks        → db.js, id.js
├── tasks/[id]   → db.js
└── tasks/reorder → db.js
```

---

# Important Files

| File | Why It Matters |
|------|---------------|
| `src/lib/stores/todoStore.svelte.js` | The entire application state lives here. All data flows through this file. |
| `src/lib/server/db.js` | Database connection — if this breaks, nothing works. |
| `src/lib/server/migrate.js` | Schema management — controls database structure. |
| `src/hooks.server.js` | Request lifecycle — session validation on every request. |
| `src/app.css` | Design system — CSS variables, all styling tokens. |
| `vite.config.js` | Build configuration — controls how the app compiles and deploys. |
| `package.json` | Project metadata, dependencies, scripts. |
| `.env` | **Contains live credentials** — security critical. |

---

# Glossary

| Term | Definition |
|------|-----------|
| **Ukiyo-e** | Japanese woodblock print art style (浮世絵). The app's visual theme. |
| **Kanban** | Visual workflow management method with columns (To Do / In Progress / Done). |
| **Runes** | Svelte 5's reactivity primitives ($state, $derived, $effect). |
| **Turso** | Edge-hosted SQLite database service using the libSQL protocol. |
| **libSQL** | Open-source fork of SQLite with additional features for edge deployment. |
| **Seigaiha** | Japanese wave pattern used as background texture. |
| **JWT** | JSON Web Token — stateless authentication token. |
| **SPA** | Single Page Application — client-side routing, no server rendering. |
| **$effect.root()** | Svelte 5 API to create a long-lived reactive scope (outlives component lifecycle). |
| **$state.snapshot()** | Svelte 5 API to create a static (non-reactive) copy of reactive state for serialization. |
| **svelte-dnd-action** | A Svelte `use:` action that adds drag-and-drop to any container element. |

---

# Quick Start Guide for Another AI

## How This Project Works

This is a **SvelteKit SPA** hosted on **Vercel** with a **Turso (edge SQLite)** database. Users authenticate with username/password (bcryptjs + JWT), then manage tasks on a kanban board with drag-and-drop or a list view. Data syncs to Turso on every mutation, with localStorage as an offline fallback.

## How to Navigate

1. **Start with `src/lib/stores/todoStore.svelte.js`** — it's the brain of the app. Everything flows through it.
2. **API routes are in `src/routes/api/`** — SvelteKit file-based routing, each folder = an endpoint.
3. **Components are in `src/lib/components/`** — one component per file, self-contained CSS.
4. **Server utilities in `src/lib/server/`** — database, auth, migration. Never imported client-side.
5. **Client utilities in `src/lib/utils/`** — pure functions for API calls, filtering, dates, storage.

## How to Extend

- **Add a new API endpoint**: Create a new folder under `src/routes/api/` with a `+server.js` file.
- **Add a new page**: Create a new folder under `src/routes/` with a `+page.svelte`.
- **Add a new component**: Create a file in `src/lib/components/`, import the singleton stores as needed.
- **Add a new task field**: Update the SCHEMA in `migrate.js`, the `rowToTask()` function in tasks/+server.js, the TaskForm fields, the TaskCard/TaskRow display, and the PATCH allowed fields list.
- **Add a new filter dimension**: Add to Filter type, `emptyFilters()`, `filterTasks()` logic, and create a new filter component in the sidebar.

## What NOT to Change

- **Do not remove or rename `src/lib/server/` files** — they are server-only by SvelteKit convention and client imports would break.
- **Do not change the storage key** (`STORAGE_KEY = 'ukiyo-kanban'`) — users have data in localStorage under this key.
- **Do not change the STORAGE_VERSION without a migration** — old localStorage data will be rejected as unmigratable.
- **Do not add server-only imports to client files** — SvelteKit will throw an error (exposes server-side code to client bundle).

## Important Assumptions

1. **All task IDs are UUIDs** — generated client-side. No sequential IDs.
2. **The app trusts optimistic updates** — local state changes immediately, server sync is best-effort.
3. **No other users can access tasks** — `user_id` scoping on all queries.
4. **Migration runs on every cold start** — idempotent DDL, safe for serverless.
5. **`ssr = false`** — no server-side rendering. All pages are client-only.
6. **The database schema was designed for this app only** — no migrations tool, no rollback.

## Critical Files to Edit Carefully

- **`todoStore.svelte.js`**: Central state. Breaking this = entire app broken.
- **`migrate.js`**: Schema changes are irreversible (no rollback support).
- **`+page.svelte`**: The main app layout. Routing between login and app happens here.
- **`hooks.server.js`**: Session validation + migration entry. All requests pass through here.

## Common Pitfalls

1. **Forgetting to update both client and server validation** when adding fields.
2. **Not wrapping async operations in try/catch** — unhandled promise rejections.
3. **Mutating reactive state directly** — always use immutable patterns (`this.tasks = [...]) instead of `this.tasks.push()`.
4. **Importing from `$lib/server` in client code** — SvelteKit blocks this at build time.
5. **Not updating the `allowed` array in PATCH endpoint** when adding new task fields.
6. **Forgetting `@libsql/client` parameterized queries** — raw SQL interpolation is a security risk.

## Current Priorities (Inferred)

1. Add test infrastructure (vitest + testing-library)
2. Create CI workflow in `.github/workflows/`
3. Consider adding svelte.config.js for proper adapter configuration
4. Add input validation sanitation
5. Remove `.env` from repository (it contains live credentials)
6. Add rate limiting to auth endpoints
7. Add CSP security headers
8. Move sync bcrypt to async

---

*Analysis generated 2026-07-28. Every source file in the repository was read and analyzed.*
