import { Settings } from "../Model/Settings";
import { Task } from "../Model/Task";

export interface ReasonCount {
	reason: string;
	count: number;
}

export interface TaskFilterReport {
	tasks: Task[];
	reasons: ReasonCount[];
}

export class TaskFilterPolicy {
	public apply(tasks: Task[], settings: Settings): Task[] {
		return this.applyWithReport(tasks, settings).tasks;
	}

	public applyWithReport(tasks: Task[], settings: Settings): TaskFilterReport {
		const filteredTasks: Task[] = [];
		const reasonCounts = new Map<string, number>();

		tasks.forEach((task) => {
			const reason = this.getFirstFailureReason(task, settings);
			if (reason) {
				reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
				return;
			}

			filteredTasks.push(task);
		});

		return {
			tasks: filteredTasks,
			reasons: [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count })),
		};
	}

	private getFirstFailureReason(task: Task, settings: Settings): string | null {
		const categories = new Set(task.getCategories());

		if (settings.respectGlobalTaskFilter) {
			const requiredTags = this.parseFilterList(settings.globalTaskFilterTags, true);
			if (requiredTags.length > 0 && !requiredTags.some((tag) => categories.has(tag))) {
				return "Missing required global task tag";
			}
		}

		if (settings.isIncludeTasksWithTags) {
			const includeTags = this.parseFilterList(settings.includeTasksWithTags, true);
			if (includeTags.length > 0 && !includeTags.some((tag) => categories.has(tag))) {
				return "Missing required include tag";
			}
		}

		if (settings.isExcludeTasksWithTags) {
			const excludeTags = this.parseFilterList(settings.excludeTasksWithTags, true);
			if (excludeTags.some((tag) => categories.has(tag))) {
				return "Matched excluded tag";
			}
		}

		if (settings.isIncludeCategoriesEnabled) {
			const includes = this.parseFilterList(settings.includeCategories, false);
			if (includes.length > 0 && !includes.some((value) => categories.has(value))) {
				return "Missing required category";
			}
		}

		if (settings.isExcludeCategoriesEnabled) {
			const excludes = this.parseFilterList(settings.excludeCategories, false);
			if (excludes.some((value) => categories.has(value))) {
				return "Matched excluded category";
			}
		}

		return null;
	}

	private parseFilterList(value: string, stripHash: boolean): string[] {
		return value
			.split(/\s+/)
			.map((item) => item.trim())
			.filter((item) => item.length > 0)
			.map((item) => stripHash ? item.replace(/^#/, "") : item);
	}
}
