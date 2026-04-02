import { Vault, normalizePath, TFolder, TFile } from "obsidian";
import { Settings } from "./Model/Settings";

export class FileClient {
	private vault: Vault;
	private settings: Settings;

	constructor(vault: Vault, settings: Settings) {
		this.vault = vault;
		this.settings = settings;
	}

	public async save(calendar: string): Promise<void> {
		const { savePath, filename } = this.settings;
		const path = normalizePath(savePath);
		const fname = filename || "obsidian.ics";
		const fullPath = path === "/" ? fname : `${path}/${fname}`;

		const folder = this.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder) && path !== "/") {
			await this.vault.createFolder(path);
		}

		const file = this.vault.getAbstractFileByPath(fullPath);
		if (file instanceof TFile) {
			await this.vault.modify(file, calendar);
		} else {
			await this.vault.create(fullPath, calendar);
		}
	}
}
