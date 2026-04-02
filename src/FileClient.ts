import { TFile, Vault } from "obsidian";
import { SettingsManager } from "./SettingsManager";
import { log } from "./Logger";

export class FileClient {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	async save(calendar: string): Promise<void> {
		const settings = SettingsManager.settingsManager.settings;
		const fileRelativePath = `${settings.savePath ? settings.savePath + "/" : ""}${settings.saveFileName}${settings.saveFileExtension}`;
		const file = this.vault.getAbstractFileByPath(fileRelativePath);

		if (file instanceof TFile) {
			log("File exists: updating");
			await this.vault.modify(file, calendar);
		} else {
			log("File does not exist: creating");
			await this.vault.create(fileRelativePath, calendar);
		}
	}
}
