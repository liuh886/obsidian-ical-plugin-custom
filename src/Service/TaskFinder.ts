import { Vault, TFile } from "obsidian";
import { Task } from "../Model/Task";
import { Settings } from "../Model/Settings";
import { createTaskFromLine } from "./TaskFactory";
import { HeadingsHelper } from "./HeadingsHelper";

type TaskLineReference = {
	position: {
		start: {
			line: number;
		};
	};
};

export class TaskFinder {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	public async findTasks(file: TFile, listItemsCache: TaskLineReference[], headings: HeadingsHelper | null, settings: Settings): Promise<Task[]> {
		const fileCachedContent = await this.vault.cachedRead(file);
		const lines = fileCachedContent.split("\n");
		const fileUri = `obsidian://open?vault=${encodeURIComponent(file.vault.getName())}&file=${encodeURIComponent(file.path)}`;
		const fileDate = this.getDateFromFileName(file);

		const isTaskLine = (line: string) => /(\*|-)\s*\[.?]\s*/.test(this.normalizeTaskLine(line));
		const taskPositions = listItemsCache
			.map((item) => item.position.start.line)
			.filter((lineNo) => isTaskLine(lines[lineNo]));

		const results: Task[] = [];

		for (let i = 0; i < taskPositions.length; i++) {
			const startLine = taskPositions[i];
			const markdownLine = lines[startLine];
			const normalizedTaskLine = this.normalizeTaskLine(markdownLine);

			const nextTaskLine = i + 1 < taskPositions.length ? taskPositions[i + 1] : lines.length;
			const body = this.extractBody(lines, startLine, nextTaskLine);
			const dateOverride = this.resolveDateOverride(normalizedTaskLine, startLine, headings, settings, fileDate);

			const sourceKey = `${file.path}:${startLine}:${normalizedTaskLine.trim()}`;
			const task = createTaskFromLine(normalizedTaskLine, fileUri, sourceKey, dateOverride, body, settings);
			if (task) {
				results.push(task);
			}
		}

		return results;
	}

	private resolveDateOverride(
		line: string,
		lineNumber: number,
		headings: HeadingsHelper | null,
		settings: Settings,
		fileDate: Date | null,
	): Date | null {
		if (this.lineHasExplicitDate(line)) {
			return null;
		}

		if (settings.isDayPlannerPluginFormatEnabled && headings) {
			const headingDate = headings.resolveDateForLine(lineNumber);
			if (headingDate) {
				return headingDate;
			}
		}

		return fileDate;
	}

	private lineHasExplicitDate(line: string): boolean {
		return /[📅⏳🛫✅]\s*\d{4}-\d{2}-\d{2}|\b\d{4}-\d{2}-\d{2}\b/u.test(line);
	}

	private extractBody(lines: string[], startLine: number, nextTaskLine: number): string {
		const bodyLines: string[] = [];

		for (let lineIndex = startLine + 1; lineIndex < nextTaskLine; lineIndex++) {
			const currentLine = lines[lineIndex];
			const trimmed = currentLine.trim();

			if (trimmed === "" && lineIndex > startLine + 1) {
				break;
			}

			if (trimmed === "") {
				continue;
			}

			if (trimmed.startsWith(">") || trimmed.startsWith("-") || trimmed.startsWith("*") || /^\s+/.test(currentLine)) {
				bodyLines.push(trimmed);
				continue;
			}

			break;
		}

		return bodyLines.join("\n");
	}

	private getDateFromFileName(file: TFile): Date | null {
		const fileWithBaseName = file as TFile & { basename?: string };
		const fileName = fileWithBaseName.basename
			? String(fileWithBaseName.basename)
			: file.path.split("/").pop()?.replace(/\.md$/i, "") ?? "";
		return /^\d{4}-\d{2}-\d{2}$/.test(fileName) ? new Date(`${fileName}T00:00:00`) : null;
	}

	private normalizeTaskLine(line: string): string {
		return line.replace(/^\s*(?:>\s*)+/, "");
	}
}
