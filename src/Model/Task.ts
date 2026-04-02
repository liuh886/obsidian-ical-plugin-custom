import { moment } from "obsidian";
import { TaskStatus } from "./TaskStatus";
import { TaskDate } from "./TaskDate";

export class Task {
	public status: TaskStatus;
	public dates: TaskDate[];
	public summary: string;
	public fileUri: string;
	public body: string;
	public alarmOffset: number | null; // minutes, null means no alarm

	constructor(status: TaskStatus, dates: TaskDate[], summary: string, fileUri: string, body: string = "", alarmOffset: number | null = null) {
		this.status = status;
		this.dates = dates;
		this.summary = summary;
		this.fileUri = fileUri;
		this.body = body;
		this.alarmOffset = alarmOffset;
	}

	public getId(): string {
		// Create a stable, deterministic ID based on the file URI and the content summary.
		// This prevents duplicates in calendar apps during re-syncs.
		const source = `${this.fileUri}:${this.summary}`;
		let hash = 0;
		for (let i = 0; i < source.length; i++) {
			const char = source.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return `obsidian-ical-${Math.abs(hash)}`;
	}

	public hasA(taskDateName: string): boolean {
		return this.dates.some((taskDate) => {
			return taskDate.name === taskDateName;
		});
	}

	public hasAnyDate(): boolean {
		return this.dates.length > 0;
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

		return moment(matchingTaskDate.date).format(format);
	}

	public getRawDate(taskDateName: string | null): Date | null {
		if (this.dates.length === 0) return null;
		if (taskDateName === null) taskDateName = this.dates[0].name;
		const matching = this.dates.find(d => d.name === taskDateName);
		return matching ? matching.date : null;
	}

	public getSummary(): string {
		const summary = this.summary
			.replace(/\\/gm, "\\\\")
			.replace(/\r?\n/gm, "\\n")
			.replace(/;/gm, "\\;")
			.replace(/,/gm, "\\,");

		return summary;
	}

	public getBody(): string {
		return this.body
			.replace(/\\/gm, "\\\\")
			.replace(/\r?\n/gm, "\\n")
			.replace(/;/gm, "\\;")
			.replace(/,/gm, "\\,");
	}

	public getLocation(): string {
		return this.fileUri;
	}
}
