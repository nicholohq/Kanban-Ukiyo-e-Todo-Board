# ADR-001: Project Philosophy

## Status

Accepted

## Date

2026-07-09

## Context

This project needed clear boundaries to avoid feature creep and maintain its identity as a personal productivity tool with a Japanese aesthetic. Without explicit philosophy, the project could expand into team collaboration features, enterprise workflows, or lose its design identity.

## Decision

The project will:

- Remain a **single-user personal productivity tool**. No team features, no workspace management, no collaboration.
- **Prioritize offline capability and mobile experience** over server-side features.
- Use **minimal dependencies** — every library must justify its weight.
- Follow **Svelte 5 runes patterns exclusively** — no legacy Svelte store APIs.
- Maintain the **ukiyo-e visual identity** as a core differentiator.

The project will NOT:

- Add team collaboration features (assignees, comments, real-time sync)
- Add enterprise project management features (Gantt, resource planning, reports)
- Adopt TypeScript (within current scope — JavaScript + JSDoc is sufficient)
- Add CSS frameworks (hand-written CSS preserves aesthetic control)
- Target non-personal use cases

## Consequences

**Positive:**
- Clear product boundaries prevent feature creep
- Simpler architecture with fewer dependencies
- Faster development cycles
- Easy onboarding for AI agents due to consistent patterns
- Strong product identity

**Negative:**
- Excludes potential team/collaboration users
- No TypeScript means less build-time error detection
- Hand-written CSS requires more effort for complex layouts
