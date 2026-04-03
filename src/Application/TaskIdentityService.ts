import { Task } from "../Model/Task";

type IdentityRecord = {
	id: string;
	sourceKey: string;
	line: number;
	summary: string;
	body: string;
	datesKey: string;
};

export type TaskIdentityState = Record<string, IdentityRecord[]>;

export class TaskIdentityService {
	constructor(private readonly state: TaskIdentityState = {}) {}

	public assign(filePath: string, tasks: Task[]): void {
		const previousRecords = this.state[filePath] ?? [];
		const consumedRecords = new Set<number>();
		const nextRecords: IdentityRecord[] = [];

		for (const task of tasks) {
			const recordIndex = this.findBestMatch(task, previousRecords, consumedRecords);
			const stableId = recordIndex === -1 ? this.createId() : previousRecords[recordIndex].id;
			task.setStableId(stableId);

			if (recordIndex !== -1) {
				consumedRecords.add(recordIndex);
			}

			nextRecords.push(this.toRecord(task));
		}

		this.state[filePath] = nextRecords;
	}

	public removeFile(filePath: string): void {
		delete this.state[filePath];
	}

	public renameFile(oldPath: string, newPath: string): void {
		if (!this.state[oldPath]) {
			return;
		}

		this.state[newPath] = this.state[oldPath];
		delete this.state[oldPath];
	}

	public getState(): TaskIdentityState {
		return this.state;
	}

	private findBestMatch(task: Task, records: IdentityRecord[], consumedRecords: Set<number>): number {
		let bestIndex = -1;
		let bestScore = -1;

		records.forEach((record, index) => {
			if (consumedRecords.has(index)) {
				return;
			}

			const score = this.score(task, record);
			if (score > bestScore) {
				bestScore = score;
				bestIndex = index;
			}
		});

		return bestScore >= 50 ? bestIndex : -1;
	}

	private score(task: Task, record: IdentityRecord): number {
		if (task.sourceKey === record.sourceKey) {
			return 100;
		}

		const taskLine = this.extractLineNumber(task.sourceKey);
		let score = 0;

		if (taskLine !== null && taskLine === record.line) {
			score += 70;
		}

		if (task.summary === record.summary) {
			score += 20;
		}

		if (task.body === record.body) {
			score += 10;
		}

		if (this.getDatesKey(task) === record.datesKey) {
			score += 20;
		}

		return score;
	}

	private toRecord(task: Task): IdentityRecord {
		return {
			id: task.getId(),
			sourceKey: task.sourceKey,
			line: this.extractLineNumber(task.sourceKey) ?? -1,
			summary: task.summary,
			body: task.body,
			datesKey: this.getDatesKey(task),
		};
	}

	private getDatesKey(task: Task): string {
		return task.dates.map((date) => `${date.name}:${date.date.toISOString()}`).join("|");
	}

	private extractLineNumber(sourceKey: string): number | null {
		const match = sourceKey.match(/:(\d+):/);
		return match ? Number(match[1]) : null;
	}

	private createId(): string {
		return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: `obsidian-ical-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}
}
