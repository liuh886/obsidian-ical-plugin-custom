import { Task } from "../Model/Task";
import { Settings } from "../Settings";

export class IcalService {
	public getCalendar(tasks: Task[], settings: Settings): string {
		const includeEvents = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "EventsOnly";
		const includeTodos = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "TodosOnly";

		const events = includeEvents ? this.getEvents(tasks, settings) : "";
		const toDos = includeTodos ? this.getToDos(tasks, settings) : "";

		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		let calendar = "BEGIN:VCALENDAR\r\n" +
			"VERSION:2.0\r\n" +
			"PRODID:-//Andrew Brereton//obsidian-ical-plugin v2.0.1//EN\r\n" +
			"X-WR-CALNAME:Obsidian Calendar\r\n" +
			"NAME:Obsidian Calendar\r\n" +
			"CALSCALE:GREGORIAN\r\n" +
			"X-WR-TIMEZONE:" + timezone + "\r\n" +
			events +
			toDos +
			"END:VCALENDAR\r\n";

		return calendar;
	}

	private getEvents(tasks: Task[], settings: Settings): string {
		return tasks.map((task) => {
			return this.getEvent(task, null, "", settings);
		}).join("");
	}

	private getEvent(task: Task, date: string | null, prependSummary: string, settings: Settings): string {
		if (task.hasAnyDate() === false) {
			return "";
		}

		let event = "BEGIN:VEVENT\r\n" +
			"UID:" + task.getId() + "\r\n" +
			"DTSTAMP:" + task.getDate(null, "YYYYMMDDTHHmmss") + "\r\n";

		if (date === null) {
			switch (settings.howToProcessMultipleDates) {
				case "PreferStartDate":
					if (task.hasA("Start")) {
						event += "DTSTART:" + task.getDate("Start", "YYYYMMDD") + "\r\n";
					} else if (task.hasA("Due")) {
						event += "DTSTART:" + task.getDate("Due", "YYYYMMDD") + "\r\n";
					} else if (task.hasA("TimeStart") && task.hasA("TimeEnd")) {
						event += "DTSTART:" + task.getDate("TimeStart", "YYYYMMDD[T]HHmmss") + "\r\n";
						event += "DTEND:" + task.getDate("TimeEnd", "YYYYMMDD[T]HHmmss") + "\r\n";
					} else {
						event += "DTSTART:" + task.getDate(null, "YYYYMMDD") + "\r\n";
					}
					break;

				case "CreateMultipleEvents":
					event = "";
					if (task.hasA("Start")) {
						event += this.getEvent(task, task.getDate("Start", "YYYYMMDD"), "🛫 ", settings);
					}
					if (task.hasA("Scheduled")) {
						event += this.getEvent(task, task.getDate("Scheduled", "YYYYMMDD"), "⏳ ", settings);
					}
					if (task.hasA("Due")) {
						event += this.getEvent(task, task.getDate("Due", "YYYYMMDD"), "📅 ", settings);
					}
					if (event === "") {
						event += this.getEvent(task, task.getDate(null, "YYYYMMDD"), "", settings);
					}
					return event;

				case "PreferDueDate":
				default:
					if (task.hasA("Start") && task.hasA("Due")) {
						event += "DTSTART:" + task.getDate("Start", "YYYYMMDDTHHmmss") + "\r\n" +
							"DTEND:" + task.getDate("Due", "YYYYMMDDTHHmmss") + "\r\n";
					} else if (task.hasA("Due")) {
						event += "DTSTART:" + task.getDate("Due", "YYYYMMDD") + "\r\n";
					} else if (task.hasA("Start")) {
						event += "DTSTART:" + task.getDate("Start", "YYYYMMDD") + "\r\n";
					} else if (task.hasA("TimeStart") && task.hasA("TimeEnd")) {
						event += "DTSTART:" + task.getDate("TimeStart", "YYYYMMDD[T]HHmmss") + "\r\n";
						event += "DTEND:" + task.getDate("TimeEnd", "YYYYMMDD[T]HHmmss") + "\r\n";
					} else {
						event += "DTSTART:" + task.getDate(null, "YYYYMMDD") + "\r\n";
					}
					break;
			}
		} else {
			event += "DTSTART:" + date + "\r\n";
		}

		const body = task.getBody();
		const description = body ? "DESCRIPTION:" + body + "\r\n" : "";

		event += "SUMMARY:" + prependSummary + task.getSummary() + "\r\n" +
			description +
			"LOCATION:" + encodeURI(task.getLocation()) + "\r\n" +
			"END:VEVENT\r\n";

		return event;
	}

	private getToDos(tasks: Task[], settings: Settings): string {
		return tasks.map((task) => {
			return this.getToDo(task, settings);
		}).join("");
	}

	private getToDo(task: Task, settings: Settings): string {
		const body = task.getBody();
		const description = body ? "DESCRIPTION:" + body + "\r\n" : "";

		let toDo = "BEGIN:VTODO\r\n" +
			"UID:" + task.getId() + "\r\n" +
			"SUMMARY:" + task.getSummary() + "\r\n" +
			(task.hasAnyDate() ? "DTSTAMP:" + task.getDate(null, "YYYYMMDDTHHmmss") + "\r\n" : "") +
			description +
			"LOCATION:" + encodeURI(task.getLocation()) + "\r\n";

		if (task.hasA("Due")) {
			toDo += "DUE;VALUE=DATE:" + task.getDate("Due", "YYYYMMDD") + "\r\n";
		}

		return toDo + "END:VTODO\r\n";
	}
}
