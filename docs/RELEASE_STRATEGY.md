# Release Strategy

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

| Type | When | Example |
|------|------|---------|
| **Patch** (x.x.**1**) | Bug fixes, documentation-only changes, minor refactors | `1.0.0` → `1.0.1` |
| **Minor** (x.**1**.0) | New features, backward-compatible changes | `1.0.0` → `1.1.0` |
| **Major** (**1**.0.0) | Architectural changes, breaking API changes | `1.0.0` → `2.0.0` |

## Current Version

**v1.0.0** — Initial Release (2026-07-12)

The current version is declared in documentation only. Git tags will be introduced later as part of the formal release workflow.

## Pre-Release (Future)

When needed, pre-release versions will use:

- **Alpha** (`1.1.0-alpha.1`): Experimental, incomplete features
- **Beta** (`1.1.0-beta.1`): Feature-complete, testing phase
- **RC** (`1.1.0-rc.1`): Release candidate, final validation

## Release Workflow

1. Feature complete and tested
2. Milestone checklist verified
3. All documentation updated (changelog, milestone, progress, architecture)
4. Code review completed
5. Version updated in documentation
6. Git tag created (future)
7. Deployed to production (automatic via Vercel)
