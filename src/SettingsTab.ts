import { App, PluginSettingTab, Setting, normalizePath, setIcon } from "obsidian";
import ObsidianIcalPlugin from "./ObsidianIcalPlugin";
import { FolderSuggest } from "./FolderSuggest";

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
		this.addHeader(containerEl, "search", "1. Where are your tasks?");
		
		new Setting(containerEl)
			.setName("Target Directory")
			.setDesc("The plugin will only scan files inside this folder. Type to search folders.")
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
		this.addHeader(containerEl, "calendar-days", "2. How should we find dates?");

		const logicCard = containerEl.createDiv({ cls: "ical-pro-logic-info" });
		logicCard.createEl("strong", { text: "Current Mode: " });
		const modeText = logicCard.createSpan({ 
			text: this.plugin.settings.isDayPlannerPluginFormatEnabled ? "Day Planner Integration" : "Standard (Emoji-based)" 
		});

		new Setting(containerEl)
			.setName("Day Planner Mode")
			.setDesc("Enable this if you use the Day Planner plugin style (Date in Heading, Time in task line).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.isDayPlannerPluginFormatEnabled)
					.onChange(async (value) => {
						this.plugin.settings.isDayPlannerPluginFormatEnabled = value;
						modeText.setText(value ? "Day Planner Integration" : "Standard (Emoji-based)");
						await this.plugin.saveSettings();
					})
			);

		if (this.plugin.settings.isDayPlannerPluginFormatEnabled) {
			const tip = containerEl.createEl("p", { cls: "setting-item-description ical-pro-tip" });
			tip.setText("💡 Tip: Tasks will inherit the date from their parent heading (e.g. ## 2026-04-02).");
		} else {
			const tip = containerEl.createEl("p", { cls: "setting-item-description ical-pro-tip" });
			tip.setText("💡 Tip: Use Emojis in your tasks: 📅 2026-04-02 (Due), 🛫 (Start), ⏳ (Scheduled).");
		}

		// --- SECTION 3: SYNC ---
		this.addHeader(containerEl, "cloud", "3. Where to sync?");

		new Setting(containerEl)
			.setName("GitHub Username")
			.addText((text) =>
				text.setPlaceholder("e.g., liuh886")
					.setValue(this.plugin.settings.githubUsername)
					.onChange(async (value) => {
						this.plugin.settings.githubUsername = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Gist ID")
			.setDesc("The unique ID of your GitHub Gist.")
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
			.setDesc("Requires 'Gist' scope permissions.")
			.addText((text) =>
				text.setPlaceholder("ghp_...")
					.setValue(this.plugin.settings.githubPersonalAccessToken)
					.onChange(async (value) => {
						this.plugin.settings.githubPersonalAccessToken = value;
						await this.plugin.saveSettings();
					})
			);

		// --- SECTION 4: ADVANCED ---
		this.addHeader(containerEl, "sliders", "4. Advanced Rules");

		new Setting(containerEl)
			.setName("File Name")
			.addText((text) =>
				text.setValue(this.plugin.settings.filename)
					.onChange(async (value) => {
						this.plugin.settings.filename = value;
						await this.plugin.saveSettings();
						this.updateUrlDisplay();
					})
			);

		new Setting(containerEl)
			.setName("Sync Interval")
			.setDesc("Minutes between automatic background syncs.")
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
				text: "Complete Step 3 (GitHub Sync) to generate your subscription URL.",
				cls: "ical-url-placeholder"
			});
		}
	}
}
