import { HeadingCache } from "obsidian";
import { moment } from "obsidian";

export class HeadingsHelper {
	private headings: HeadingCache[];

	constructor(headings: HeadingCache[]) {
		this.headings = headings || [];
	}

	public hasHeadings(): boolean {
		return this.headings.length > 0;
	}

	public getHeadingForMarkdownLineNumber(lineNumber: number): { getDate: Date | null } | null {
		// Find the closest heading above the given line number
		let closestHeading: HeadingCache | null = null;

		for (const heading of this.headings) {
			if (heading.position.start.line < lineNumber) {
				closestHeading = heading;
			} else {
				break;
			}
		}

		if (!closestHeading) return null;

		// Extract date from heading text (e.g., "## 2026-04-02")
		const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
		const match = closestHeading.heading.match(dateRegex);
		
		if (match) {
			const date = moment(match[1], "YYYY-MM-DD").toDate();
			return { getDate: date };
		}

		return null;
	}
}
