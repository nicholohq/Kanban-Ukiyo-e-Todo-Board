# Engineering Guide

This document is the engineering handbook for Ukiyo Kanban. It defines how work is planned, executed, reviewed, and documented. Every contributor (human or AI) must follow this guide.

---

## 1. Project Workflow

All work follows a two-mode cycle:

### Plan Mode (READ-ONLY)

- Analyze, research, and design before writing code
- Propose changes via documentation
- Present plan to Product Owner for approval
- No code changes permitted

### Build Mode

- Execute the approved plan
- Write code, create files, modify the project
- Follow the Feature Lifecycle exactly
- All documentation must be updated as part of the task

**Transition**: Plan Mode → (approval) → Build Mode → (completion) → Plan Mode

---

## 2. Project Lifecycle

Every feature or change follows this lifecycle:

```
Discovery
    ↓
Discussion
    ↓
Architecture (approval required)
    ↓
RFC (if needed)
    ↓
Plan Mode
    ↓
Review
    ↓
Build Mode
    ↓
Testing
    ↓
Documentation
    ↓
Code Review
    ↓
Merge
    ↓
Release
    ↓
Retrospective
```

### Phase Descriptions

**Discovery**: Identify the need. Document the problem.
**Discussion**: Discuss approach with the team.
**Architecture**: Design the solution. Must be approved by Architecture Authority (ChatGPT) and Product Owner (Nicholo) before proceeding.
**RFC**: For large or complex changes, write a formal RFC in `docs/rfcs/`.
**Plan Mode**: Create detailed implementation plan in documentation.
**Review**: Human review of the plan before building.
**Build Mode**: Implement the approved plan.
**Testing**: Verify the implementation works correctly.
**Documentation**: Update all affected documentation.
**Code Review**: Final review of code and docs together.
**Merge**: Integrate into main branch.
**Release**: Deploy and tag.
**Retrospective**: Document lessons learned.

---

## 3. Feature Lifecycle

For individual features, the lifecycle is:

```
Idea
    ↓
Architecture Discussion
    ↓
Design
    ↓
Plan Mode
    ↓
Review
    ↓
Build Mode
    ↓
Testing
    ↓
Documentation Update
    ↓
Review
    ↓
Merge
```

---

## 4. Documentation Workflow

Every task that changes project behavior must update documentation as part of the same task.

### Documentation Synchronization Rule (HARD RULE)

> When Build Mode changes project behavior, documentation must be updated as part of the same task. At minimum:
>
> - `CHANGELOG.md`
> - `progress/session-xxx.md` (current session)
> - Current milestone document
> - Relevant architecture documentation
>
> Documentation must never lag behind implementation.

---

## 5. Architecture Decision Records

ADR-eligible decisions include:

- Framework or library choices
- Database or storage changes
- State management patterns
- API design decisions
- Major refactors
- Any decision with long-term consequences

ADRs live in `docs/decisions/` and are listed in `docs/decisions/INDEX.md`.

---

## 6. Definition of Done

Every completed feature must satisfy ALL of these criteria:

- [ ] Implementation complete
- [ ] Tested manually (all acceptance criteria pass)
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Progress log updated
- [ ] Milestone updated
- [ ] Code reviewed
- [ ] Ready for merge

---

## 7. Code Review Expectations

- PRs must include a clear description of what changed and why
- Reviewers check: correctness, consistency, performance, accessibility, security
- AI-generated code must be reviewed by the Architecture Authority
- No self-approving PRs

---

## 8. Coding Standards

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `kanban-board.svelte` |
| Classes | PascalCase | `TodoStore` |
| Functions | camelCase | `filterTasks()` |
| Variables | camelCase | `filteredTasks` |
| Constants | UPPER_SNAKE | `STORAGE_KEY` |

### File Organization
- One component per file
- Store files: `*.svelte.js`
- Server code: `lib/server/` (never imported client-side)
- Utils: pure functions, no Svelte imports

### Error Handling
- API handlers: try/catch → structured JSON error responses
- Client fetch: `.catch()` → toast notification
- localStorage: catch DOMException for quota errors
- No unhandled promise rejections

### State Management
- Immutable array updates: `this.tasks = [...this.tasks, newItem]`
- Immutable object updates: `this.filters = { ...this.filters, search: value }`
- `$derived` for computed values
- `$effect` for side effects
- Optimistic updates with server sync fire-and-forget

---

## 9. AI Collaboration

### Roles (Hard Rule)

| Role | Person | Authority |
|------|--------|-----------|
| **Product Owner** | Nicholo | Final product decisions, priorities, scope |
| **Tech Lead / Architect** | ChatGPT | Architecture authority, design decisions |
| **Implementation Engineer** | OpenCode | Code implementation only |

### Hard Rule: No Unauthorized Architecture Decisions

> **OpenCode must never make architecture decisions independently.**
>
> Architecture changes — including but not limited to:
> - Adding or changing frameworks and libraries
> - Database or storage layer changes
> - Folder restructuring
> - State management pattern changes
> - Major pattern changes
>
> ...require explicit approval from the Architecture Authority (ChatGPT) **and** Product Owner (Nicholo) **before** implementation.

### Context Block

Every implementation prompt must begin with a Context Block:

```markdown
Project: Ukiyo Kanban
Current Version: v1.1 Foundation
Current Milestone: Engineering Foundation
Current Session: 001
Product Owner: Nicholo
Architecture Authority: ChatGPT
Implementation Engineer: OpenCode
Mission: Implement only the approved scope.
```

---

## 10. Plan Mode vs Build Mode Rules

| Activity | Plan Mode | Build Mode |
|----------|-----------|------------|
| Read files | ✓ Allowed | ✓ Allowed |
| Search code | ✓ Allowed | ✓ Allowed |
| Analyze architecture | ✓ Allowed | ✓ Only as needed |
| Create documentation | ✓ Allowed | ✓ Required |
| Modify source code | ✗ Forbidden | ✓ Allowed (approved scope only) |
| Install dependencies | ✗ Forbidden | ✗ Must be approved |
| Refactor | ✗ Forbidden | ✓ Allowed (approved scope only) |
