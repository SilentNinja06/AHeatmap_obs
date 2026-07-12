import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, SpiralLoggerSettings, SpiralLoggerSettingTab } from "./settings";
import { QuickCaptureModal } from "./quickCapture";
import { ThoughtCaptureModal } from "./thoughtCapture";
import { DashboardView, DASHBOARD_VIEW_TYPE } from "./dashboard";
import { exportCsv, exportSummary } from "./export";

export default class SpiralLoggerPlugin extends Plugin {
	settings: SpiralLoggerSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(DASHBOARD_VIEW_TYPE, (leaf: WorkspaceLeaf) => new DashboardView(leaf, this));

		// Ribbon: quick capture is the primary action (1 tap from anywhere → modal → save).
		this.addRibbonIcon("zap", "Log a spiral / shutdown entry", () => {
			new QuickCaptureModal(this.app, this).open();
		});
		this.addRibbonIcon("pencil-line", "Jot spiraling thoughts", () => {
			new ThoughtCaptureModal(this.app, this).open();
		});
		this.addRibbonIcon("activity", "Open spiral log dashboard", () => {
			void this.activateDashboard();
		});

		// Commands are independently bindable (hotkeys, mobile toolbar buttons).
		this.addCommand({
			id: "quick-capture",
			name: "Log an entry (quick capture)",
			callback: () => new QuickCaptureModal(this.app, this).open(),
		});
		this.addCommand({
			id: "thought-capture",
			name: "Jot spiraling thoughts",
			callback: () => new ThoughtCaptureModal(this.app, this).open(),
		});
		this.addCommand({
			id: "open-dashboard",
			name: "Open dashboard",
			callback: () => void this.activateDashboard(),
		});
		this.addCommand({
			id: "export-csv",
			name: "Export all entries to CSV",
			callback: () => void exportCsv(this.app, this.settings),
		});
		this.addCommand({
			id: "export-summary",
			name: "Export markdown summary (for appointments)",
			callback: () => void exportSummary(this.app, this.settings),
		});

		this.addSettingTab(new SpiralLoggerSettingTab(this.app, this));
	}

	async activateDashboard(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE)[0];
		if (!leaf) {
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
		}
		void workspace.revealLeaf(leaf);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		// Don't share the default array instances — quick capture mutates these lists.
		this.settings.knownTriggers = [...(this.settings.knownTriggers ?? [])];
		this.settings.knownFactors = [...(this.settings.knownFactors ?? DEFAULT_SETTINGS.knownFactors)];
		this.settings.knownSensory = [...(this.settings.knownSensory ?? DEFAULT_SETTINGS.knownSensory)];
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
