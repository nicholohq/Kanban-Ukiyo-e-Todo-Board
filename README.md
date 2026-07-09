# 浮世 Kanban — Ukiyo-e Todo Board

A full-featured kanban-style todo app with a Japanese woodblock-print (_ukiyo-e_)
aesthetic. Built with **SvelteKit + Svelte 5 runes**, plain JavaScript, and
CSS-variable theming. All data lives in the browser (localStorage) — no backend.

> Portfolio piece for Nicholo Dela Rosa. Theme, palette and fonts match the
> main portfolio site.

## Features

- **Two views** — a drag-and-drop **Kanban board** (To Do / In Progress / Done)
  and a sortable, grouped **List view**.
- **Full CRUD** — create, edit, delete tasks with title, description, priority,
  category, tags, due date and status.
- **Drag & drop** — move cards between columns (mouse, touch and keyboard) via
  [`svelte-dnd-action`](https://github.com/isaacHagoel/svelte-dnd-action).
- **Filtering & search** — debounced text search plus multi-select category,
  priority and tag filters (auto-generated with live counts).
- **Offline persistence** — every change auto-saves to localStorage (debounced,
  versioned, with quota-error handling).
- **Overdue indicators**, tag chips, and due-date badges.
- **Responsive** — desktop grid, collapsible drawer sidebar and stacked columns
  on mobile (breakpoints at 768px and 520px).
- **Accessible** — keyboard-navigable, focus-trapped modals, `aria-live` toast
  announcements, and `prefers-reduced-motion` support.

## Tech stack

| Concern       | Choice                                          |
| ------------- | ----------------------------------------------- |
| Framework     | SvelteKit 2 + Svelte 5 (runes)                  |
| Language      | Plain JavaScript with JSDoc                      |
| State         | Single `TodoStore` class (`$state`/`$derived`)  |
| Drag & drop   | `svelte-dnd-action`                             |
| Styling       | Hand-written CSS + CSS variables (no framework) |
| Build / host  | Vite · `@sveltejs/adapter-static` · GitHub Pages |
| Fonts         | Noto Serif JP + Zen Kaku Gothic New             |

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # produce a static build in ./build
npm run preview  # preview the production build locally
```

## Project structure

```
src/
├── lib/
│   ├── stores/
│   │   ├── todoStore.svelte.js   # central runes store: state, CRUD, derived
│   │   └── toasts.svelte.js      # toast/aria-live notification store
│   ├── components/               # Header, Sidebar, filters, list, board, modals…
│   └── utils/
│       ├── storage.js            # versioned localStorage load/save
│       ├── filters.js            # pure filter/search helpers
│       ├── dates.js              # due-date formatting & overdue logic
│       └── seedData.js           # first-launch sample tasks
├── routes/
│   ├── +layout.svelte            # imports global CSS
│   ├── +layout.js                # ssr:false, prerender:true (SPA)
│   └── +page.svelte              # assembles the app
├── app.html                      # shell + Google Fonts
└── app.css                       # design system (variables, reset, utilities)
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

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds the static site and publishes it on every
push to `main`. In the repo's **Settings → Pages**, set **Source = GitHub
Actions**.

The workflow sets `BASE_PATH` to `/<repo-name>` so assets resolve under a
project subpath (`username.github.io/<repo-name>`). For a user/org root site
(`username.github.io`), change `BASE_PATH` to an empty string in the workflow.

## License

MIT — sample/portfolio project.
