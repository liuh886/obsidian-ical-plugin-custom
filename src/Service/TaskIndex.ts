import { Task } from "../Model/Task";

export class TaskIndex {
	private fileTasks: Map<string, Task[]> = new Map();

	public updateTasksForFile(path: string, tasks: Task[]): void {
		if (tasks.length === 0) {
			this.fileTasks.delete(path);
		} else {
			this.fileTasks.set(path, tasks);
		}
	}

	public removeFile(path: string): void {
		this.fileTasks.delete(path);
	}

	public getAllTasks(): Task[] {
		const allTasks: Task[] = [];
		for (const tasks of this.fileTasks.values()) {
			allTasks.push(...tasks);
		}
		return allTasks;
	}

	public clear(): void {
		this.fileTasks.clear();
	}
}
