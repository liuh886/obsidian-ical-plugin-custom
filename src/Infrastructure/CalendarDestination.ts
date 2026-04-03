import { Settings } from "../Model/Settings";

export interface CalendarDestination {
	readonly name: string;
	isEnabled(settings: Settings): boolean;
	save(calendar: string, settings: Settings): Promise<void>;
}
