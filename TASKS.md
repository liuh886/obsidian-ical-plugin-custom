# Product Roadmap

This file tracks forward-looking work only. Historical re-architecture tasks have been completed and removed so the roadmap stays useful.

## P0: Trust And Operability
- [x] Add a sync preview that shows total exported tasks, `VEVENT` count, `VTODO` count, and filtered tasks before writing.
- [x] Add a post-sync result report in the settings UI with destination-by-destination status.
- [x] Add an explicit diagnostics bundle for issue reporting, including active settings, readiness checks, and recent sync outcomes.
- [x] Unify export filtering into a single application-layer policy so global filter, tag rules, and category rules are not split between parsing and indexing.
- [x] Remove `rootPath` as a normal runtime decision source and treat `sourceRules` as the only active scope model after migration.
- [x] Slim the plugin façade further by moving connection validation and sync scheduling strategy into application services.

## P1: Daily Notes And Planning Depth
- [ ] Expand Day Planner support with clearer preview and validation for heading date inheritance and task line times.
- [x] Add better explanations for why a task was filtered out or downgraded to `VTODO`.
- [ ] Support exporting multiple calendars by rule set, for example by tag or folder.

## P2: Advanced Task Fidelity
- [ ] Deepen alarm support and document how calendar clients interpret reminders differently.
- [ ] Extend task metadata mapping for priorities, categories, and completion progress where calendar clients support it.
- [ ] Add optional per-destination formatting knobs only after preview and diagnostics are in place.

## P3: Open Source Excellence
- [ ] Keep README, README_zh, DESIGN, and smoke tests synchronized whenever product behavior changes.
- [ ] Add fixture-based parser examples as contributor-facing documentation.
- [ ] Publish a lightweight release checklist for maintainers built around `npm run validate`.
