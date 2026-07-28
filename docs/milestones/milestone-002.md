# Milestone 002: PWA Foundation

## Objective

Make Ukiyo Kanban installable as a Progressive Web App with a functional offline shell and pass Lighthouse PWA audit.

## Deliverables

- [📝] Web App Manifest (manifest.json)
- [📝] App Icons (192x192, 512x512, maskable)
- [📝] Service Worker (cache-first strategy for app shell)
- [📝] Install Prompt UI component
- [📝] Offline Shell (app shell loads without network)
- [📝] PWA Testing (Lighthouse audit ≥ 90)

## Acceptance Criteria

- App installs on Android (Chrome) and desktop (Chrome/Edge)
- App shell loads and renders without network connection
- Existing features continue working offline (with localStorage data)
- Lighthouse PWA score ≥ 90
- No regressions in existing authentication or task CRUD features

## Risks

- **iOS PWA limitations**: iOS Safari does not support push notifications or background sync. The install experience is also different (Share menu → Add to Home Screen). These are accepted limitations.
- **Stale content**: Service worker caching may serve stale JS/CSS after deployment. Cache-busting strategy needed.
- **Turso API calls offline**: API calls will fail when offline. This is expected and handled by the existing localStorage fallback, but error handling should be verified.

## Progress

Not started.

## Blockers

- Depends on Milestone 001 completion (documentation and workflow established)
- Requires project structure review before adding PWA files

## Lessons Learned

*(Filled in after completion)*

## Completion Checklist

- [ ] manifest.json created with correct properties
- [ ] App icons generated for all required sizes
- [ ] Service worker registered and functional
- [ ] Install prompt UI tested
- [ ] Offline mode verified (airplane mode test)
- [ ] Lighthouse PWA audit passed
- [ ] Documentation updated (changelog, milestone, session)

## Retrospective

*(Filled in after completion)*
