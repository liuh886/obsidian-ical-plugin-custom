export interface Settings {
	isIncludeTasksWithTags: boolean;
	includeTasksWithTags: string;
	isExcludeTasksWithTags: boolean;
	excludeTasksWithTags: string;
	includeEventsOrTodos: string;
	howToProcessMultipleDates: string;
	isDayPlannerPluginFormatEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	isIncludeTasksWithTags: false,
	includeTasksWithTags: "",
	isExcludeTasksWithTags: false,
	excludeTasksWithTags: "",
	includeEventsOrTodos: "EventsAndTodos",
	howToProcessMultipleDates: "PreferDueDate",
	isDayPlannerPluginFormatEnabled: false,
};
