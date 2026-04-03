import { Settings } from "../Model/Settings";
import { Task } from "../Model/Task";
import { IcalService } from "../Service/IcalService";
import { TaskIndexStats } from "./TaskIndexingService";
import { ReasonCount } from "./TaskFilterPolicy";

export interface SyncPreview {
	discoveredTaskCount: number;
	filteredTaskCount: number;
	exportedTaskCount: number;
	eventCount: number;
	todoCount: number;
	filteredReasons: ReasonCount[];
	todoReasons: ReasonCount[];
}

export class SyncPreviewService {
	constructor(private readonly icalService: IcalService) {}

	public build(tasks: Task[], indexStats: TaskIndexStats, settings: Settings): SyncPreview {
		const projection = this.icalService.getProjection(tasks, settings);
		return {
			discoveredTaskCount: indexStats.discoveredTaskCount,
			filteredTaskCount: indexStats.filteredTaskCount,
			exportedTaskCount: projection.exportedTaskCount,
			eventCount: projection.eventCount,
			todoCount: projection.todoCount,
			filteredReasons: indexStats.filteredReasons,
			todoReasons: projection.todoReasons,
		};
	}
}
