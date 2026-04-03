import { TaskStatus } from "./TaskStatus";
import { TaskDate } from "./TaskDate";

export class Task {
	public status: TaskStatus;
	public dates: TaskDate[];
	public summary: string;
	public fileUri: string;
	public sourceKey: string;
	public body: string;
	public alarmOffset: number | null; // minutes, null means no alarm
	public priority: number | null;
	public recurrenceRule: string | null;
	public categories: string[];
	public completedAt: Date | null;
	public durationMinutes: number | null;
	private stableId: string | null = null;

	constructor(
		status: TaskStatus,
		dates: TaskDate[],
		summary: string,
		fileUri: string,
		sourceKey: string,
		body: string = "",
		alarmOffset: number | null = null,
		priority: number | null = null,
		recurrenceRule: string | null = null,
		categories: string[] = [],
		completedAt: Date | null = null,
		durationMinutes: number | null = null,
	) {
		this.status = status;
		this.dates = dates;
		this.summary = summary;
		this.fileUri = fileUri;
		this.sourceKey = sourceKey;
		this.body = body;
		this.alarmOffset = alarmOffset;
		this.priority = priority;
		this.recurrenceRule = recurrenceRule;
		this.categories = categories;
		this.completedAt = completedAt;
		this.durationMinutes = durationMinutes;
	}

	public getId(): string {
		if (this.stableId) {
			return this.stableId;
		}

		const source = this.sourceKey || `${this.fileUri}:${this.summary}`;
		let hash = 0;
		for (let i = 0; i < source.length; i++) {
			const char = source.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return `obsidian-ical-${Math.abs(hash)}`;
	}

	public setStableId(stableId: string): void {
		this.stableId = stableId;
	}

	public hasA(taskDateName: string): boolean {
		return this.dates.some((taskDate) => {
			return taskDate.name === taskDateName;
		});
	}

	public hasAnyDate(): boolean {
		return this.dates.length > 0;
	}

	public hasTimedDate(): boolean {
		return this.dates.some((taskDate) => {
			const date = taskDate.date;
			return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
		});
	}

	public getDate(taskDateName: string | null, format: string): string {
		if (this.dates.length === 0) {
			return "";
		}

		if (taskDateName === null) {
			taskDateName = this.dates[0].name;
		}

		const matchingTaskDate = this.dates.find((taskDate) => {
			if (taskDate.name === taskDateName) {
				return taskDate.date;
			}
		});

		if (typeof matchingTaskDate === "undefined") {
			return "";
		}

		return formatTaskDate(matchingTaskDate.date, format);
	}

	public getRawDate(taskDateName: string | null): Date | null {
		if (this.dates.length === 0) return null;
		if (taskDateName === null) taskDateName = this.dates[0].name;
		const matching = this.dates.find(d => d.name === taskDateName);
		return matching ? matching.date : null;
	}

	public getSummary(): string {
		return this.summary;
	}

	public getBody(): string {
		return this.body;
	}

	public getLocation(): string {
		return this.fileUri;
	}

	public getPriority(): number | null {
		return this.priority;
	}

	public getRecurrenceRule(): string | null {
		return this.recurrenceRule;
	}

	public getCategories(): string[] {
		return this.categories;
	}

	public setCategories(categories: string[]): void {
		this.categories = [...new Set([...this.categories, ...categories])];
	}

	public getCompletedAt(): Date | null {
		return this.completedAt;
	}

	public getDurationMinutes(): number | null {
		return this.durationMinutes;
	}
}

function formatTaskDate(date: Date, format: string): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	const hours = `${date.getHours()}`.padStart(2, "0");
	const minutes = `${date.getMinutes()}`.padStart(2, "0");
	const seconds = `${date.getSeconds()}`.padStart(2, "0");

	switch (format) {
		case "YYYYMMDD":
			return `${year}${month}${day}`;
		case "YYYYMMDDTHHmmss":
		case "YYYYMMDD[T]HHmmss":
			return `${year}${month}${day}T${hours}${minutes}${seconds}`;
		default:
			return `${year}${month}${day}`;
	}
}
