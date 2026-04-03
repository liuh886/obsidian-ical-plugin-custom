import { RequestUrlParam, RequestUrlResponse } from "obsidian";
import { Settings } from "../Model/Settings";

export interface ConnectionValidationResult {
	success: boolean;
	message: string;
}

type RequestFn = (request: RequestUrlParam) => Promise<RequestUrlResponse>;

export class ConnectionValidationService {
	constructor(private readonly requestFn: RequestFn) {}

	public async validateGist(settings: Settings): Promise<ConnectionValidationResult> {
		const { githubPersonalAccessToken, githubGistId } = settings;
		if (!githubPersonalAccessToken || !githubGistId) {
			return { success: false, message: "Token or Gist ID missing." };
		}

		try {
			const response = await this.requestFn({
				url: `https://api.github.com/gists/${githubGistId}`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${githubPersonalAccessToken}`,
					Accept: "application/vnd.github.v3+json",
				},
			});

			if (response.status === 200) {
				return { success: true, message: "Connection successful! Gist found." };
			}

			return { success: false, message: `GitHub returned status ${response.status}` };
		} catch {
			return { success: false, message: "Network error or invalid Token/Gist ID." };
		}
	}
}
