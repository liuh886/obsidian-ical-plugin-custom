export class ICalBuilder {
	private lines: string[] = [];
	private readonly encoder = new TextEncoder();

	constructor() {
		this.lines.push("BEGIN:VCALENDAR");
		this.lines.push("VERSION:2.0");
		this.lines.push("PRODID:-//liuh886//obsidian-ical-plugin-pro v2.1.0//EN");
		this.lines.push("CALSCALE:GREGORIAN");
	}

	public setCalendarName(name: string): this {
		this.addProperty("X-WR-CALNAME", name);
		this.addProperty("NAME", name);
		return this;
	}

	public setTimezone(tz: string): this {
		this.lines.push(`X-WR-TIMEZONE:${tz}`);
		return this;
	}

	public setLastUpdated(date: Date): this {
		const formattedDate = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
		this.lines.push(`X-WR-DATE:${formattedDate}`);
		this.addProperty("X-WR-CALDESC", `Last updated at ${date.toLocaleString()}`);
		return this;
	}

	public setRefreshInterval(minutes: number): this {
		this.lines.push(`X-PUBLISHED-TTL:PT${minutes}M`);
		this.lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${minutes}M`);
		return this;
	}

	public addProperty(key: string, value: string): this {
		this.lines.push(`${key}:${this.escapeText(value)}`);
		return this;
	}

	public beginEvent(): this {
		this.lines.push("BEGIN:VEVENT");
		return this;
	}

	public endEvent(): this {
		this.lines.push("END:VEVENT");
		return this;
	}

	public beginToDo(): this {
		this.lines.push("BEGIN:VTODO");
		return this;
	}

	public endToDo(): this {
		this.lines.push("END:VTODO");
		return this;
	}

	public addAlarm(minutesBefore: number, summary: string): this {
		this.lines.push("BEGIN:VALARM");
		this.lines.push("ACTION:DISPLAY");
		this.lines.push(`DESCRIPTION:${this.escapeText(summary)}`);
		this.lines.push(`TRIGGER:-PT${minutesBefore}M`);
		this.lines.push("END:VALARM");
		return this;
	}

	public addEventProperty(key: string, value: string, escape = true): this {
		const escapedValue = escape ? this.escapeText(value) : value;
		this.lines.push(`${key}:${escapedValue}`);
		return this;
	}

	public build(): string {
		this.lines.push("END:VCALENDAR");
		return this.lines.map((line) => this.foldLine(line)).join("\r\n") + "\r\n";
	}

	private escapeText(text: string): string {
		if (!text) return "";
		return text
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n")
			.replace(/\r/g, "");
	}

	private foldLine(line: string): string {
		if (this.encoder.encode(line).length <= 75) {
			return line;
		}

		const segments: string[] = [];
		let currentSegment = "";

		for (const character of line) {
			const nextSegment = currentSegment + character;
			const prefixBytes = segments.length === 0 ? 0 : 1;
			if (this.encoder.encode(nextSegment).length + prefixBytes > 75) {
				segments.push(currentSegment);
				currentSegment = character;
				continue;
			}

			currentSegment = nextSegment;
		}

		if (currentSegment.length > 0) {
			segments.push(currentSegment);
		}

		return segments
			.map((segment, index) => (index === 0 ? segment : ` ${segment}`))
			.join("\r\n");
	}
}
