# 浮世 Kanban — Ukiyo-e Todo Board

A full-featured kanban-style todo app with a Japanese woodblock-print (_ukiyo-e_)
aesthetic. Built with **SvelteKit + Svelte 5 runes**, plain JavaScript, and
CSS-variable theming. Features **user authentication** and **cloud-synced
persistence** via Turso (edge SQLite).

> Portfolio piece for Nicholo Dela Rosa.

**[ukiyo-tanban.vercel.app](https://ukiyo-tanban.vercel.app/)**

## Features

- **Two views** — a drag-and-drop **Kanban board** (To Do / In Progress / Done)
  and a sortable, grouped **List view**.
- **Full CRUD** — create, edit, delete tasks with title, description, priority,
  category, tags, due date and status.
- **Drag & drop** — move cards between columns (mouse, touch and keyboard) via
  [`svelte-dnd-action`](https://github.com/isaacHagoel/svelte-dnd-action).
- **Filtering & search** — debounced text search plus multi-select category,
  priority and tag filters (auto-generated with live counts).
- **User auth** — signup / login with password (hashed with bcryptjs) and JWT
  sessions stored in httpOnly cookies.
- **Cloud persistence** — every mutation syncs to Turso (edge SQLite). Falls
  back to localStorage when offline.
- **Overdue indicators**, tag chips, and due-date badges.
- **Responsive** — desktop grid, collapsible drawer sidebar and stacked columns
  on mobile (breakpoints at 768px and 520px).
- **Accessible** — keyboard-navigable, focus-trapped modals, `aria-live` toast
  announcements, and `prefers-reduced-motion` support.

## Tech stack

| Concern       | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | SvelteKit 2 + Svelte 5 (runes)                      |
| Language      | Plain JavaScript with JSDoc                          |
| State         | Single `TodoStore` class (`$state`/`$derived`)      |
| Database      | Turso (edge-hosted SQLite)                           |
| Auth          | bcryptjs + JWT (httpOnly cookies)                   |
| Drag & drop   | `svelte-dnd-action`                                 |
| Styling       | Hand-written CSS + CSS variables (no framework)     |
| Build / host  | Vite · `@sveltejs/adapter-vercel` · Vercel          |
| Fonts         | Noto Serif JP + Zen Kaku Gothic New                 |

## Getting started

### Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database

### Setup

```bash
npm install
```

Create a `.env` file:
```
TURSO_DB_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
JWT_SECRET=your-secret
```

```bash
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build locally
```

## Project structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.js       # password hashing + JWT helpers
│   │   ├── db.js         # Turso client (lazy init)
│   │   ├── id.js         # UUID generator
│   │   └── migrate.js    # schema auto-migration
│   ├── stores/
│   │   ├── todoStore.svelte.js   # central runes store: state, CRUD, API sync
│   │   ├── auth.svelte.js        # auth state store
│   │   └── toasts.svelte.js      # toast/aria-live notification store
│   ├── components/               # Header, Sidebar, filters, list, board, modals…
│   └── utils/
│       ├── api.js                # fetch wrappers for REST endpoints
│       ├── storage.js            # localStorage fallback persistence
│       ├── filters.js            # pure filter/search helpers
│       ├── dates.js              # due-date formatting & overdue logic
│       └── seedData.js           # sample tasks for demo
├── routes/
│   ├── +layout.svelte            # global CSS + auth check
│   ├── +layout.js                # ssr:false (SPA)
│   ├── +page.svelte              # main board page (auth-guarded)
│   ├── login/+page.svelte        # login/signup page
│   └── api/
│       ├── auth/
│       │   ├── signup/+server.js
│       │   ├── login/+server.js
│       │   ├── logout/+server.js
│       │   └── me/+server.js
│       └── tasks/
│           ├── +server.js
│           ├── [id]/+server.js
│           └── reorder/+server.js
├── app.html                      # shell + Google Fonts
├── app.css                       # design system (variables, reset, utilities)
└── hooks.server.js               # auto-migrate DB + JWT session validation
```

## Design system

| Token      | Value     | Use                    |
| ---------- | --------- | ---------------------- |
| Linen      | `#f5f0e8` | background             |
| Vermilion  | `#c41a1a` | primary accent / CTA   |
| Indigo     | `#1a2a3a` | headers / secondary    |
| Charcoal   | `#2c2c2c` | text & 4px borders     |
| Matcha     | `#6b8f5e` | "done" / success       |
| Gold       | `#c5a059` | warm accent            |

Signature print look: **4px charcoal borders** and **hard `5px 5px 0` offset
shadows** on an 8px spacing grid.

## Deployment (Vercel)

The app is deployed on Vercel. On every push to `main`:

1. Vercel builds the app (`@sveltejs/adapter-vercel`)
2. The serverless function starts and auto-runs the schema migration
3. `hooks.server.js` validates JWT session cookies on every request

### Environment variables

Set in the Vercel project dashboard:

| Variable           | Description                        |
| ------------------ | ---------------------------------- |
| `TURSO_DB_URL`     | Turso database URL                 |
| `TURSO_AUTH_TOKEN` | Turso database auth token          |
| `JWT_SECRET`       | Secret key for signing JWT tokens  |

## License

MIT — sample/portfolio project.
