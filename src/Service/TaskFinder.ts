import { Vault, TFile, ListItemCache, HeadingCache } from "obsidian";
import { Task } from "../Model/Task";
import { Settings } from "../Settings";
import { createTaskFromLine } from "./TaskFactory";

export class TaskFinder {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	public async findTasks(file: TFile, listItemsCache: ListItemCache[], headings: any, settings: Settings): Promise<Task[]> {
		const fileCachedContent = await this.vault.cachedRead(file);
		const lines = fileCachedContent.split("\n");
		const fileUri = "obsidian://open?vault=" + file.vault.getName() + "&file=" + file.path;

		const isTaskLine = (line: string) => /(\*|-)\s*\[.?]\s*/.test(line);
		const taskPositions = listItemsCache
			.map((item) => item.position.start.line)
			.filter((lineNo) => isTaskLine(lines[lineNo]));

		const results: Task[] = [];

		for (let i = 0; i < taskPositions.length; i++) {
			const startLine = taskPositions[i];
			const markdownLine = lines[startLine];

			let bodyLines: string[] = [];
			const nextTaskLine = i + 1 < taskPositions.length ? taskPositions[i + 1] : lines.length;

			for (let j = startLine + 1; j < nextTaskLine; j++) {
				const currentLine = lines[j];
				const trimmed = currentLine.trim();

				if (trimmed === "" && j > startLine + 1) break;
				if (trimmed === "") continue;

				if (trimmed.startsWith(">") || trimmed.startsWith("-") || trimmed.startsWith("*") || /^\s+/.test(currentLine)) {
					bodyLines.push(trimmed);
				} else {
					break;
				}
			}

			const body = bodyLines.join("\\n");
			let dateOverride: Date | null = null;

			// Handle Day Planner dates if enabled
			if (settings.isDayPlannerPluginFormatEnabled && headings) {
				if (this.hasTimes(markdownLine)) {
					const heading = headings.getHeadingForMarkdownLineNumber(startLine);
					dateOverride = heading?.getDate ?? null;
				}
			}

			if (settings.isIncludeTasksWithTags) {
				if (!this.hasTag(markdownLine, settings.includeTasksWithTags)) {
					continue;
				}
			}

			if (settings.isExcludeTasksWithTags) {
				if (this.hasTag(markdownLine, settings.excludeTasksWithTags)) {
					continue;
				}
			}

			const task = createTaskFromLine(markdownLine, fileUri, dateOverride, body, settings);
			if (task) {
				results.push(task);
			}
		}

		return results;
	}

	private hasTimes(line: string): boolean {
		const timeRegExp = /\b((?<!\d{4}-\d{2}-)\d{1,2}:(\d{2})(?::\d{2})?\s*(?:[ap][m])?|(?<!\d{4}-\d{2}-)\d{1,2}\s*[ap][m])\b/gi;
		return timeRegExp.test(line);
	}

	private hasTag(line: string, tags: string): boolean {
		if (!tags.includes(" ")) {
			return line.includes(tags);
		}
		return tags.split(" ").some((tag) => line.includes(tag));
	}
}
