import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, SpiralLoggerSettings, SpiralLoggerSettingTab } from "./settings";
import { QuickCaptureModal } from "./quickCapture";
import { ThoughtCaptureModal } from "./thoughtCapture";
import { DashboardView, DASHBOARD_VIEW_TYPE } from "./dashboard";
import { exportCsv, exportSummary } from "./export";
import { getEntries } from "./store";
import { openViewOnStartup } from "./startup";

const DAY = 86_400_000;

function isoToday(): string {
	const d = new Date();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

export default class SpiralLoggerPlugin extends Plugin {
	settings: SpiralLoggerSettings = DEFAULT_SETTINGS;

	/**
	 * Read-only API for companion plugins (e.g. the MERIDIAN dashboard). Delegates
	 * to the existing store, which matches on frontmatter `type`. Consumers check
	 * `version` and fall back to markdown parsing if it is absent.
	 */
	public api = {
		version: 1,
		/** Spiral/shutdown entries logged on `date` (YYYY-MM-DD). */
		getEntriesForDate: (date: string) =>
			getEntries(this.app)
				.filter((e) => e.date === date)
				.map((e) => ({ date: e.date, time: e.time, kind: e.kind, severity: e.severity })),
		/** Cheap "did a spiral/shutdown occur on `date`" — called on every ambient
		 * rotation by the dashboard's aftercare weighting, so keep it light. */
		hadEntryOn: (date: string) => getEntries(this.app).some((e) => e.date === date),
		/** Compact shape for a dashboard card: today's count. */
		getTodaySummary: () => {
			const today = isoToday();
			const entries = getEntries(this.app).filter((e) => e.date === today);
			return { date: today, count: entries.length };
		},
		/** 1.3+: counts only (no kinds, triggers or notes), for a dashboard card
		 * that may be seen by others. `last7` includes today. */
		getCounts: () => {
			const today = isoToday();
			const d = new Date(Date.now() - 6 * DAY);
			const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			let todayCount = 0;
			let last7 = 0;
			for (const e of getEntries(this.app)) {
				if (e.date === today) todayCount++;
				if (e.date >= from && e.date <= today) last7++;
			}
			return { date: today, today: todayCount, last7 };
		},
		/** 1.3+: called when entries may have changed. Returns an unsubscribe. */
		onChange: (cb: () => void): (() => void) => {
			const refs = [this.app.metadataCache.on("changed", () => cb()), this.app.vault.on("delete", () => cb())];
			return () => {
				this.app.metadataCache.offref(refs[0]);
				this.app.vault.offref(refs[1]);
			};
		},
		/** 1.3+ */
		openCapture: () => new QuickCaptureModal(this.app, this).open(),
		/** 1.3+ */
		openThoughts: () => new ThoughtCaptureModal(this.app, this).open(),
		/** 1.3+ */
		openDashboard: () => void this.activateDashboard(),
	};

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(DASHBOARD_VIEW_TYPE, (leaf: WorkspaceLeaf) => new DashboardView(leaf, this));
		// Open on startup (this device, and only without a dashboard installed).
		this.app.workspace.onLayoutReady(() => void openViewOnStartup(this.app, "spiral-shutdown-logger", DASHBOARD_VIEW_TYPE));

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
