# Ukiyo Kanban — Documentation

Welcome to the Ukiyo Kanban documentation. This directory contains the complete engineering documentation for the project.

## Getting Started

| Document | Description |
|----------|-------------|
| [Project Philosophy](./PROJECT_PHILOSOPHY.md) | Vision, goals, and boundaries of the project |
| [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) | High-level architecture and data flow |
| [Quick Start](../README.md) | Project README with installation and setup |

## Engineering

| Document | Description |
|----------|-------------|
| [Engineering Principles](./ENGINEERING_PRINCIPLES.md) | Eight engineering rules that guide all decisions |
| [Engineering Guide](./ENGINEERING_GUIDE.md) | Complete engineering handbook (lifecycle, DoD, AI collaboration, hard rules) |
| [Release Strategy](./RELEASE_STRATEGY.md) | Semantic versioning and release workflow |
| [Roadmap](./ROADMAP.md) | Product-versioned roadmap with status indicators |

## Decision Records

| Document | Description |
|----------|-------------|
| [Decisions Index](./decisions/INDEX.md) | List of all Architecture Decision Records |
| [ADR-001: Project Philosophy](./decisions/ADR-001-project-philosophy.md) | Core philosophy and boundaries |

## Features & Milestones

| Document | Description |
|----------|-------------|
| [Feature Template](./features/TEMPLATE.md) | Standard template for proposing new features |
| [Milestone 001: Engineering Foundation](./milestones/milestone-001.md) | Documentation and workflow infrastructure |
| [Milestone 002: PWA Foundation](./milestones/milestone-002.md) | Progressive Web App support |

## Development

| Document | Description |
|----------|-------------|
| [Changelog](./CHANGELOG.md) | Version history (Keep a Changelog format) |
| [Backlog](./BACKLOG.md) | Future ideas not yet on the roadmap |
| [Session Logs](./progress/session-001.md) | Session-based progress tracking |
| [RFCs](./rfcs/) | Design proposals (directory — empty) |

---

## File Structure

```
docs/
├── README.md                         # This file
├── PROJECT_PHILOSOPHY.md             # Vision and boundaries
├── ENGINEERING_PRINCIPLES.md         # Engineering rules
├── ARCHITECTURE_OVERVIEW.md          # Living architecture doc
├── ENGINEERING_GUIDE.md              # Engineering handbook
├── RELEASE_STRATEGY.md               # SemVer strategy
├── ROADMAP.md                        # Product roadmap
├── CHANGELOG.md                      # Version history
├── BACKLOG.md                        # Future ideas
├── architecture/                     # Architecture diagrams (future)
├── decisions/
│   ├── INDEX.md                      # ADR index
│   └── ADR-001-project-philosophy.md # First ADR
├── features/
│   └── TEMPLATE.md                   # Feature proposal template
├── milestones/
│   ├── milestone-001.md              # Engineering Foundation
│   └── milestone-002.md              # PWA Foundation
├── progress/
│   └── session-001.md                # Session log
└── rfcs/                             # Design proposals (future)
```
