# Backlog

Future ideas and potential features that are not yet committed to the roadmap.

> **Roadmap** = committed work with a planned version.
> **Backlog** = potential future work, not yet scoped.

---

## High Priority

- **Dark mode**: Theme toggle with system preference detection
- **Keyboard shortcuts**: Full keyboard navigation (j/k, n, /, ?)
- **Task templates**: Save and reuse task structures
- **Undo / Redo**: History stack for task mutations

## Medium Priority

- **Export / Import**: JSON export and import of task data
- **Task archiving**: Archive instead of permanent delete
- **Multiple boards**: Different boards for different contexts (work, personal, etc.)
- **Custom categories**: User-defined category system
- **Markdown support**: Markdown in task descriptions
- **Notes sync gap**: a note created while the server was unreachable has no server row, so its later `PATCH` returns 404 and it never reaches the server by that route; the flush also drops the rest of its 1000 ms batch on the first failure (a healthy sibling note edited in the same window can be delayed a cycle if the dead note is attempted first). Nothing is ever lost locally. Candidate fix: make the notes flush use the already-idempotent `POST /api/notes` as a universal upsert, or track which notes the server has confirmed (Session 007).
- **Per-user local notes**: the locally cached notes are device-wide, so on a shared device a second account can see the first account's note text **online** (merge-on-load). Scope the cached notes by user id — Session 006's per-user repository (design spec §9.2).

## Low Priority

- **OAuth login**: Google/GitHub authentication option
- **Drag-and-drop on mobile**: Native touch drag-and-drop with haptic feedback
- **Analytics**: Privacy-respecting usage analytics
- **Push notifications**: Due date reminders

## Ideas (Not Scoped)

- Collaboration features (shared boards, assignees)
- Integrations (GitHub, Linear, Notion, Slack)
- Gamification (streaks, XP, achievements)
- Natural language date parsing
- Seasonal theme variants (sakura, autumn leaves, snow)
