import { App, PluginSettingTab, Setting, normalizePath, setIcon, Notice } from "obsidian";
import ObsidianIcalPlugin from "./ObsidianIcalPlugin";
import { FolderSuggest } from "./FolderSuggest";
import { HOW_TO_PARSE_INTERNAL_LINKS, HOW_TO_PROCESS_MULTIPLE_DATES } from "./Model/Settings";

export class SettingsTab extends PluginSettingTab {
	plugin: ObsidianIcalPlugin;

	constructor(app: App, plugin: ObsidianIcalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Header ---
		const header = containerEl.createDiv({ cls: "ical-pro-header" });
		const headerText = header.createDiv({ cls: "ical-pro-header-title" });
		headerText.createEl("h2", { text: "iCal Pro" });
		headerText.createEl("span", { text: "v" + this.plugin.manifest.version, cls: "ical-pro-version" });

		// --- Live Status Card ---
		const statusCard = containerEl.createDiv({ cls: "ical-pro-status-card" });
		const statusGrid = statusCard.createDiv({ cls: "ical-pro-status-grid" });
		
		const urlCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const statusTitle = urlCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(statusTitle, "link");
		statusTitle.createSpan({ text: " Subscription URL" });
		const urlContainer = urlCol.createDiv({ cls: "ical-url-container" });
		this.renderUrl(urlContainer);

		const syncCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const syncTitle = syncCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(syncTitle, "refresh-cw");
		syncTitle.createSpan({ text: " Sync Status" });
		const syncInfo = syncCol.createDiv({ cls: "ical-sync-info" });
		syncInfo.createEl("div", { text: `Result: ${this.plugin.lastSyncStatus}`, cls: `ical-status-${this.plugin.lastSyncStatus.toLowerCase()}` });
		syncInfo.createEl("div", { text: `At: ${this.plugin.lastSyncTime}`, cls: "ical-sync-time" });
		
		const syncBtn = syncCol.createEl("button", { text: "Sync Now", cls: "mod-cta ical-sync-button" });
		syncBtn.onClickEvent(async () => {
			syncBtn.setDisabled(true);
			syncBtn.setText("Syncing...");
			try {
				await this.plugin.saveCalendar();
				new Notice("iCal Pro: Sync successful!");
				this.display();
			} catch (e) {
				new Notice("iCal Pro: Sync failed.");
				this.display();
			}
		});

		// --- SECTION 1: TASK SOURCES ---
		this.addHeader(containerEl, "search", "1. Task Sources");
		
		new Setting(containerEl)
			.setName("Target Directory")
			.setDesc("Scan tasks within this folder. Type to search.")
			.addText((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setPlaceholder("Search folder...")
					.setValue(this.plugin.settings.rootPath)
					.onChange(async (value) => {
						this.plugin.settings.rootPath = normalizePath(value);
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					});
			});

		// --- SECTION 2: DATE & ALARM LOGIC ---
		this.addHeader(containerEl, "calendar-days", "2. Date & Alarm Logic");

		new Setting(containerEl)
			.setName("Day Planner Mode")
			.setDesc("Heading = Date, Line = Time.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.isDayPlannerPluginFormatEnabled)
					.onChange(async (value) => {
						this.plugin.settings.isDayPlannerPluginFormatEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl)
			.setName("Enable Alarms")
			.setDesc("Include VALARM alerts in the calendar.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableAlarms)
					.onChange(async (value) => {
						this.plugin.settings.enableAlarms = value;
						await this.plugin.saveSettings();
					})
			);

		// --- SECTION 3: FILTERING RULES ---
		this.addHeader(containerEl, "filter", "3. Filtering Rules");

		new Setting(containerEl)
			.setName("Include Tags")
			.setDesc("Only sync tasks containing these tags (space separated).")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.isIncludeTasksWithTags).onChange(async v => { this.plugin.settings.isIncludeTasksWithTags = v; await this.plugin.saveSettings(); }))
			.addText((text) => text.setPlaceholder("#work #sync").setValue(this.plugin.settings.includeTasksWithTags).onChange(async v => { this.plugin.settings.includeTasksWithTags = v; await this.plugin.saveSettings(); }));

		new Setting(containerEl)
			.setName("Exclude Tags")
			.setDesc("Ignore tasks with these tags.")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.isExcludeTasksWithTags).onChange(async v => { this.plugin.settings.isExcludeTasksWithTags = v; await this.plugin.saveSettings(); }))
			.addText((text) => text.setPlaceholder("#private").setValue(this.plugin.settings.excludeTasksWithTags).onChange(async v => { this.plugin.settings.excludeTasksWithTags = v; await this.plugin.saveSettings(); }));

		new Setting(containerEl)
			.setName("Ignore Completed")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.ignoreCompletedTasks).onChange(async v => { this.plugin.settings.ignoreCompletedTasks = v; await this.plugin.saveSettings(); }));

		// --- SECTION 4: SAVE DESTINATIONS ---
		this.addHeader(containerEl, "cloud", "4. Save Destinations");

		// Local Save
		new Setting(containerEl)
			.setName("Save to Local File")
			.setDesc("Save the .ics file to your vault storage (best for iCloud/Dropbox).")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.isSaveToFileEnabled).onChange(async v => { this.plugin.settings.isSaveToFileEnabled = v; await this.plugin.saveSettings(); }));

		new Setting(containerEl)
			.setName("Local Save Path")
			.setDesc("Specify a folder for the local .ics file.")
			.addText((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setValue(this.plugin.settings.savePath).onChange(async v => { this.plugin.settings.savePath = normalizePath(v); await this.plugin.saveSettings(); });
			});

		// Gist Save
		new Setting(containerEl)
			.setName("Sync to GitHub Gist")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.isSaveToGistEnabled).onChange(async v => { this.plugin.settings.isSaveToGistEnabled = v; await this.plugin.saveSettings(); }));

		new Setting(containerEl)
			.setName("GitHub Username")
			.addText((text) => text.setValue(this.plugin.settings.githubUsername).onChange(async v => { this.plugin.settings.githubUsername = v; await this.plugin.saveSettings(); this.updateUrlDisplay(); }));

		new Setting(containerEl)
			.setName("Gist ID")
			.addText((text) => text.setValue(this.plugin.settings.githubGistId).onChange(async v => { this.plugin.settings.githubGistId = v; await this.plugin.saveSettings(); this.updateUrlDisplay(); }));

		new Setting(containerEl)
			.setName("Personal Access Token")
			.addText((text) => text.setPlaceholder("ghp_...").setValue(this.plugin.settings.githubPersonalAccessToken).onChange(async v => { this.plugin.settings.githubPersonalAccessToken = v; await this.plugin.saveSettings(); }));

		// --- SECTION 5: ADVANCED & DEBUG ---
		this.addHeader(containerEl, "sliders", "5. Advanced & Diagnostics");

		new Setting(containerEl)
			.setName("Obsidian Link Location")
			.setDesc("Where to place the obsidian:// link.")
			.addDropdown((dropdown) =>
				dropdown.addOption("Both", "Both (Description & Location)")
					.addOption("Description", "Description only")
					.addOption("Location", "Location only")
					.setValue(this.plugin.settings.isIncludeLinkInDescription ? "Both" : "Location") // Simplified logic for UI
					.onChange(async (v) => {
						this.plugin.settings.isIncludeLinkInDescription = (v === "Both" || v === "Description");
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Debug Mode")
			.setDesc("Enable verbose logging in the console (Ctrl+Shift+I).")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.isDebug).onChange(async v => { this.plugin.settings.isDebug = v; await this.plugin.saveSettings(); }));

		new Setting(containerEl)
			.setName("Sync Interval")
			.addSlider((slider) => slider.setLimits(5, 120, 5).setValue(this.plugin.settings.periodicSaveInterval).setDynamicTooltip().onChange(async v => { this.plugin.settings.periodicSaveInterval = v; await this.plugin.saveSettings(); }));
	}

	private addHeader(el: HTMLElement, icon: string, text: string) {
		const header = el.createDiv({ cls: "ical-pro-section-header" });
		const iconEl = header.createDiv({ cls: "ical-pro-section-icon" });
		setIcon(iconEl, icon);
		header.createEl("h3", { text: text });
	}

	private updateUrlDisplay() {
		const container = this.containerEl.querySelector(".ical-url-container");
		if (container) {
			container.empty();
			this.renderUrl(container as HTMLElement);
		}
	}

	private renderUrl(container: HTMLElement) {
		const username = this.plugin.settings.githubUsername;
		const gistId = this.plugin.settings.githubGistId;
		let filename = this.plugin.settings.filename || "obsidian.ics";
		if (username && gistId) {
			const url = `https://gist.githubusercontent.com/${username}/${gistId}/raw/${filename}`;
			container.createEl("code", { text: url, cls: "ical-url-text" });
			const copyBtn = container.createEl("button", { text: "Copy URL", cls: "mod-cta" });
			copyBtn.onClickEvent(() => {
				navigator.clipboard.writeText(url);
				copyBtn.setText("Copied!");
				setTimeout(() => copyBtn.setText("Copy URL"), 2000);
			});
		} else {
			container.createEl("p", { text: "GitHub sync not configured.", cls: "ical-url-placeholder" });
		}
	}
}
