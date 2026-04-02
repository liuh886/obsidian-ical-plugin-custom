import { App, PluginSettingTab, Setting, normalizePath, setIcon } from "obsidian";
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

		// --- Live URL Card ---
		const statusCard = containerEl.createDiv({ cls: "ical-pro-status-card" });
		const statusTitle = statusCard.createDiv({ cls: "ical-pro-card-title" });
		setIcon(statusTitle, "link");
		statusTitle.createSpan({ text: " Your Subscription URL" });
		
		const urlContainer = statusCard.createDiv({ cls: "ical-url-container" });
		this.renderUrl(urlContainer);

		// --- SECTION 1: TASK SOURCES ---
		this.addHeader(containerEl, "search", "1. Task Sources");
		
		new Setting(containerEl)
			.setName("Target Directory")
			.setDesc("The plugin will only scan files inside this folder. Type to search.")
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

		const logicCard = containerEl.createDiv({ cls: "ical-pro-logic-info" });
		logicCard.createEl("strong", { text: "Current Mode: " });
		const modeText = logicCard.createSpan({ 
			text: this.plugin.settings.isDayPlannerPluginFormatEnabled ? "Day Planner Integration" : "Standard (Emoji-based)" 
		});

		new Setting(containerEl)
			.setName("Day Planner Mode")
			.setDesc("Enable this if you use Day Planner style (Heading = Date, Line = Time).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isDayPlannerPluginFormatEnabled)
					.onChange(async (value) => {
						this.plugin.settings.isDayPlannerPluginFormatEnabled = value;
						modeText.setText(value ? "Day Planner Integration" : "Standard (Emoji-based)");
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Multiple Dates Priority")
			.setDesc("Which date to use if a task has Start, Scheduled, and Due dates.")
			.addDropdown((dropdown) => {
				Object.entries(HOW_TO_PROCESS_MULTIPLE_DATES).forEach(([key, value]) => {
					dropdown.addOption(key, value);
				});
				dropdown.setValue(this.plugin.settings.howToProcessMultipleDates)
					.onChange(async (value) => {
						this.plugin.settings.howToProcessMultipleDates = value;
						await this.plugin.saveSettings();
					});
			});

		// --- SECTION 3: FILTERING RULES ---
		this.addHeader(containerEl, "filter", "3. Filtering Rules");

		new Setting(containerEl)
			.setName("Ignore Completed Tasks")
			.setDesc("Completed tasks will not be included in the calendar.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ignoreCompletedTasks)
					.onChange(async (value) => {
						this.plugin.settings.ignoreCompletedTasks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Filter by Include Tag")
			.setDesc("Only sync tasks containing these tags (space separated).")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.isIncludeTasksWithTags)
				.onChange(async (value) => {
					this.plugin.settings.isIncludeTasksWithTags = value;
					await this.plugin.saveSettings();
				}))
			.addText((text) => text
				.setPlaceholder("#calendar #sync")
				.setValue(this.plugin.settings.includeTasksWithTags)
				.onChange(async (value) => {
					this.plugin.settings.includeTasksWithTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Filter by Exclude Tag")
			.setDesc("Ignore tasks containing these tags.")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.isExcludeTasksWithTags)
				.onChange(async (value) => {
					this.plugin.settings.isExcludeTasksWithTags = value;
					await this.plugin.saveSettings();
				}))
			.addText((text) => text
				.setPlaceholder("#ignore #private")
				.setValue(this.plugin.settings.excludeTasksWithTags)
				.onChange(async (value) => {
					this.plugin.settings.excludeTasksWithTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Ignore Old Tasks")
			.setDesc("Do not sync tasks older than a certain number of days.")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.ignoreOldTasks)
				.onChange(async (value) => {
					this.plugin.settings.ignoreOldTasks = value;
					await this.plugin.saveSettings();
				}))
			.addText((text) => text
				.setPlaceholder("365")
				.setValue(String(this.plugin.settings.oldTaskInDays))
				.onChange(async (value) => {
					this.plugin.settings.oldTaskInDays = parseInt(value) || 365;
					await this.plugin.saveSettings();
				}));

		// --- SECTION 4: CONTENT FORMATTING ---
		this.addHeader(containerEl, "edit-3", "4. Content Formatting");

		new Setting(containerEl)
			.setName("Internal Links")
			.setDesc("How to handle [[Wikilinks]] and [Markdown](links) in task summaries.")
			.addDropdown((dropdown) => {
				Object.entries(HOW_TO_PARSE_INTERNAL_LINKS).forEach(([key, value]) => {
					dropdown.addOption(key, value);
				});
				dropdown.setValue(this.plugin.settings.howToParseInternalLinks)
					.onChange(async (value) => {
						this.plugin.settings.howToParseInternalLinks = value;
						await this.plugin.saveSettings();
					});
			});

		// --- SECTION 5: SYNC CONFIG ---
		this.addHeader(containerEl, "cloud", "5. GitHub Sync");

		new Setting(containerEl)
			.setName("GitHub Username")
			.addText((text) =>
				text.setPlaceholder("liuh886")
					.setValue(this.plugin.settings.githubUsername)
					.onChange(async (value) => {
						this.plugin.settings.githubUsername = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Gist ID")
			.addText((text) =>
				text.setPlaceholder("Paste Gist ID here")
					.setValue(this.plugin.settings.githubGistId)
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
			.setName("Sync Interval")
			.setDesc("Minutes between automatic syncs.")
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
				text: "Complete Step 5 (GitHub Sync) to generate your subscription URL.",
				cls: "ical-url-placeholder"
			});
		}
	}
}
