import { moment } from "obsidian";
import { TaskStatus } from "./TaskStatus";
import { TaskDate } from "./TaskDate";

export class Task {
	public status: TaskStatus;
	public dates: TaskDate[];
	public summary: string;
	public fileUri: string;
	public body: string;

	constructor(status: TaskStatus, dates: TaskDate[], summary: string, fileUri: string, body: string = "") {
		this.status = status;
		this.dates = dates;
		this.summary = summary;
		this.fileUri = fileUri;
		this.body = body;
	}

	public getId(): string {
		return crypto.randomUUID();
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
