import { Settings } from "../Model/Settings";

export interface SyncReadiness {
	ready: boolean;
	activeDestinations: string[];
	issues: string[];
}

export class SyncReadinessService {
	public evaluate(settings: Settings): SyncReadiness {
		const activeDestinations: string[] = [];
		const issues: string[] = [];

		if (settings.isSaveToFileEnabled) {
			activeDestinations.push("local-file");
			if (!settings.savePath) {
				issues.push("Local file export is enabled but no save path is configured.");
			}
		}

		if (settings.isSaveToGistEnabled) {
			activeDestinations.push("github-gist");
			if (!settings.githubUsername) {
				issues.push("GitHub Gist sync is enabled but username is missing.");
			}
			if (!settings.githubGistId) {
				issues.push("GitHub Gist sync is enabled but Gist ID is missing.");
			}
			if (!settings.githubPersonalAccessToken) {
				issues.push("GitHub Gist sync is enabled but personal access token is missing.");
			}
		}

		if (activeDestinations.length === 0) {
			issues.push("No active calendar destination. Enable local file export or GitHub Gist sync.");
		}

		return {
			ready: issues.length === 0,
			activeDestinations,
			issues,
		};
	}
}
