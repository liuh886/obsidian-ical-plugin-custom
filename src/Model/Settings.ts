export interface Settings {
	githubPersonalAccessToken: string;
	githubGistId: string;
	githubUsername: string;
	filename: string;
	isPeriodicSaveEnabled: boolean;
	periodicSaveInterval: number;
	isSaveToGistEnabled: boolean;
	isSaveToFileEnabled: boolean;
	isSaveToWebEnabled: boolean;
	savePath: string;
	saveFileName: string;
	saveFileExtension: string;
	howToParseInternalLinks: string;
	ignoreCompletedTasks: boolean;
	isDebug: boolean;
	includeEventsOrTodos: string;
	isOnlyTasksWithoutDatesAreTodos: boolean;
	ignoreOldTasks: boolean;
	oldTaskInDays: number;
	howToProcessMultipleDates: string;
	isDayPlannerPluginFormatEnabled: boolean;
	isIncludeTasksWithTags: boolean;
	includeTasksWithTags: string;
	isExcludeTasksWithTags: boolean;
	excludeTasksWithTags: string;
	rootPath: string;
	isIncludeLinkInDescription: boolean;
	secretKey: string;
	// Alarm Settings
	enableAlarms: boolean;
	defaultAlarmOffset: number;
}

export const HOW_TO_PARSE_INTERNAL_LINKS = {
	DoNotModifyThem: "Do not modify them (default)",
	KeepTitle: "Keep the title",
	PreferTitle: "Prefer the title",
	RemoveThem: "Remove them",
};

export const INCLUDE_EVENTS_OR_TODOS = {
	EventsOnly: "Events only",
	EventsAndTodos: "Events and TODO items",
	TodosOnly: "TODO items only",
};

export const HOW_TO_PROCESS_MULTIPLE_DATES = {
	PreferDueDate: "Prefer due date (default)",
	PreferStartDate: "Prefer start date",
	CreateMultipleEvents: "Create an event per start/scheduled/due date",
};

export const DEFAULT_SETTINGS: Settings = {
	githubPersonalAccessToken: "",
	githubGistId: "",
	githubUsername: "",
	filename: "obsidian.ics",
	isPeriodicSaveEnabled: true,
	periodicSaveInterval: 5,
	isSaveToGistEnabled: false,
	isSaveToFileEnabled: false,
	isSaveToWebEnabled: false,
	savePath: "",
	saveFileName: "",
	saveFileExtension: ".ical",
	howToParseInternalLinks: "DoNotModifyThem",
	ignoreCompletedTasks: false,
	isDebug: false,
	includeEventsOrTodos: "EventsAndTodos",
	isOnlyTasksWithoutDatesAreTodos: true,
	ignoreOldTasks: false,
	oldTaskInDays: 365,
	howToProcessMultipleDates: "PreferDueDate",
	isDayPlannerPluginFormatEnabled: false,
	isIncludeTasksWithTags: false,
	includeTasksWithTags: "#calendar",
	isExcludeTasksWithTags: false,
	excludeTasksWithTags: "#ignore",
	rootPath: "/",
	isIncludeLinkInDescription: false,
	secretKey: "",
	enableAlarms: true,
	defaultAlarmOffset: 20,
};
