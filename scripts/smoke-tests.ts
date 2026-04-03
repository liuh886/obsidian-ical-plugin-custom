import test from "node:test";
import assert from "node:assert/strict";
import { CalendarSyncService } from "../src/Application/CalendarSyncService";
import { ConnectionValidationService } from "../src/Application/ConnectionValidationService";
import { DiagnosticsService } from "../src/Application/DiagnosticsService";
import { SyncExecutionError } from "../src/Application/SyncExecutionError";
import { SyncAutomationService } from "../src/Application/SyncAutomationService";
import { SyncPreviewService } from "../src/Application/SyncPreviewService";
import { SyncReadinessService } from "../src/Application/SyncReadinessService";
import { TaskIdentityService } from "../src/Application/TaskIdentityService";
import { TaskIndexingService } from "../src/Application/TaskIndexingService";
import { createTaskFromLine } from "../src/Service/TaskFactory";
import { DEFAULT_SETTINGS, migrateSettings } from "../src/Model/Settings";
import { IcalService } from "../src/Service/IcalService";
import { TaskFinder } from "../src/Service/TaskFinder";
import { TaskIndex } from "../src/Service/TaskIndex";
import { Task } from "../src/Model/Task";
import { TaskStatus } from "../src/Model/TaskStatus";

const encoder = new TextEncoder();

test("createTaskFromLine keeps floating tasks as todos", () => {
	const task = createTaskFromLine(
		"- [ ] Write release notes",
		"obsidian://open?vault=Demo&file=Daily.md",
		"Daily.md:0:- [ ] Write release notes",
		null,
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(task);
	assert.equal(task.hasAnyDate(), false);
	assert.equal(task.getSummary(), "Write release notes");
});

test("createTaskFromLine merges Day Planner date and time", () => {
	const task = createTaskFromLine(
		"- [ ] 9:30 Team sync",
		"obsidian://open?vault=Demo&file=Daily.md",
		"Daily.md:1:- [ ] 9:30 Team sync",
		new Date("2026-04-03T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(task);
	assert.equal(task?.getDate("Due", "YYYYMMDD[T]HHmmss"), "20260403T093000");
	assert.equal(task?.getSummary(), "Team sync");
});

test("IcalService emits VTODO with description and location link", () => {
	const task = createTaskFromLine(
		"- [ ] Prepare brief",
		"obsidian://open?vault=Demo&file=Brief.md",
		"Brief.md:1:- [ ] Prepare brief",
		null,
		"Context line",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
			linkPlacement: "Both",
		},
	);

	assert.ok(task);
	const calendar = new IcalService().getCalendar([task!], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "TodosOnly",
		linkPlacement: "Both",
	});

	assert.match(calendar, /BEGIN:VTODO/);
	assert.match(calendar, /DESCRIPTION:Context line\\nobsidian:\/\/open/);
	assert.match(calendar, /LOCATION:obsidian:\/\/open/);
});

test("migrateSettings upgrades legacy link and filename settings", () => {
	const settings = migrateSettings({
		filename: "",
		saveFileName: "vault-export",
		saveFileExtension: ".ics",
		isIncludeLinkInDescription: true,
		rootPath: "daily",
	});

	assert.equal(settings.filename, "vault-export.ics");
	assert.equal(settings.linkPlacement, "Both");
	assert.equal(settings.rootPath, "daily");
	assert.deepEqual(settings.sourceRules, [{ path: "daily", category: "" }]);
});

test("TaskIndexingService applies source rules", async () => {
	const taskIndex = new TaskIndex();
	const service = new TaskIndexingService(
		{
			getMarkdownFiles: () => [],
			cachedRead: async () => "- [ ] Keep me #calendar\n- [ ] Ignore me",
		} as never,
		{
			getFileCache: () => ({
				listItems: [{ position: { start: { line: 0 } } }, { position: { start: { line: 1 } } }],
				headings: [],
			}),
			} as never,
		taskIndex,
		{
			findTasks: async () => [
				new Task(TaskStatus.Todo, [], "Keep me #calendar", "obsidian://keep", "ops.md:0", ""),
				new Task(TaskStatus.Todo, [], "Ignore me", "obsidian://ignore", "ops.md:1", ""),
			],
		} as never,
		{
			assign: () => {},
			removeFile: () => {},
			renameFile: () => {},
			getState: () => ({}),
		} as never,
	);

	await service.indexFile(
		{ path: "areas/ops/today.md" } as never,
		{
			...DEFAULT_SETTINGS,
			sourceRules: [
				{ path: "areas/ops", category: "ops" },
				{ path: "areas/research", category: "research" },
			],
		},
	);

	assert.equal(service.getAllTasks().length, 2);
	assert.deepEqual(service.getAllTasks()[0].getCategories(), ["ops", "areas/ops"]);

	await service.indexFile(
		{ path: "areas/research/today.md" } as never,
		{
			...DEFAULT_SETTINGS,
			sourceRules: [
				{ path: "areas/ops", category: "ops" },
				{ path: "areas/research", category: "research" },
			],
		},
	);

	assert.equal(service.getAllTasks().length, 4);
});

test("CalendarSyncService fails loudly when no destination is enabled", async () => {
	const service = new CalendarSyncService(new IcalService(), []);

	await assert.rejects(
		() => service.sync([], { discoveredTaskCount: 0, filteredTaskCount: 0, exportedTaskCount: 0 }, DEFAULT_SETTINGS),
		/no save destination enabled/i,
	);
});

test("CalendarSyncService writes only to enabled destinations", async () => {
	const writes: string[] = [];
	const destination = {
		name: "fake-destination",
		isEnabled: () => true,
		save: async (_calendar: string, _settings: typeof DEFAULT_SETTINGS) => {
			writes.push("saved");
		},
	};

	const disabledDestination = {
		name: "disabled-destination",
		isEnabled: () => false,
		save: async (_calendar: string, _settings: typeof DEFAULT_SETTINGS) => {
			writes.push("should-not-run");
		},
	};

	const service = new CalendarSyncService(new IcalService(), [destination, disabledDestination]);
	const task = createTaskFromLine(
		"- [ ] Prepare brief 📅 2026-04-03",
		"obsidian://open?vault=Demo&file=Brief.md",
		"Brief.md:2:- [ ] Prepare brief 📅 2026-04-03",
		null,
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(task);
	const result = await service.sync(
		[task],
		{ discoveredTaskCount: 1, filteredTaskCount: 0, exportedTaskCount: 1 },
		DEFAULT_SETTINGS,
	);

	assert.deepEqual(writes, ["saved"]);
	assert.deepEqual(result.destinations, ["fake-destination"]);
	assert.equal(result.taskCount, 1);
	assert.equal(result.preview.exportedTaskCount, 1);
});

test("SyncReadinessService reports missing configuration clearly", () => {
	const readiness = new SyncReadinessService().evaluate({
		...DEFAULT_SETTINGS,
		isSaveToGistEnabled: true,
	});

	assert.equal(readiness.ready, false);
	assert.match(readiness.issues.join(" "), /username is missing/i);
	assert.match(readiness.issues.join(" "), /gist id is missing/i);
	assert.match(readiness.issues.join(" "), /personal access token is missing/i);
});

test("ConnectionValidationService checks gist reachability through application service", async () => {
	const service = new ConnectionValidationService(async () => ({ status: 200 } as never));

	const result = await service.validateGist({
		...DEFAULT_SETTINGS,
		githubGistId: "gist-id",
		githubPersonalAccessToken: "token",
	});

	assert.equal(result.success, true);
	assert.match(result.message, /connection successful/i);
});

test("SyncAutomationService skips startup sync when readiness fails", async () => {
	const service = new SyncAutomationService(new SyncReadinessService());
	let syncCalls = 0;

	await service.runStartupSyncIfReady(DEFAULT_SETTINGS, async () => {
		syncCalls += 1;
	});

	assert.equal(syncCalls, 0);
});

test("TaskIdentityService preserves IDs across common edits", () => {
	const identityService = new TaskIdentityService();
	const originalTask = createTaskFromLine(
		"- [ ] Write weekly summary 📅 2026-04-03",
		"obsidian://open?vault=Demo&file=Daily.md",
		"Daily.md:5:- [ ] Write weekly summary 📅 2026-04-03",
		null,
		"",
		DEFAULT_SETTINGS,
	);
	assert.ok(originalTask);
	identityService.assign("Daily.md", [originalTask!]);
	const originalId = originalTask!.getId();

	const editedTask = createTaskFromLine(
		"- [ ] Publish weekly summary 📅 2026-04-03",
		"obsidian://open?vault=Demo&file=Daily.md",
		"Daily.md:5:- [ ] Publish weekly summary 📅 2026-04-03",
		null,
		"",
		DEFAULT_SETTINGS,
	);
	assert.ok(editedTask);
	identityService.assign("Daily.md", [editedTask!]);

	assert.equal(editedTask!.getId(), originalId);
});

test("TaskIdentityService preserves IDs across file renames", () => {
	const identityService = new TaskIdentityService();
	const task = createTaskFromLine(
		"- [ ] Publish weekly summary 📅 2026-04-03",
		"obsidian://open?vault=Demo&file=Daily.md",
		"Daily.md:5:- [ ] Publish weekly summary 📅 2026-04-03",
		null,
		"",
		DEFAULT_SETTINGS,
	);
	assert.ok(task);
	identityService.assign("Daily.md", [task!]);
	const originalId = task!.getId();

	identityService.renameFile("Daily.md", "Archive/Daily.md");
	const renamedTask = createTaskFromLine(
		"- [ ] Publish weekly summary 📅 2026-04-03",
		"obsidian://open?vault=Demo&file=Archive%2FDaily.md",
		"Archive/Daily.md:5:- [ ] Publish weekly summary 📅 2026-04-03",
		null,
		"",
		DEFAULT_SETTINGS,
	);
	assert.ok(renamedTask);
	identityService.assign("Archive/Daily.md", [renamedTask!]);

	assert.equal(renamedTask!.getId(), originalId);
});

test("TaskFinder uses encoded deep links without applying tag filters", async () => {
	const finder = new TaskFinder({
		cachedRead: async () => [
			"- [ ] Demo task #workshop",
			"- [ ] Review task #work",
		].join("\n"),
	} as never);

	const tasks = await finder.findTasks(
		{
			path: "Project Plan/日报?.md",
			vault: { getName: () => "Demo Vault" },
		} as never,
		[
			{ position: { start: { line: 0 } } },
			{ position: { start: { line: 1 } } },
		],
		null,
		{
			...DEFAULT_SETTINGS,
			isIncludeTasksWithTags: true,
			includeTasksWithTags: "#work",
		},
	);

	assert.equal(tasks.length, 2);
	assert.match(tasks[0].getLocation(), /vault=Demo%20Vault/);
	assert.match(tasks[0].getLocation(), /file=Project%20Plan%2F%E6%97%A5%E6%8A%A5%3F.md/);
	assert.equal(tasks[0].getSummary(), "Demo task");
	assert.equal(tasks[1].getSummary(), "Review task");
});

test("TaskFinder inherits file date for daily notes without explicit task date", async () => {
	const finder = new TaskFinder({
		cachedRead: async () => "- [ ] Daily planning",
	} as never);

	const tasks = await finder.findTasks(
		{
			path: "daily/2026-03-02.md",
			basename: "2026-03-02",
			vault: { getName: () => "Demo Vault" },
		} as never,
		[{ position: { start: { line: 0 } } }],
		null,
		DEFAULT_SETTINGS,
	);

	assert.equal(tasks.length, 1);
	assert.equal(tasks[0].hasAnyDate(), true);
	assert.equal(tasks[0].hasTimedDate(), false);
	assert.equal(tasks[0].getDate("Due", "YYYYMMDD"), "20260302");
});

test("TaskFinder parses quoted callout tasks and preserves timed events", async () => {
	const finder = new TaskFinder({
		cachedRead: async () => [
			"> [!summary] Daily Execution Surface",
			"> - [ ] **09:30-11:30 红树林开场**",
			"> \t- 目标：Green Lagoon",
			"> - [ ] **16:30-18:00：SPA 修复**",
		].join("\n"),
	} as never);

	const tasks = await finder.findTasks(
		{
			path: "daily/2026-05-05.md",
			basename: "2026-05-05",
			vault: { getName: () => "Demo Vault" },
		} as never,
		[
			{ position: { start: { line: 1 } } },
			{ position: { start: { line: 3 } } },
		],
		null,
		DEFAULT_SETTINGS,
	);

	assert.equal(tasks.length, 2);
	assert.equal(tasks[0].hasTimedDate(), true);
	assert.equal(tasks[0].getDate("Due", "YYYYMMDD[T]HHmmss"), "20260505T093000");
	assert.match(tasks[0].getSummary(), /红树林开场/);
	assert.equal(tasks[1].getDate("Due", "YYYYMMDD[T]HHmmss"), "20260505T163000");
});

test("IcalService splits timed tasks into VEVENT and untimed dated tasks into VTODO", () => {
	const timedTask = createTaskFromLine(
		"- [ ] 09:00 Team sync",
		"obsidian://open?vault=Demo&file=2026-03-02.md",
		"2026-03-02.md:1:- [ ] 09:00 Team sync",
		new Date("2026-03-02T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);
	const untimedTask = createTaskFromLine(
		"- [ ] Write summary",
		"obsidian://open?vault=Demo&file=2026-03-02.md",
		"2026-03-02.md:2:- [ ] Write summary",
		new Date("2026-03-02T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(timedTask);
	assert.ok(untimedTask);

	const calendar = new IcalService().getCalendar([timedTask!, untimedTask!], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "EventsAndTodos",
	});

	assert.match(calendar, /BEGIN:VEVENT/);
	assert.match(calendar, /DTSTART;TZID=/);
	assert.match(calendar, /DTSTAMP:\d{8}T\d{6}Z/);
	assert.match(calendar, /BEGIN:VTODO/);
	assert.match(calendar, /DUE;VALUE=DATE:20260302/);
});

test("IcalService sanitizes summaries and folds UTF-8 lines safely", () => {
	const task = createTaskFromLine(
		"- [ ] 宝丰能源 & 华鲁恒升买入提醒 <!-- id: hidden-marker -->",
		"obsidian://open?vault=Demo&file=Long.md",
		"Long.md:1:- [ ] 宝丰能源 & 华鲁恒升买入提醒 <!-- id: hidden-marker -->",
		null,
		"**这是一个很长的说明**，包含 [[Internal Note|内部笔记]] 与 `inline code`，用于验证中文内容在导出时会被正确清洗并按 UTF-8 75 octets 规则折行。",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
			isOnlyTasksWithoutDatesAreTodos: false,
			linkPlacement: "Description",
		},
	);

	assert.ok(task);

	const calendar = new IcalService().getCalendar([task!], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "TodosOnly",
		isOnlyTasksWithoutDatesAreTodos: false,
		linkPlacement: "Description",
	});

	assert.doesNotMatch(calendar, /<!--/);
	assert.doesNotMatch(calendar, /\[\[/);
	assert.doesNotMatch(calendar, /\*\*/);

	for (const line of calendar.split("\r\n")) {
		assert.ok(encoder.encode(line).length <= 75, `line exceeds 75 octets: ${line}`);
	}
});

test("IcalService filters tasks whose summary is empty after sanitization", () => {
	const task = createTaskFromLine(
		"- [ ] <!-- hidden-only -->",
		"obsidian://open?vault=Demo&file=Hidden.md",
		"Hidden.md:1:- [ ] <!-- hidden-only -->",
		null,
		"",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
		},
	);

	assert.ok(task);

	const calendar = new IcalService().getCalendar([task!], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "TodosOnly",
	});

	assert.doesNotMatch(calendar, /BEGIN:VTODO/);
	assert.doesNotMatch(calendar, /SUMMARY:/);
});

test("IcalService keeps exportable tasks even when display sanitization removes tags and metadata", () => {
	const task = new Task(
		TaskStatus.Todo,
		[{ name: "Due", date: new Date("2026-04-25T09:00:00") }],
		"🎉 入选财新 ESG30 青年学者计划 (Phase 2) #milestone (date:: 20260425-20260427)",
		"obsidian://open?vault=Demo&file=Meta.md",
		"Meta.md:2",
		"",
	);

	const calendar = new IcalService().getCalendar([task], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "EventsOnly",
	});

	assert.match(calendar, /BEGIN:VEVENT/);
	assert.match(calendar, /SUMMARY:🎉 入选财新 ESG30 青年学者计划 \(Phase 2\)/);
});

test("IcalService removes dataview fragments and tags from exported text", () => {
	const task = new Task(
		TaskStatus.Todo,
		[{ name: "Due", date: new Date("2026-04-25T00:00:00") }],
		"🎉 入选财新 ESG30 青年学者计划 (Phase 2) #milestone (date:: 20260425-20260427)",
		"obsidian://open?vault=Demo&file=Meta.md",
		"Meta.md:1",
		"- [idea:: keep internal only]\n- 正常描述 #internal-tag",
	);

	const calendar = new IcalService().getCalendar([task], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "TodosOnly",
		isOnlyTasksWithoutDatesAreTodos: false,
		linkPlacement: "Description",
	});

	assert.doesNotMatch(calendar, /\bdate::/);
	assert.doesNotMatch(calendar, /\bidea::/);
	assert.doesNotMatch(calendar, /#milestone/);
	assert.doesNotMatch(calendar, /#internal-tag/);
	assert.match(calendar, /SUMMARY:🎉 入选财新 ESG30 青年学者计划 \(Phase 2\)/);
	assert.match(calendar, /DESCRIPTION:- 正常描述/);
});

test("createTaskFromLine parses priority recurrence and categories", () => {
	const task = createTaskFromLine(
		"- [ ] ⏫ Weekly planning every week on Monday #ops #planning",
		"obsidian://open?vault=Demo&file=Ops.md",
		"Ops.md:1:- [ ] ⏫ Weekly planning every week on Monday #ops #planning",
		new Date("2026-04-06T00:00:00"),
		"Body line #team",
		DEFAULT_SETTINGS,
	);

	assert.ok(task);
	assert.equal(task.priority, 1);
	assert.equal(task.recurrenceRule, "FREQ=WEEKLY;BYDAY=MO");
	assert.deepEqual(task.categories, ["ops", "planning", "team"]);
	assert.equal(task.getSummary(), "Weekly planning");
});

test("createTaskFromLine parses richer recurrence patterns", () => {
	const weekdayTask = createTaskFromLine(
		"- [ ] Standup every weekday",
		"obsidian://open?vault=Demo&file=Ops.md",
		"Ops.md:3",
		new Date("2026-04-06T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);
	const intervalTask = createTaskFromLine(
		"- [ ] Payroll every 2 weeks on Monday and Thursday",
		"obsidian://open?vault=Demo&file=Ops.md",
		"Ops.md:4",
		new Date("2026-04-06T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);
	const monthlyTask = createTaskFromLine(
		"- [ ] Review every 3 months",
		"obsidian://open?vault=Demo&file=Ops.md",
		"Ops.md:5",
		new Date("2026-04-06T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(weekdayTask);
	assert.ok(intervalTask);
	assert.ok(monthlyTask);
	assert.equal(weekdayTask.getRecurrenceRule(), "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
	assert.equal(intervalTask.getRecurrenceRule(), "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH");
	assert.equal(monthlyTask.getRecurrenceRule(), "FREQ=MONTHLY;INTERVAL=3");
});

test("IcalService emits RFC5545 priority recurrence and categories", () => {
	const task = createTaskFromLine(
		"- [ ] 🔼 Monthly review every month #finance",
		"obsidian://open?vault=Demo&file=Ops.md",
		"Ops.md:2:- [ ] 🔼 Monthly review every month #finance",
		new Date("2026-04-06T00:00:00"),
		"",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
			isOnlyTasksWithoutDatesAreTodos: false,
		},
	);

	assert.ok(task);
	const calendar = new IcalService().getCalendar([task], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "TodosOnly",
		isOnlyTasksWithoutDatesAreTodos: false,
	});

	assert.match(calendar, /PRIORITY:5/);
	assert.match(calendar, /RRULE:FREQ=MONTHLY/);
	assert.match(calendar, /CATEGORIES:finance/);
});

test("IcalService maps todo lifecycle statuses and completion timestamp", () => {
	const inProgressTask = createTaskFromLine(
		"- [/] Ship draft every day #delivery",
		"obsidian://open?vault=Demo&file=Ship.md",
		"Ship.md:1:- [/] Ship draft every day #delivery",
		null,
		"",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
			isOnlyTasksWithoutDatesAreTodos: false,
		},
	);
	const cancelledTask = createTaskFromLine(
		"- [-] Cancel rollout #ops",
		"obsidian://open?vault=Demo&file=Ship.md",
		"Ship.md:2:- [-] Cancel rollout #ops",
		null,
		"",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
			isOnlyTasksWithoutDatesAreTodos: false,
		},
	);
	const completedTask = createTaskFromLine(
		"- [x] Release shipped ✅ 2026-04-03 #ops",
		"obsidian://open?vault=Demo&file=Ship.md",
		"Ship.md:3:- [x] Release shipped ✅ 2026-04-03 #ops",
		null,
		"",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "TodosOnly",
			isOnlyTasksWithoutDatesAreTodos: false,
		},
	);

	assert.ok(inProgressTask);
	assert.ok(cancelledTask);
	assert.ok(completedTask);

	const calendar = new IcalService().getCalendar([inProgressTask, cancelledTask, completedTask], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "TodosOnly",
		isOnlyTasksWithoutDatesAreTodos: false,
	});

	assert.match(calendar, /STATUS:IN-PROCESS/);
	assert.match(calendar, /STATUS:CANCELLED/);
	assert.match(calendar, /STATUS:COMPLETED/);
	assert.match(calendar, /COMPLETED:20260403T000000Z/);
});

test("IcalService does not emit invalid completed fields on VEVENT", () => {
	const completedTimedTask = createTaskFromLine(
		"- [x] 09:00 Incident follow-up ✅ 2026-04-03 #ops",
		"obsidian://open?vault=Demo&file=Incident.md",
		"Incident.md:3:- [x] 09:00 Incident follow-up ✅ 2026-04-03 #ops",
		new Date("2026-04-03T00:00:00"),
		"",
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "EventsOnly",
		},
	);

	assert.ok(completedTimedTask);

	const calendar = new IcalService().getCalendar([completedTimedTask], {
		...DEFAULT_SETTINGS,
		includeEventsOrTodos: "EventsOnly",
	});

	assert.match(calendar, /BEGIN:VEVENT/);
	assert.doesNotMatch(calendar, /STATUS:COMPLETED/);
	assert.doesNotMatch(calendar, /COMPLETED:/);
});

test("TaskFinder only discovers tasks and leaves filtering to application services", async () => {
	const finder = new TaskFinder({
		cachedRead: async () => [
			"- [ ] Export this #task",
			"- [ ] Skip this checkbox",
		].join("\n"),
	} as never);

	const tasks = await finder.findTasks(
		{
			path: "daily/2026-03-02.md",
			basename: "2026-03-02",
			vault: { getName: () => "Demo Vault" },
		} as never,
		[
			{ position: { start: { line: 0 } } },
			{ position: { start: { line: 1 } } },
		],
		null,
		{
			...DEFAULT_SETTINGS,
			respectGlobalTaskFilter: true,
			globalTaskFilterTags: "#task",
		},
	);

	assert.equal(tasks.length, 2);
	assert.equal(tasks[0].getSummary(), "Export this");
	assert.equal(tasks[1].getSummary(), "Skip this checkbox");
});

test("TaskIndexingService applies source-rule categories without losing tag categories", async () => {
	const taskIndex = new TaskIndex();
	const taskFinder = new TaskFinder({
		cachedRead: async () => "- [ ] 09:30 Team sync #ops",
	} as never);
	const service = new TaskIndexingService(
		{
			cachedRead: async () => "- [ ] 09:30 Team sync #ops",
			getMarkdownFiles: () => [],
		} as never,
		{
			getFileCache: () => ({
				listItems: [{ position: { start: { line: 0 } } }],
				headings: [],
			}),
		} as never,
		taskIndex,
		taskFinder,
		new TaskIdentityService(),
	);

	await service.indexFile(
		{
			path: "Projects/A/task.md",
			basename: "task",
			vault: { getName: () => "Demo Vault" },
		} as never,
		{
			...DEFAULT_SETTINGS,
			sourceRules: [{ path: "Projects/A", category: "Project A" }],
		},
	);

	const [task] = service.getAllTasks();
	assert.ok(task);
	assert.deepEqual(task.getCategories(), ["ops", "Project A", "Projects/A"]);
});

test("TaskIndexingService owns global and tag filter policy", async () => {
	const taskIndex = new TaskIndex();
	const taskFinder = new TaskFinder({
		cachedRead: async () => [
			"- [ ] Export this #task #ops",
			"- [ ] Skip this #ops",
			"- [ ] Exclude this #task #ignore",
		].join("\n"),
	} as never);
	const service = new TaskIndexingService(
		{
			cachedRead: async () => [
				"- [ ] Export this #task #ops",
				"- [ ] Skip this #ops",
				"- [ ] Exclude this #task #ignore",
			].join("\n"),
			getMarkdownFiles: () => [],
		} as never,
		{
			getFileCache: () => ({
				listItems: [
					{ position: { start: { line: 0 } } },
					{ position: { start: { line: 1 } } },
					{ position: { start: { line: 2 } } },
				],
				headings: [],
			}),
		} as never,
		taskIndex,
		taskFinder,
		new TaskIdentityService(),
	);

	await service.indexFile(
		{
			path: "Projects/A/task.md",
			basename: "task",
			vault: { getName: () => "Demo Vault" },
		} as never,
		{
			...DEFAULT_SETTINGS,
			sourceRules: [{ path: "Projects/A", category: "Project A" }],
			respectGlobalTaskFilter: true,
			globalTaskFilterTags: "#task",
			isIncludeTasksWithTags: true,
			includeTasksWithTags: "#ops",
			isExcludeTasksWithTags: true,
			excludeTasksWithTags: "#ignore",
		},
	);

	assert.equal(service.getAllTasks().length, 1);
	assert.equal(service.getAllTasks()[0].getSummary(), "Export this");
});

test("TaskIndexingService applies category include and exclude filters", async () => {
	const taskIndex = new TaskIndex();
	const taskFinder = new TaskFinder({
		cachedRead: async () => "- [ ] 09:30 Team sync #ops",
	} as never);
	const service = new TaskIndexingService(
		{
			cachedRead: async () => "- [ ] 09:30 Team sync #ops",
			getMarkdownFiles: () => [],
		} as never,
		{
			getFileCache: () => ({
				listItems: [{ position: { start: { line: 0 } } }],
				headings: [],
			}),
		} as never,
		taskIndex,
		taskFinder,
		new TaskIdentityService(),
	);

	await service.indexFile(
		{
			path: "Projects/A/task.md",
			basename: "task",
			vault: { getName: () => "Demo Vault" },
		} as never,
		{
			...DEFAULT_SETTINGS,
			sourceRules: [{ path: "Projects/A", category: "ProjectA" }],
			isIncludeCategoriesEnabled: true,
			includeCategories: "ProjectA",
			isExcludeCategoriesEnabled: true,
			excludeCategories: "ops",
		},
	);

	assert.equal(service.getAllTasks().length, 0);
});

test("TaskIndexingService ignores legacy rootPath when source rules are present", async () => {
	const taskIndex = new TaskIndex();
	const taskFinder = new TaskFinder({
		cachedRead: async () => "- [ ] Visible task #task",
	} as never);
	const service = new TaskIndexingService(
		{
			cachedRead: async () => "- [ ] Visible task #task",
			getMarkdownFiles: () => [],
		} as never,
		{
			getFileCache: () => ({
				listItems: [{ position: { start: { line: 0 } } }],
				headings: [],
			}),
		} as never,
		taskIndex,
		taskFinder,
		new TaskIdentityService(),
	);

	await service.indexFile(
		{
			path: "Projects/B/task.md",
			basename: "task",
			vault: { getName: () => "Demo Vault" },
		} as never,
		{
			...DEFAULT_SETTINGS,
			rootPath: "Projects/B",
			sourceRules: [{ path: "Projects/A", category: "Project A" }],
		},
	);

	assert.equal(service.getAllTasks().length, 0);
});

test("SyncPreviewService summarizes exportable events todos and filtered tasks", () => {
	const previewService = new SyncPreviewService(new IcalService());
	const timedTask = createTaskFromLine(
		"- [ ] 09:00 Team sync",
		"obsidian://open?vault=Demo&file=2026-04-03.md",
		"2026-04-03.md:1",
		new Date("2026-04-03T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);
	const untimedTask = createTaskFromLine(
		"- [ ] Write memo",
		"obsidian://open?vault=Demo&file=2026-04-03.md",
		"2026-04-03.md:2",
		new Date("2026-04-03T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);
	const hiddenTask = createTaskFromLine(
		"- [ ] <!-- hidden-only -->",
		"obsidian://open?vault=Demo&file=2026-04-03.md",
		"2026-04-03.md:3",
		null,
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(timedTask);
	assert.ok(untimedTask);
	assert.ok(hiddenTask);

	const preview = previewService.build(
		[timedTask!, untimedTask!, hiddenTask!],
		{
			discoveredTaskCount: 5,
			filteredTaskCount: 2,
			exportedTaskCount: 3,
		},
		{
			...DEFAULT_SETTINGS,
			includeEventsOrTodos: "EventsAndTodos",
		},
	);

	assert.equal(preview.discoveredTaskCount, 5);
	assert.equal(preview.filteredTaskCount, 2);
	assert.equal(preview.exportedTaskCount, 2);
	assert.equal(preview.eventCount, 1);
	assert.equal(preview.todoCount, 1);
});

test("CalendarSyncService returns destination level report and throws structured error on partial failure", async () => {
	const service = new CalendarSyncService(new IcalService(), [
		{
			name: "local-file",
			isEnabled: () => true,
			save: async () => {},
		},
		{
			name: "github-gist",
			isEnabled: () => true,
			save: async () => {
				throw new Error("rate limited");
			},
		},
	]);
	const task = createTaskFromLine(
		"- [ ] 09:00 Team sync",
		"obsidian://open?vault=Demo&file=2026-04-03.md",
		"2026-04-03.md:1",
		new Date("2026-04-03T00:00:00"),
		"",
		DEFAULT_SETTINGS,
	);

	assert.ok(task);

	await assert.rejects(
		() => service.sync([task!], { discoveredTaskCount: 1, filteredTaskCount: 0, exportedTaskCount: 1 }, DEFAULT_SETTINGS),
		(error: unknown) => {
			assert.ok(error instanceof SyncExecutionError);
			assert.equal(error.result.destinationResults.length, 2);
			assert.deepEqual(
				error.result.destinationResults.map((entry) => entry.status),
				["success", "failed"],
			);
			assert.equal(error.result.eventCount, 1);
			assert.equal(error.result.todoCount, 0);
			return true;
		},
	);
});

test("DiagnosticsService builds redacted diagnostics bundle", () => {
	const diagnostics = new DiagnosticsService().build({
		settings: {
			...DEFAULT_SETTINGS,
			githubUsername: "liuh886",
			githubGistId: "gist123",
			githubPersonalAccessToken: "ghp_secret_token",
			isSaveToGistEnabled: true,
		},
		readiness: new SyncReadinessService().evaluate({
			...DEFAULT_SETTINGS,
			githubUsername: "liuh886",
			githubGistId: "gist123",
			githubPersonalAccessToken: "ghp_secret_token",
			isSaveToGistEnabled: true,
		}),
		preview: {
			discoveredTaskCount: 12,
			filteredTaskCount: 2,
			exportedTaskCount: 10,
			eventCount: 4,
			todoCount: 6,
		},
		recentSyncResults: [
			{
				status: "partial",
				timestamp: "2026-04-03T12:00:00.000Z",
				message: "local ok, gist failed",
				destinationResults: [
					{ name: "local-file", status: "success", message: "Saved" },
					{ name: "github-gist", status: "failed", message: "rate limited" },
				],
			},
		],
	});

	assert.match(diagnostics, /"eventCount": 4/);
	assert.match(diagnostics, /"\*\*\*redacted\*\*\*"/);
	assert.doesNotMatch(diagnostics, /ghp_secret_token/);
	assert.match(diagnostics, /"status": "partial"/);
});

test("SyncPreviewService explains filtered reasons and todo downgrade reasons", async () => {
	const taskIndex = new TaskIndex();
	const taskFinder = new TaskFinder({
		cachedRead: async () => [
			"- [ ] 09:00 Team sync #task #ops",
			"- [ ] Write memo #task",
			"- [ ] Skip checkbox #ops",
		].join("\n"),
	} as never);
	const service = new TaskIndexingService(
		{
			cachedRead: async () => [
				"- [ ] 09:00 Team sync #task #ops",
				"- [ ] Write memo #task",
				"- [ ] Skip checkbox #ops",
			].join("\n"),
			getMarkdownFiles: () => [],
		} as never,
		{
			getFileCache: () => ({
				listItems: [
					{ position: { start: { line: 0 } } },
					{ position: { start: { line: 1 } } },
					{ position: { start: { line: 2 } } },
				],
				headings: [],
			}),
		} as never,
		taskIndex,
		taskFinder,
		new TaskIdentityService(),
	);

	await service.indexFile(
		{
			path: "Projects/A/2026-04-03.md",
			basename: "2026-04-03",
			vault: { getName: () => "Demo Vault" },
		} as never,
		{
			...DEFAULT_SETTINGS,
			sourceRules: [{ path: "Projects/A", category: "ProjectA" }],
			respectGlobalTaskFilter: true,
			globalTaskFilterTags: "#task",
			includeEventsOrTodos: "EventsAndTodos",
		},
	);

	const preview = new SyncPreviewService(new IcalService()).build(
		service.getAllTasks(),
		service.getIndexStats(),
		{
			...DEFAULT_SETTINGS,
			sourceRules: [{ path: "Projects/A", category: "ProjectA" }],
			respectGlobalTaskFilter: true,
			globalTaskFilterTags: "#task",
			includeEventsOrTodos: "EventsAndTodos",
		},
	);

	assert.deepEqual(preview.filteredReasons, [{ reason: "Missing required global task tag", count: 1 }]);
	assert.deepEqual(preview.todoReasons, [{ reason: "Task has a date but no time, so it is exported as VTODO", count: 1 }]);
});
