import { requestUrl } from "obsidian";
import { Settings } from "./Model/Settings";

export class GistClient {
	private settings: Settings;

	constructor(settings: Settings) {
		this.settings = settings;
	}

	public async save(calendarContent: string): Promise<boolean> {
		const { githubPersonalAccessToken, githubGistId, filename, isDebug } = this.settings;

		if (!githubPersonalAccessToken || !githubGistId) {
			if (isDebug) console.log("iCal Pro: Gist sync skipped - missing Token or Gist ID.");
			return false;
		}

		const fname = filename || "obsidian.ics";
		
		if (isDebug) {
			console.log("iCal Pro: Starting Gist Sync...");
			console.log(`iCal Pro: Target Gist ID: ${githubGistId}`);
			console.log(`iCal Pro: Target Filename: ${fname}`);
			console.log(`iCal Pro: Content Length: ${calendarContent.length} chars`);
		}

		try {
			const response = await requestUrl({
				url: `https://api.github.com/gists/${githubGistId}`,
				method: "PATCH",
				headers: {
					"Authorization": `Bearer ${githubPersonalAccessToken}`,
					"Accept": "application/vnd.github.v3+json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					files: {
						[fname]: {
							content: calendarContent,
						},
					},
				}),
			});

			if (response.status === 200) {
				if (isDebug) console.log("iCal Pro: Gist updated successfully!");
				return true;
			} else {
				const errorMsg = `GitHub API Error ${response.status}: ${response.text}`;
				console.error("iCal Pro: Gist Update Failed.", errorMsg);
				throw new Error(errorMsg);
			}
		} catch (error) {
			if (error.status === 404) {
				throw new Error(`Gist not found. Check your Gist ID and ensure file '${fname}' exists in it.`);
			}
			throw error;
		}
	}
}
