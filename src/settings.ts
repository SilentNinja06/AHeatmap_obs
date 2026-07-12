import { App, PluginSettingTab, Setting } from "obsidian";
import type SpiralLoggerPlugin from "./main";

export interface SpiralLoggerSettings {
	entryFolder: string;
	thoughtFolder: string;
	exportFolder: string;
	filenameTemplate: string;
	dailyNoteLinking: boolean;
	createDailyNoteIfMissing: boolean;
	dailyNoteHeading: string;
	dailyNoteMarker: string;
	knownTriggers: string[];
	knownFactors: string[];
	knownSensory: string[];
	heatmapWeeks: number;
}

export const DEFAULT_SETTINGS: SpiralLoggerSettings = {
	entryFolder: "Spiral Log",
	thoughtFolder: "Spiral Log/Thoughts",
	exportFolder: "Spiral Log/Exports",
	filenameTemplate: "{{date}} {{time}} {{kind}}",
	dailyNoteLinking: true,
	createDailyNoteIfMissing: true,
	dailyNoteHeading: "## Spiral log",
	dailyNoteMarker: "%% spiral-log %%",
	knownTriggers: [],
	knownFactors: [
		"poor sleep",
		"little food today",
		"caffeine",
		"loud environment",
		"crowded place",
		"too hot / too cold",
		"illness or pain",
		"routine disrupted",
	],
	knownSensory: [
		"bright / fluorescent light",
		"loud noise",
		"sudden sounds",
		"background chatter",
		"strong smells",
		"clothing texture / tags",
		"unexpected touch",
		"food texture",
	],
	heatmapWeeks: 20,
};

export class SpiralLoggerSettingTab extends PluginSettingTab {
	plugin: SpiralLoggerPlugin;

	constructor(app: App, plugin: SpiralLoggerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Storage").setHeading();

		new Setting(containerEl)
			.setName("Entry folder")
			.setDesc("Where new entry notes are created. Every note in this folder with `type: spiral-entry` frontmatter is picked up, so you can move or rename notes freely.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.entryFolder)
					.setValue(this.plugin.settings.entryFolder)
					.onChange(async (value) => {
						this.plugin.settings.entryFolder = value.trim() || DEFAULT_SETTINGS.entryFolder;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Thoughts folder")
			.setDesc("Where quick thought-capture notes are created.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.thoughtFolder)
					.setValue(this.plugin.settings.thoughtFolder)
					.onChange(async (value) => {
						this.plugin.settings.thoughtFolder = value.trim() || DEFAULT_SETTINGS.thoughtFolder;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Export folder")
			.setDesc("Where CSV exports and markdown summaries are written.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.exportFolder)
					.setValue(this.plugin.settings.exportFolder)
					.onChange(async (value) => {
						this.plugin.settings.exportFolder = value.trim() || DEFAULT_SETTINGS.exportFolder;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Filename template")
			.setDesc("Placeholders: {{date}} (YYYY-MM-DD), {{time}} (HH-mm), {{kind}}. A numeric suffix is added if the name already exists.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.filenameTemplate)
					.setValue(this.plugin.settings.filenameTemplate)
					.onChange(async (value) => {
						this.plugin.settings.filenameTemplate = value.trim() || DEFAULT_SETTINGS.filenameTemplate;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Daily notes").setHeading();

		new Setting(containerEl)
			.setName("Link entries into the daily note")
			.setDesc("When an entry or thought note is logged, add a link to it under a heading in that day's daily note.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.dailyNoteLinking).onChange(async (value) => {
					this.plugin.settings.dailyNoteLinking = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Create the daily note if it doesn't exist")
			.setDesc("Uses your Daily Notes plugin folder and date format.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.createDailyNoteIfMissing).onChange(async (value) => {
					this.plugin.settings.createDailyNoteIfMissing = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Daily note heading")
			.setDesc("Links are inserted under this heading, wherever it sits in the note — add it to your daily-note template to control the position. It's only created at the end of the note if it doesn't exist.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.dailyNoteHeading)
					.setValue(this.plugin.settings.dailyNoteHeading)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteHeading = value.trim() || DEFAULT_SETTINGS.dailyNoteHeading;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Placement marker")
			.setDesc("If this text appears anywhere in the daily note (e.g. from your template), links are inserted right after it instead of under the heading. Useful for pinning an exact spot without a visible heading. Leave empty to disable.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.dailyNoteMarker)
					.setValue(this.plugin.settings.dailyNoteMarker)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteMarker = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Triggers, factors & dashboard").setHeading();

		new Setting(containerEl)
			.setName("Known triggers")
			.setDesc("One per line. These show as one-tap chips in the quick-capture form. Triggers typed during capture are added here automatically.")
			.addTextArea((text) => {
				text.setPlaceholder("crowds\nloud noise\nschedule change")
					.setValue(this.plugin.settings.knownTriggers.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.knownTriggers = value
							.split("\n")
							.map((t) => t.trim())
							.filter((t) => t.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 6;
			});

		new Setting(containerEl)
			.setName("Known factors")
			.setDesc("Background contributors — sleep, food, environment, and so on. One per line; shown as one-tap chips in the quick-capture form and added here automatically when typed during capture.")
			.addTextArea((text) => {
				text.setPlaceholder("poor sleep\nlittle food today\nloud environment")
					.setValue(this.plugin.settings.knownFactors.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.knownFactors = value
							.split("\n")
							.map((t) => t.trim())
							.filter((t) => t.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 6;
			});

		new Setting(containerEl)
			.setName("Sensory sensitivities")
			.setDesc("Your maintained list of sensory things that are problematic — this is its own dataset, separate from triggers. One per line; shown as one-tap chips in the quick-capture form and added here automatically when typed during capture.")
			.addTextArea((text) => {
				text.setPlaceholder("bright / fluorescent light\nloud noise\nclothing texture / tags")
					.setValue(this.plugin.settings.knownSensory.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.knownSensory = value
							.split("\n")
							.map((t) => t.trim())
							.filter((t) => t.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
			});

		new Setting(containerEl)
			.setName("Heatmap range (weeks)")
			.setDesc("How many weeks of history the dashboard heatmap shows.")
			.addSlider((slider) =>
				slider
					.setLimits(8, 52, 1)
					.setValue(this.plugin.settings.heatmapWeeks)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.heatmapWeeks = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
