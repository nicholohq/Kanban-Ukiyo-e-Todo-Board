# Session NNN

> Session progress-log template. Copy to `session-NNN.md` and fill in.
> The four **Transition State** sections are **mandatory** for every architectural
> session — they force each intermediate state to be intentional rather than
> accidental.

## Date

YYYY-MM-DD

## Objectives

- The single architectural objective of this session, plus any supporting goals.

## Completed Work

- What was implemented, grouped by system or component. Use `### Subheadings`
  when the work is substantial.

## Build Verification

- `npm run test` — result
- `npm run check` — result
- `npm run build` — result
- Note any pre-existing/environmental failures explicitly.

## Transition State (mandatory)

### Authority

What becomes the source of truth after this session? State plainly what is
authoritative for reads and for writes.

### Transitional State

What intentionally remains incomplete or temporary after this session? List the
scaffolding, compatibility shims, or interim behaviours that later sessions
replace.

### Accepted Limitations

What known limitations are intentionally accepted after this session, and why is
each an acceptable (safe) failure mode for now?

### Exit Criteria

Which future session removes each limitation / transitional element above? Name
the session for each.

## Known Limitations

- Anything not covered by Accepted Limitations (e.g. environmental issues).

## Out of Scope (deferred)

- Work intentionally left for later sessions, with the target session noted.

## Next Session

- Forward-looking goals for the next session.
