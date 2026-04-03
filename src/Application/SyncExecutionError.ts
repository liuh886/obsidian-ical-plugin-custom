import type { SyncResult } from "./CalendarSyncService";

export class SyncExecutionError extends Error {
	constructor(
		message: string,
		public readonly result: SyncResult,
	) {
		super(message);
		this.name = "SyncExecutionError";
	}
}
