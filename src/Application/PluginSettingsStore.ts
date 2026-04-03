import { Plugin } from "obsidian";
import { prepareSettingsForSave, Settings } from "../Model/Settings";
import { DestinationSyncResult } from "./CalendarSyncService";
import { TaskIdentityState } from "./TaskIdentityService";

const TASK_IDENTITY_STATE_KEY = "_taskIdentityState";
const SYNC_HISTORY_KEY = "_syncHistory";

export interface SyncHistoryEntry {
	status: "success" | "partial" | "failed";
	timestamp: string;
	message: string;
	destinationResults: DestinationSyncResult[];
}

export class PluginSettingsStore {
	constructor(private readonly plugin: Plugin) {}

	public async load(): Promise<Record<string, unknown> | null> {
		return await this.plugin.loadData();
	}

	public loadTaskIdentityState(raw: Record<string, unknown> | null): TaskIdentityState {
		const state = raw?.[TASK_IDENTITY_STATE_KEY];
		return typeof state === "object" && state !== null ? state as TaskIdentityState : {};
	}

	public loadSyncHistory(raw: Record<string, unknown> | null): SyncHistoryEntry[] {
		const history = raw?.[SYNC_HISTORY_KEY];
		return Array.isArray(history) ? history as SyncHistoryEntry[] : [];
	}

	public async save(settings: Settings, taskIdentityState: TaskIdentityState, syncHistory: SyncHistoryEntry[] = []): Promise<void> {
		const persistedSettings = prepareSettingsForSave(settings);
		await this.plugin.saveData({
			...persistedSettings,
			[TASK_IDENTITY_STATE_KEY]: taskIdentityState,
			[SYNC_HISTORY_KEY]: syncHistory.slice(0, 10),
		});
	}
}
