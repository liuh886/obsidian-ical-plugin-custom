import { Plugin } from "obsidian";
import { Settings, DEFAULT_SETTINGS } from "./Model/Settings";
import { log } from "./Logger";

export class SettingsManager {
	private static instance: SettingsManager;
	private plugin: Plugin;
	public settings: Settings;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	public static async createInstance(plugin: Plugin): Promise<SettingsManager> {
		SettingsManager.instance = new SettingsManager(plugin);
		await SettingsManager.instance.loadSettings();
		return SettingsManager.instance;
	}

	public static get settingsManager(): SettingsManager {
		return SettingsManager.instance;
	}

	async loadSettings() {
		log("Load settings");
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
		await this.plugin.saveData(this.settings);
	}

	async saveSettings() {
		log("Save settings");
		await this.plugin.saveData(this.settings);
	}

	// Helper getters and setters for all settings
	get githubPersonalAccessToken(): string { return this.settings.githubPersonalAccessToken; }
	set githubPersonalAccessToken(value: string) { this.settings.githubPersonalAccessToken = value; this.saveSettings(); }

	get githubGistId(): string { return this.settings.githubGistId; }
	set githubGistId(value: string) { this.settings.githubGistId = value; this.saveSettings(); }

	get githubUsername(): string { return this.settings.githubUsername; }
	set githubUsername(value: string) { this.settings.githubUsername = value; this.saveSettings(); }

	get filename(): string { return this.settings.filename; }
	set filename(value: string) { this.settings.filename = value; this.saveSettings(); }

	get isPeriodicSaveEnabled(): boolean { return this.settings.isPeriodicSaveEnabled; }
	set isPeriodicSaveEnabled(value: boolean) { this.settings.isPeriodicSaveEnabled = value; this.saveSettings(); }

	get periodicSaveInterval(): number { return this.settings.periodicSaveInterval; }
	set periodicSaveInterval(value: number) { this.settings.periodicSaveInterval = value; this.saveSettings(); }

	get isSaveToGistEnabled(): boolean { return this.settings.isSaveToGistEnabled; }
	set isSaveToGistEnabled(value: boolean) { this.settings.isSaveToGistEnabled = value; this.saveSettings(); }

	get isSaveToFileEnabled(): boolean { return this.settings.isSaveToFileEnabled; }
	set isSaveToFileEnabled(value: boolean) { this.settings.isSaveToFileEnabled = value; this.saveSettings(); }

	get savePath(): string { return this.settings.savePath; }
	set savePath(value: string) { this.settings.savePath = value; this.saveSettings(); }

	get saveFileName(): string { return this.settings.saveFileName; }
	set saveFileName(value: string) { this.settings.saveFileName = value; this.saveSettings(); }

	get saveFileExtension(): string { return this.settings.saveFileExtension; }
	set saveFileExtension(value: string) { this.settings.saveFileExtension = value; this.saveSettings(); }

	get howToParseInternalLinks(): string { return this.settings.howToParseInternalLinks; }
	set howToParseInternalLinks(value: string) { this.settings.howToParseInternalLinks = value; this.saveSettings(); }

	get ignoreCompletedTasks(): boolean { return this.settings.ignoreCompletedTasks; }
	set ignoreCompletedTasks(value: boolean) { this.settings.ignoreCompletedTasks = value; this.saveSettings(); }

	get isDebug(): boolean { return this.settings.isDebug; }
	set isDebug(value: boolean) { this.settings.isDebug = value; this.saveSettings(); }

	get ignoreOldTasks(): boolean { return this.settings.ignoreOldTasks; }
	set ignoreOldTasks(value: boolean) { this.settings.ignoreOldTasks = value; this.saveSettings(); }

	get oldTaskInDays(): number { return this.settings.oldTaskInDays; }
	set oldTaskInDays(value: number) { this.settings.oldTaskInDays = value; this.saveSettings(); }

	get howToProcessMultipleDates(): string { return this.settings.howToProcessMultipleDates; }
	set howToProcessMultipleDates(value: string) { this.settings.howToProcessMultipleDates = value; this.saveSettings(); }

	get includeEventsOrTodos(): string { return this.settings.includeEventsOrTodos; }
	set includeEventsOrTodos(value: string) { this.settings.includeEventsOrTodos = value; this.saveSettings(); }

	get isOnlyTasksWithoutDatesAreTodos(): boolean { return this.settings.isOnlyTasksWithoutDatesAreTodos; }
	set isOnlyTasksWithoutDatesAreTodos(value: boolean) { this.settings.isOnlyTasksWithoutDatesAreTodos = value; this.saveSettings(); }

	get isDayPlannerPluginFormatEnabled(): boolean { return this.settings.isDayPlannerPluginFormatEnabled; }
	set isDayPlannerPluginFormatEnabled(value: boolean) { this.settings.isDayPlannerPluginFormatEnabled = value; this.saveSettings(); }

	get isIncludeTasksWithTags(): boolean { return this.settings.isIncludeTasksWithTags; }
	set isIncludeTasksWithTags(value: boolean) { this.settings.isIncludeTasksWithTags = value; this.saveSettings(); }

	get includeTasksWithTags(): string { return this.settings.includeTasksWithTags; }
	set includeTasksWithTags(value: string) { this.settings.includeTasksWithTags = value; this.saveSettings(); }

	get isExcludeTasksWithTags(): boolean { return this.settings.isExcludeTasksWithTags; }
	set isExcludeTasksWithTags(value: boolean) { this.settings.isExcludeTasksWithTags = value; this.saveSettings(); }

	get excludeTasksWithTags(): string { return this.settings.excludeTasksWithTags; }
	set excludeTasksWithTags(value: string) { this.settings.excludeTasksWithTags = value; this.saveSettings(); }

	get rootPath(): string { return this.settings.rootPath; }
	set rootPath(value: string) { this.settings.rootPath = value; this.saveSettings(); }

	get isIncludeLinkInDescription(): boolean { return this.settings.isIncludeLinkInDescription; }
	set isIncludeLinkInDescription(value: boolean) { this.settings.isIncludeLinkInDescription = value; this.saveSettings(); }

	get secretKey(): string { return this.settings.secretKey; }
	set secretKey(value: string) { this.settings.secretKey = value; this.saveSettings(); }

	get isSaveToWebEnabled(): boolean { return this.settings.isSaveToWebEnabled; }
	set isSaveToWebEnabled(value: boolean) { this.settings.isSaveToWebEnabled = value; this.saveSettings(); }
}

export let settings: SettingsManager;

export async function initSettingsManager(plugin: Plugin) {
	settings = await SettingsManager.createInstance(plugin);
	return settings;
}
