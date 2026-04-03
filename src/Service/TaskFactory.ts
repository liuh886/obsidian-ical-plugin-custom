import { Task } from "../Model/Task";
import { TaskStatus } from "../Model/TaskStatus";
import { TaskDate } from "../Model/TaskDate";
import { Settings } from "../Model/Settings";

type ParsedTime = {
	hours: number;
	minutes: number;
	token: string;
	endHours?: number;
	endMinutes?: number;
};

export function createTaskFromLine(
	line: string,
	fileUri: string,
	sourceKey: string,
	dateOverride: Date | null,
	body: string,
	settings: Settings,
): Task | null {
	line = line.replace(/^\s*(?:>\s*)+/, "");

	const taskRegex = /^(\s*[*+-]\s*\[)(.)(\]\s*)(.*)$/;
	const match = line.match(taskRegex);
	if (!match) return null;

	const statusChar = match[2];
	const status = parseStatus(statusChar);
	
	if (status === TaskStatus.Done && settings.ignoreCompletedTasks) {
		return null;
	}

	let summary = match[4].trim();
	const categories = collectCategories(`${summary}\n${body}`);
	let priority = parsePriority(summary, status);
	summary = priority.summary;
	let recurrence = parseRecurrenceRule(summary);
	summary = recurrence.summary;
	const recurrenceRule = recurrence.rrule;

	// Parse Alarm ⏰
	let alarmOffset: number | null = null;
	const alarmRegex = /⏰\s*(\d+)?/;
	const alarmMatch = summary.match(alarmRegex);
	if (alarmMatch) {
		alarmOffset = alarmMatch[1] ? parseInt(alarmMatch[1]) : settings.defaultAlarmOffset;
		summary = summary.replace(alarmMatch[0], "").trim();
	}

	// Remove bold/italic
	summary = summary.replace(/\*\*|__/g, "").replace(/\*|_/g, "");

	// Handle Internal Links
	summary = parseInternalLinks(summary, settings.howToParseInternalLinks);
	const parsedTime = parseTimeToken(summary);

	const dates: TaskDate[] = [];
	let completedAtOverride: Date | null = null;

	// Parse emoji dates
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
			const date = applyParsedTime(parseIsoDate(dateMatch[1]), parsedTime);
			dates.push({ name: pattern.name, date });
			if (pattern.name === "Completion") {
				completedAtOverride = parseUtcDate(dateMatch[1]);
			}
			summary = summary.replace(dateMatch[0], "").trim();
		}
	}

	if (dateOverride && !dates.some((taskDate) => taskDate.name === "Due" || taskDate.name === "Start" || taskDate.name === "Scheduled")) {
		dates.push({ name: "Due", date: applyParsedTime(dateOverride, parsedTime) });
	}

	if (dates.length === 0) {
		const genericDateMatch = summary.match(/(\d{4}-\d{2}-\d{2})/);
		if (genericDateMatch) {
			const date = applyParsedTime(parseIsoDate(genericDateMatch[1]), parsedTime);
			dates.push({ name: "Due", date });
			summary = summary.replace(genericDateMatch[0], "").trim();
		}
	}

	if (parsedTime && dates.length > 0) {
		// Use a more aggressive replacement for the time token to handle ranges like "09:00 - 10:30"
		// If the token is followed by " - " and another time, we should probably remove that too
		const rangeRegex = new RegExp(`${escapeRegExp(parsedTime.token)}\\s*-\\s*\\d{1,2}:\\d{2}\\b`, "i");
		const rangeMatch = summary.match(rangeRegex);
		if (rangeMatch) {
			summary = summary.replace(rangeMatch[0], "").trim();
		} else {
			summary = summary.replace(parsedTime.token, "").trim();
		}
		summary = summary.replace(/\s{2,}/g, " ").trim();
	}

	summary = summary.replace(/(^|\s)#[^\s#]+/g, "$1").replace(/\s{2,}/g, " ").trim();

	// Handle ignoreOldTasks ONLY if dates exist
	if (settings.ignoreOldTasks && dates.length > 0) {
		const now = new Date();
		const thresholdDate = new Date(now.setDate(now.getDate() - settings.oldTaskInDays));
		const isOld = dates.every(d => d.date < thresholdDate);
		if (isOld) return null;
	}

	const completedAt = status === TaskStatus.Done
		? completedAtOverride ?? normalizeCompletedAt(dates.find((taskDate) => taskDate.name === "Completion")?.date) ?? new Date()
		: null;
	const durationMinutes = parsedTime?.endHours !== undefined && parsedTime.endMinutes !== undefined
		? ((parsedTime.endHours * 60 + parsedTime.endMinutes) - (parsedTime.hours * 60 + parsedTime.minutes) + 24 * 60) % (24 * 60) || null
		: null;

	return new Task(status, dates, summary, fileUri, sourceKey, body, alarmOffset, priority.value, recurrenceRule, categories, completedAt, durationMinutes);
}

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function parseStatus(statusChar: string): TaskStatus {
	switch (statusChar) {
		case "x":
		case "X":
			return TaskStatus.Done;
		case "/":
			return TaskStatus.InProgress;
		case "-":
			return TaskStatus.Cancelled;
		case "!":
			return TaskStatus.Important;
		default:
			return TaskStatus.Todo;
	}
}

function parsePriority(summary: string, status: TaskStatus): { summary: string; value: number | null } {
	if (summary.includes("⏫")) {
		return { summary: summary.replace(/⏫/g, "").trim(), value: 1 };
	}

	if (summary.includes("🔼")) {
		return { summary: summary.replace(/🔼/g, "").trim(), value: 5 };
	}

	if (summary.includes("🔽")) {
		return { summary: summary.replace(/🔽/g, "").trim(), value: 9 };
	}

	if (status === TaskStatus.Important) {
		return { summary, value: 1 };
	}

	return { summary, value: null };
}

function parseRecurrenceRule(summary: string): { summary: string; rrule: string | null } {
	const rules: Array<{ regex: RegExp; build: (match: RegExpMatchArray) => string }> = [
		{ regex: /\bevery weekday\b/i, build: () => "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
		{ regex: /\bevery weekend\b/i, build: () => "FREQ=WEEKLY;BYDAY=SA,SU" },
		{
			regex: /\bevery\s+(\d+)\s+weeks?\s+on\s+([a-z,\sand]+)\b/i,
			build: (match) => `FREQ=WEEKLY;INTERVAL=${match[1]};BYDAY=${parseByDayList(match[2])}`,
		},
		{
			regex: /\bevery\s+week\s+on\s+([a-z,\sand]+)\b/i,
			build: (match) => `FREQ=WEEKLY;BYDAY=${parseByDayList(match[1])}`,
		},
		{ regex: /\bevery\s+(\d+)\s+days?\b/i, build: (match) => `FREQ=DAILY;INTERVAL=${match[1]}` },
		{ regex: /\bevery day\b/i, build: () => "FREQ=DAILY" },
		{ regex: /\bevery\s+(\d+)\s+weeks?\b/i, build: (match) => `FREQ=WEEKLY;INTERVAL=${match[1]}` },
		{ regex: /\bevery week\b/i, build: () => "FREQ=WEEKLY" },
		{ regex: /\bevery\s+(\d+)\s+months?\b/i, build: (match) => `FREQ=MONTHLY;INTERVAL=${match[1]}` },
		{ regex: /\bevery month\b/i, build: () => "FREQ=MONTHLY" },
		{ regex: /\bevery\s+(\d+)\s+years?\b/i, build: (match) => `FREQ=YEARLY;INTERVAL=${match[1]}` },
		{ regex: /\bevery year\b/i, build: () => "FREQ=YEARLY" },
	];

	for (const rule of rules) {
		const match = summary.match(rule.regex);
		if (match) {
			return {
				summary: summary.replace(rule.regex, "").replace(/\s{2,}/g, " ").trim(),
				rrule: rule.build(match),
			};
		}
	}

	return { summary, rrule: null };
}

function parseByDayList(value: string): string {
	return value
		.split(/\s*(?:,|and)\s*/i)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map((item) => weekdayToByDay(item))
		.filter((item, index, values) => values.indexOf(item) === index)
		.join(",");
}

function weekdayToByDay(value: string): string {
	switch (value.toLowerCase()) {
		case "monday":
			return "MO";
		case "tuesday":
			return "TU";
		case "wednesday":
			return "WE";
		case "thursday":
			return "TH";
		case "friday":
			return "FR";
		case "saturday":
			return "SA";
		case "sunday":
			return "SU";
		default:
			return "MO";
	}
}

function collectCategories(value: string): string[] {
	const categories = new Set<string>();

	for (const match of value.matchAll(/(^|\s)#([^\s#.,!?;:]+)/g)) {
		if (match[2]) {
			categories.add(match[2]);
		}
	}

	return [...categories];
}

function parseTimeToken(summary: string): ParsedTime | null {
	const timeRangeMatch = summary.match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap]m)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*([ap]m)?\b/i);
	if (timeRangeMatch) {
		const start = normalizeTimeParts(timeRangeMatch[1], timeRangeMatch[2], timeRangeMatch[3]);
		const end = normalizeTimeParts(timeRangeMatch[4], timeRangeMatch[5], timeRangeMatch[6]);
		if (!start || !end) return null;

		return {
			hours: start.hours,
			minutes: start.minutes,
			token: timeRangeMatch[0],
			endHours: end.hours,
			endMinutes: end.minutes,
		};
	}

	// Match 09:00, 9:00, 9am, 9:00pm, etc.
	const timeMatch = summary.match(/\b(\d{1,2})(?::(\d{2}))\s*([ap]m)?\b|\b(\d{1,2})\s*([ap]m)\b/i);
	if (!timeMatch) return null;

	const normalized = normalizeTimeParts(timeMatch[1] || timeMatch[4], timeMatch[2], timeMatch[3] || timeMatch[5]);
	if (!normalized) return null;

	return {
		hours: normalized.hours,
		minutes: normalized.minutes,
		token: timeMatch[0],
	};
}

function normalizeTimeParts(rawHoursValue: string, rawMinutesValue?: string, rawMeridiemValue?: string | null): { hours: number; minutes: number } | null {
	const rawHours = parseInt(rawHoursValue, 10);
	const minutes = rawMinutesValue ? parseInt(rawMinutesValue, 10) : 0;
	const meridiem = rawMeridiemValue?.toLowerCase();

	if (Number.isNaN(rawHours) || Number.isNaN(minutes)) return null;
	if (!meridiem && rawHours > 23) return null;
	if (minutes > 59) return null;

	let hours = rawHours;
	if (meridiem) {
		if (hours < 1 || hours > 12) return null;
		if (meridiem === "pm" && hours !== 12) hours += 12;
		if (meridiem === "am" && hours === 12) hours = 0;
	}

	return { hours, minutes };
}


function applyParsedTime(baseDate: Date, parsedTime: ParsedTime | null): Date {
	if (!parsedTime) return baseDate;
	const nextDate = new Date(baseDate);
	nextDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
	return nextDate;
}

function parseIsoDate(value: string): Date {
	return new Date(`${value}T00:00:00`);
}

function parseUtcDate(value: string): Date {
	const [year, month, day] = value.split("-").map((part) => parseInt(part, 10));
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

function normalizeCompletedAt(date: Date | undefined): Date | null {
	if (!date) {
		return null;
	}

	return new Date(Date.UTC(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
	));
}
