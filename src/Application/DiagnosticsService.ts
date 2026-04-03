import { Settings } from "../Model/Settings";
import type { SyncReadiness } from "./SyncReadinessService";
import type { SyncPreview } from "./SyncPreviewService";
import type { SyncHistoryEntry } from "./PluginSettingsStore";

export interface DiagnosticsInput {
	settings: Settings;
	readiness: SyncReadiness;
	preview: SyncPreview;
	recentSyncResults: SyncHistoryEntry[];
}

export class DiagnosticsService {
	public build(input: DiagnosticsInput): string {
		const payload = {
			generatedAt: new Date().toISOString(),
			settings: this.redactSettings(input.settings),
			readiness: input.readiness,
			preview: input.preview,
			recentSyncResults: input.recentSyncResults,
		};

		return JSON.stringify(payload, null, 2);
	}

	private redactSettings(settings: Settings) {
		return {
			...settings,
			githubPersonalAccessToken: settings.githubPersonalAccessToken ? "***redacted***" : "",
		};
	}
}
