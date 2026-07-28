# Engineering Principles

These principles guide every engineering decision in this project. They are not suggestions — they are rules.

## 1. Offline First

The app must work without a network connection. Local state is the source of truth. Server synchronization is secondary. Every feature must consider its offline behavior before its online behavior.

## 2. Mobile First

Design for small screens first. Enhance for larger screens. Breakpoints are defined, tested, and intentional. No desktop-first development.

## 3. Performance Over Complexity

Choose the simpler solution that performs adequately. Avoid premature optimization. When a performance issue is measured, fix it with the simplest effective solution.

## 4. Minimal Dependencies

Every dependency must justify its weight. A library must solve a real, measured problem that would be significantly harder to solve with standard APIs. When in doubt, write it ourselves.

## 5. Accessibility Matters

Keyboard navigation, screen reader support, reduced motion, color contrast — these are not optional. Every component must be accessible by design, not by audit.

## 6. Every Feature Must Be Documented

No feature is complete until its documentation is written and reviewed. This includes the feature proposal, implementation notes, changelog entry, and any relevant ADRs.

## 7. Consistency Over Cleverness

Follow existing patterns even when a cleverer solution exists. Consistency makes the codebase predictable, which is more valuable than occasional elegance.

## 8. User Experience Before Feature Count

A polished, well-tested small set of features beats a rough, buggy large set. We prioritize quality over quantity in every release.
