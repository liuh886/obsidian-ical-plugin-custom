import { Task } from "../Model/Task";
import { Settings } from "../Settings";
import { ICalBuilder } from "./ICalBuilder";

export class IcalService {
	public getCalendar(tasks: Task[], settings: Settings): string {
		const builder = new ICalBuilder();
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		builder
			.setCalendarName("Obsidian Calendar")
			.setTimezone(timezone)
			.setLastUpdated(new Date())
			.setRefreshInterval(settings.periodicSaveInterval || 15);

		const includeEvents = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "EventsOnly";
		const includeTodos = settings.includeEventsOrTodos === "EventsAndTodos" || settings.includeEventsOrTodos === "TodosOnly";

		if (includeEvents) {
			this.addEventsToBuilder(tasks, settings, builder);
		}

		if (includeTodos) {
			this.addToDosToBuilder(tasks, settings, builder);
		}

		return builder.build();
	}

	private addEventsToBuilder(tasks: Task[], settings: Settings, builder: ICalBuilder): void {
		tasks.forEach((task) => {
			this.addEventToBuilder(task, null, "", settings, builder);
		});
	}

	private addEventToBuilder(task: Task, dateStr: string | null, prependSummary: string, settings: Settings, builder: ICalBuilder): void {
		if (task.hasAnyDate() === false) {
			return;
		}

		if (dateStr === null) {
			switch (settings.howToProcessMultipleDates) {
				case "PreferStartDate":
					this.processSingleEvent(task, task.hasA("Start") ? "Start" : "Due", prependSummary, settings, builder);
					break;
				case "CreateMultipleEvents":
					if (task.hasA("Start")) this.processSingleEvent(task, "Start", "🛫 ", settings, builder);
					if (task.hasA("Scheduled")) this.processSingleEvent(task, "Scheduled", "⏳ ", settings, builder);
					if (task.hasA("Due")) this.processSingleEvent(task, "Due", "📅 ", settings, builder);
					break;
				default:
					this.processSingleEvent(task, task.hasA("Due") ? "Due" : "Start", prependSummary, settings, builder);
					break;
			}
		} else {
			this.renderEvent(task, dateStr, true, prependSummary, settings, builder);
		}
	}

	private processSingleEvent(task: Task, dateName: string, prepend: string, settings: Settings, builder: ICalBuilder) {
		const rawDate = task.getRawDate(dateName);
		if (!rawDate) return;

		// Detect if date has time. 
		// In Obsidian context, if the time is 00:00:00, it's likely an all-day event
		const hasTime = rawDate.getHours() !== 0 || rawDate.getMinutes() !== 0;
		const format = hasTime ? "YYYYMMDD[T]HHmmss" : "YYYYMMDD";
		const dateStr = task.getDate(dateName, format);
		
		this.renderEvent(task, dateStr, hasTime, prepend, settings, builder);
	}

	private renderEvent(task: Task, dateValue: string, hasTime: boolean, prepend: string, settings: Settings, builder: ICalBuilder) {
		builder.beginEvent();
		builder.addEventProperty("UID", task.getId(), false);
		builder.addEventProperty("DTSTAMP", task.getDate(null, "YYYYMMDDTHHmmss"), false);
		
		// If no time, use VALUE=DATE for all-day event
		const dateKey = hasTime ? "DTSTART" : "DTSTART;VALUE=DATE";
		builder.addEventProperty(dateKey, dateValue, false);
		
		// If it's a timed event and we have an end time (not supported yet in simple parser, so we add 30m)
		if (hasTime) {
			// Placeholder end time logic
		}

		builder.addEventProperty("SUMMARY", prepend + task.getSummary());
		
		const body = task.getBody();
		if (body) builder.addEventProperty("DESCRIPTION", body);
		
		builder.addEventProperty("LOCATION", task.getLocation());

		// Add Alarm if enabled
		if (settings.enableAlarms && task.alarmOffset !== null) {
			builder.addAlarm(task.alarmOffset, task.summary);
		}

		builder.endEvent();
	}

	private addToDosToBuilder(tasks: Task[], settings: Settings, builder: ICalBuilder): void {
		tasks.forEach((task) => {
			if (settings.isOnlyTasksWithoutDatesAreTodos && task.hasAnyDate()) return;
			
			builder.beginToDo();
			builder.addEventProperty("UID", task.getId(), false);
			builder.addEventProperty("SUMMARY", task.getSummary());
			
			if (task.hasAnyDate()) {
				builder.addEventProperty("DTSTAMP", task.getDate(null, "YYYYMMDDTHHmmss"), false);
			}

			const body = task.getBody();
			if (body) builder.addEventProperty("DESCRIPTION", body);

			builder.addEventProperty("LOCATION", task.getLocation());

			if (task.hasA("Due")) {
				builder.addEventProperty("DUE;VALUE=DATE", task.getDate("Due", "YYYYMMDD"), false);
			}

			builder.endToDo();
		});
	}
}
