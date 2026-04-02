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
		
		// Column 1: URL
		const urlCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const statusTitle = urlCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(statusTitle, "link");
		statusTitle.createSpan({ text: " Subscription URL" });
		const urlContainer = urlCol.createDiv({ cls: "ical-url-container" });
		this.renderUrl(urlContainer);

		// Column 2: Last Sync
		const syncCol = statusGrid.createDiv({ cls: "ical-pro-status-col" });
		const syncTitle = syncCol.createDiv({ cls: "ical-pro-card-title" });
		setIcon(syncTitle, "refresh-cw");
		syncTitle.createSpan({ text: " Sync Status" });
		const syncInfo = syncCol.createDiv({ cls: "ical-sync-info" });
		syncInfo.createEl("div", { text: `Last Result: ${this.plugin.lastSyncStatus}`, cls: `ical-status-${this.plugin.lastSyncStatus.toLowerCase()}` });
		syncInfo.createEl("div", { text: `At: ${this.plugin.lastSyncTime}`, cls: "ical-sync-time" });

		// --- SECTION 1: TASK SOURCES ---
		this.addHeader(containerEl, "search", "1. Task Sources");
		
		new Setting(containerEl)
			.setName("Target Directory")
			.setDesc("The folder where tasks will be scanned. Choose '/' for the entire vault.")
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

		// --- SECTION 2: DATE LOGIC ---
		this.addHeader(containerEl, "calendar-days", "2. Date & Time Logic");

		new Setting(containerEl)
			.setName("Day Planner Mode")
			.setDesc("Enable this if you use Day Planner style (Heading = Date, Line = Time).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isDayPlannerPluginFormatEnabled)
					.onChange(async (value) => {
						this.plugin.settings.isDayPlannerPluginFormatEnabled = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show correct tip
					})
			);

		const tip = containerEl.createEl("p", { cls: "ical-pro-logic-tip" });
		if (this.plugin.settings.isDayPlannerPluginFormatEnabled) {
			tip.setText("💡 Mode: Date inherited from Heading (## 2026-04-02).");
		} else {
			tip.setText("💡 Mode: Standard Emoji-based (📅 2026-04-02).");
		}

		// --- SECTION 3: GITHUB SYNC ---
		this.addHeader(containerEl, "cloud", "3. GitHub Sync Configuration");

		new Setting(containerEl)
			.setName("GitHub Username")
			.addText((text) =>
				text.setValue(this.plugin.settings.githubUsername)
					.onChange(async (value) => {
						this.plugin.settings.githubUsername = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Gist ID")
			.addText((text) =>
				text.setValue(this.plugin.settings.githubGistId)
					.onChange(async (value) => {
						this.plugin.settings.githubGistId = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Personal Access Token")
			.addText((text) =>
				text.setPlaceholder("ghp_...")
					.setValue(this.plugin.settings.githubPersonalAccessToken)
					.onChange(async (value) => {
						this.plugin.settings.githubPersonalAccessToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Verify Connection")
			.setDesc("Check if your Token and Gist ID are correctly configured.")
			.addButton((btn) => 
				btn.setButtonText("Test GitHub Sync")
					.onClick(async () => {
						btn.setDisabled(true);
						btn.setButtonText("Testing...");
						const result = await this.plugin.validateConnection();
						if (result.success) {
							new Notice("✅ " + result.message);
						} else {
							new Notice("❌ " + result.message);
						}
						btn.setDisabled(false);
						btn.setButtonText("Test GitHub Sync");
					})
			);

		// --- SECTION 4: ADVANCED ---
		this.addHeader(containerEl, "sliders", "4. Advanced Rules");

		new Setting(containerEl)
			.setName("Ignore Completed Tasks")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ignoreCompletedTasks)
					.onChange(async (value) => {
						this.plugin.settings.ignoreCompletedTasks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Sync Interval (Minutes)")
			.addSlider((slider) =>
				slider.setLimits(5, 120, 5)
					.setValue(this.plugin.settings.periodicSaveInterval)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.periodicSaveInterval = value;
						await this.plugin.saveSettings();
					})
			);
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
			container.createEl("p", { 
				text: "Awaiting GitHub Sync config...",
				cls: "ical-url-placeholder"
			});
		}
	}
}
