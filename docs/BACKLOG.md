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
- **Rich text in notes**: bold / italic / underline was requested and is explicitly out of scope for the notepad (design spec §3 non-goals; "a second text editor" is an anti-goal). Not a formatting toggle to bolt on — it needs its own design: the stored format (markdown vs HTML), how it coexists with the plain `<textarea>` editing model and the §9.3 sent-text marking, round-tripping through a card, export fidelity, and XSS on render.
- **Notes sync gap**: a note created while the server was unreachable has no server row, so its later `PATCH` returns 404 and it never reaches the server by that route; the flush also drops the rest of its 1000 ms batch on the first failure (a healthy sibling note edited in the same window can be delayed a cycle if the dead note is attempted first). Nothing is ever lost locally. Candidate fix: make the notes flush use the already-idempotent `POST /api/notes` as a universal upsert, or track which notes the server has confirmed (Session 007).
- **Local-only tasks 404 on later sync**: a task created while the server was unreachable has no server row, so `toggleDone`'s status `PATCH` — and the edit `PATCH` and the `DELETE` on that same card — return 404 forever, toasting "Failed to sync to server." The card still renders from local state, and a drag on it *looks* successful because `PUT /api/tasks/reorder` silently ignores an id it cannot match and still returns 200. Same class as the notes sync gap above, with the same candidate fix (idempotent upsert, or track server-confirmed rows). Pre-existing, not introduced by the notepad branch: every file on this path is unchanged from `main`.
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
