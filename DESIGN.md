# Obsidian iCal Plugin - Architecture Design (DFTD)

## 1. Core Objectives
Transform the plugin from a basic "personal script" into an industrial-grade, robust, and performant Obsidian plugin.

## 2. Architecture & Tech Stack
- **iCalendar Generation**: Replace manual string concatenation with a robust Object-Oriented `ICalBuilder` that strictly adheres to RFC 5545 (line folding at 75 chars, strict escaping, CRLF).
- **Incremental Indexing (Cache)**: Replace the O(N) full-vault scan with an event-driven O(1) cache. The plugin will listen to `obsidian.Vault` events (`modify`, `delete`, `rename`, `create`) to update a memory-resident `TaskMap`.
- **Parsing Engine**: Upgrade parsing using Obsidian's `MetadataCache` to reliably extract task blocks and their multi-line descriptions, avoiding edge-case regex failures.
- **Timezone Awareness**: Support accurate `X-WR-TIMEZONE` headers and floating time generation systematically via the builder.

## 3. Data Structures
- `TaskIndex`: A singleton or service managing `Map<string, Task[]>` (mapping file paths to their parsed tasks) to avoid re-parsing the whole vault.
- `ICalBuilder`: A utility class with methods like `addEvent()`, `addProperty()`, `build()` to safely construct iCal strings.

## 4. Community Submission Readiness
- **Unique Identification**: Change Plugin ID to `obsidian-ical-plugin-pro` (or similar) to avoid conflict with the original `ical` ID in the community store.
- **Attribution**: Maintain clear attribution to the original author (Andrew Brereton) in the README and LICENSE.
- **Code Quality**: Ensure strict TypeScript types, remove all console logs (unless in debug mode), and follow Obsidian's [Developer Policies](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- **User Documentation**: Provide a comprehensive `README.md` with screenshots and clear setup instructions for Google/Apple Calendar.

## 5. Future Scalability (Phase 2)
- Recurrence rules (RRULE) parsing from markdown text.
- Multi-calendar output (e.g., splitting by `#work` and `#life` tags).