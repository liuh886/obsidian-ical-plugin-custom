import { moment } from "obsidian";
import { Task } from "../Model/Task";
import { TaskStatus } from "../Model/TaskStatus";
import { TaskDate } from "../Model/TaskDate";
import { Settings } from "../Settings";

export function createTaskFromLine(line: string, fileUri: string, dateOverride: Date | null, body: string, settings: Settings): Task | null {
	const taskRegex = /^(\s*[*+-]\s*\[)(.)(\]\s*)(.*)$/;
	const match = line.match(taskRegex);
	if (!match) return null;

	const statusChar = match[2];
	const status = (statusChar === "x" || statusChar === "X") ? TaskStatus.Done : TaskStatus.Todo;
	
	if (status === TaskStatus.Done && settings.ignoreCompletedTasks) {
		return null;
	}

	let summary = match[4].trim();

	// Parse Alarm ⏰
	let alarmOffset: number | null = null;
	const alarmRegex = /⏰\s*(\d+)?/;
	const alarmMatch = summary.match(alarmRegex);
	if (alarmMatch) {
		// If digit exists use it, otherwise use settings default
		alarmOffset = alarmMatch[1] ? parseInt(alarmMatch[1]) : settings.defaultAlarmOffset;
		summary = summary.replace(alarmMatch[0], "").trim();
	}

	// Remove bold and italic formatting from summary
	summary = summary.replace(/\*\*|__/g, "").replace(/\*|_/g, "");

	// Handle Internal Links Parsing
	summary = parseInternalLinks(summary, settings.howToParseInternalLinks);

	const dates: TaskDate[] = [];

	// Parse emoji-based dates (Tasks plugin style)
	const datePatterns = [
		{ name: "Due", emoji: "📅" },
		{ name: "Scheduled", emoji: "⏳" },
		{ name: "Start", emoji: "🛫" },
		{ name: "Completion", emoji: "✅" }
	];

	for (const pattern of datePatterns) {
		const regex = new RegExp(`${pattern.emoji}\\s*(\\d{4}-\\d{2}-\\d{2})`, "u");
		const dateMatch = summary.match(regex);
		if (dateMatch) {
			const date = moment(dateMatch[1], "YYYY-MM-DD").toDate();
			dates.push({ name: pattern.name, date });
			summary = summary.replace(dateMatch[0], "").trim();
		}
	}

	// Handle date override from Day Planner if applicable
	if (dateOverride) {
		dates.push({ name: "Due", date: dateOverride });
	}

	// Simple fallback: if no dates found but summary has YYYY-MM-DD
	if (dates.length === 0) {
		const genericDateMatch = summary.match(/(\d{4}-\d{2}-\d{2})/);
		if (genericDateMatch) {
			const date = moment(genericDateMatch[1], "YYYY-MM-DD").toDate();
			dates.push({ name: "Due", date });
			summary = summary.replace(genericDateMatch[0], "").trim();
		}
	}

	if (dates.length === 0) return null;

	// Handle ignoreOldTasks
	if (settings.ignoreOldTasks) {
		const now = new Date();
		const thresholdDate = new Date(now.setDate(now.getDate() - settings.oldTaskInDays));
		const isOld = dates.every(d => d.date < thresholdDate);
		if (isOld) return null;
	}

	return new Task(status, dates, summary, fileUri, body, alarmOffset);
}

function parseInternalLinks(summary: string, mode: string): string {
	switch (mode) {
		case "RemoveThem":
			return summary.replace(/\[\[.*?\]\]/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim();
		case "KeepTitle":
		case "PreferTitle":
			summary = summary.replace(/\[\[.*?\|(.*?)\]\]/g, "$1");
			summary = summary.replace(/\[\[(.*?)\]\]/g, "$1");
			summary = summary.replace(/\[(.*?)\]\(.*?\)/g, "$1");
			return summary.trim();
		case "DoNotModifyThem":
		default:
			return summary;
	}
}
