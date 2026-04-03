# iCal Pro Architecture (obsidian-ical-plugin-pro)

## Design Goals (The "Pro" Standard)
- **High-Fidelity Sync**: Strict RFC 5545 compliance (folding, CRLF, escaping) to ensure "First-Class Citizen" status in Apple/Google/Outlook ecosystems.
- **Zero-Latency Indexing**: $O(1)$ incremental updates via Obsidian Vault/Metadata events, ensuring performance even in 10k+ note vaults.
- **Semantic Integrity**: Intelligent separation of Time-Blocks (`VEVENT`) and Task-Items (`VTODO`) based on time-of-day precision.
- **Idempotent Identity**: Guaranteed stable `UID` using deterministic hashing and the `TaskIdentityService` to prevent calendar duplicates across devices/edits.
- **Privacy First**: Local-first architecture with optional, encrypted-at-rest (Gist) or local-storage (iCloud/Dropbox) sync destinations.

## Architecture Overview

### Plugin Layer (Lifecycle & UI)
- `src/ObsidianIcalPlugin.ts`
- Owns Obsidian lifecycle, commands, ribbon actions, and event wiring.
- Provides a "Thin Entry Point" that delegates all business logic to specialized services.

### Application Layer (Orchestration)
- `src/Application/TaskIndexingService.ts`: Manages the memory-resident `TaskIndex`.
- `src/Application/TaskIdentityService.ts`: The "Soul" of the plugin. Uses fuzzy matching and historical records to maintain a `stableId` for tasks even when they move lines or files.
- `src/Application/CalendarSyncService.ts`: Orchestrates the multi-destination fan-out (Gist + File).
- `src/Application/SyncReadinessService.ts`: Pre-flight check for API tokens and configuration validity.

### Domain Layer (Models)
- `src/Model/Task.ts`: Rich domain object representing a task, its dates, status, and body.
- `src/Model/Settings.ts`: Unified configuration with automated migration logic for legacy versions.

### Service Layer (Logic & Parsing)
- `src/Service/TaskFinder.ts`: Locates tasks within files, implementing **Smart Date Inheritance** (inheriting dates from `YYYY-MM-DD` filenames or Day Planner headings).
- `src/Service/TaskFactory.ts`: Parses markdown into `Task` objects. Handles **Time-Range Parsing** (e.g., `09:00 - 10:30`) and **Alarm (⏰) Extraction**.
- `src/Service/IcalService.ts`: The "Translator". Converts domain tasks into iCalendar strings with **Smart Summary Cleaning** (stripping tags, metadata, and comments).
- `src/Service/ICalBuilder.ts`: A low-level, RFC-compliant string builder for the iCalendar format.

## Core Mechanisms

### 1. Smart Date Inheritance
iCal Pro goes beyond explicit emoji dates (`📅`, `🛫`). It implements a fallback chain:
1.  **Explicit Metadata**: Emoji dates or `YYYY-MM-DD` within the task line.
2.  **Day Planner Context**: Inherits date from the closest Markdown heading (if formatted as a date).
3.  **Daily Note Context**: Automatically inherits the date from the filename (if `YYYY-MM-DD.md`), turning every checkbox in a daily note into a scheduled task.

### 2. Semantic Task Splitting
- **Timed Tasks** → `VEVENT`: Appears in the calendar grid with specific start times.
- **Untimed Tasks** → `VTODO`: Appears in "Reminders" or sidebar task lists with a `DUE` date.
- **Floating Tasks** → `VTODO`: Appears as unscheduled items in the task manager.

### 3. Native Notifications (VALARM)
Supports the `⏰` emoji. If a task contains `⏰ 15`, iCal Pro emits a `VALARM` block set to 15 minutes before the start time. If only `⏰` is present, it uses the global `defaultAlarmOffset`.

### 4. Summary & Body Cleaning
To ensure professional-looking calendar entries, the plugin strips:
- HTML-like comments (`<!-- id: ... -->`)
- Obsidian internal link brackets (`[[...]]`)
- Dataview-style metadata (`key:: value`)
- Markdown formatting (`**bold**`, `_italic_`, `code`)
- Tags (`#work`, `#todo`)

## Runtime Flow
1. **Load**: Settings are loaded and migrated; `TaskIdentityState` is restored.
2. **Index**: `TaskIndexingService` builds an initial index; Vault events keep it fresh.
3. **Trigger**: Periodic timer (5-120m) or manual "Sync Now" ribbon/command.
4. **Validate**: `SyncReadinessService` confirms destinations are reachable.
5. **Render**: `IcalService` processes all tasks into a single compliant `.ics` string.
6. **Deploy**: The string is pushed to GitHub Gist and/or written to a local file.

## Evolution Path (Product Roadmap)

### Phase 1: GTD Depth (Current Focus)
- [ ] **Priority Mapping**: Map `⏫`, `🔼`, `🔽` to RFC `PRIORITY` (1, 5, 9).
- [ ] **Recurrence Rules (RRULE)**: Convert `🔁 every...` into native iCal recurrence.

### Phase 2: Visibility & UX
- [ ] **Sync Preview**: A modal showing exactly which tasks are being exported and why.
- [ ] **Deep-Link Persistence**: Ensure `obsidian://` links are robust across different OS/Vault configurations.

### Phase 3: Bi-Directionality (Long-Term)
- [ ] **Conflict Resolution**: Researching ways to sync *back* from the calendar (e.g., marking a Gist-synced task as "Done" in Apple Reminders).

