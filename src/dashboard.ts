import { ItemView, WorkspaceLeaf, moment, setIcon } from "obsidian";
import { SpiralEntry, kindInfo, SEVERITY_LABELS, splitTriggers } from "./types";
import { getEntries, triggerCounts } from "./store";
import { Tooltip, renderHeatmap, renderSeverityTrend, renderTriggerBars } from "./charts";
import { QuickCaptureModal } from "./quickCapture";
import { ThoughtCaptureModal } from "./thoughtCapture";
import { exportCsv, exportSummary } from "./export";
import type SpiralLoggerPlugin from "./main";

export const DASHBOARD_VIEW_TYPE = "spiral-logger-dashboard";

export class DashboardView extends ItemView {
	private plugin: SpiralLoggerPlugin;
	private tooltip: Tooltip | null = null;
	private renderTimer: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: SpiralLoggerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return DASHBOARD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Spiral log dashboard";
	}

	getIcon(): string {
		return "activity";
	}

	async onOpen(): Promise<void> {
		// Re-render when entry metadata changes anywhere in the vault (entries are
		// matched by frontmatter type, so we can't scope this to one folder).
		this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
		this.registerEvent(this.app.vault.on("delete", () => this.scheduleRender()));
		this.registerEvent(this.app.vault.on("rename", () => this.scheduleRender()));
		this.render();
	}

	private scheduleRender(): void {
		if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
		this.renderTimer = window.setTimeout(() => {
			this.renderTimer = null;
			this.render();
		}, 400);
	}

	private render(): void {
		const root = this.contentEl;
		root.empty();
		root.addClass("ssl-dashboard");
		this.tooltip = new Tooltip(root);

		const entries = getEntries(this.app, this.plugin.settings);

		this.renderActions(root);

		if (entries.length === 0) {
			const empty = root.createDiv({ cls: "ssl-empty" });
			empty.createDiv({ cls: "ssl-empty-title", text: "Nothing logged yet" });
			empty.createDiv({
				cls: "ssl-empty-body",
				text: "When something happens, tap “Log now” — kind and intensity are enough, detail can wait.",
			});
			return;
		}

		this.renderStats(root, entries);

		const heatCard = this.card(root, "When it's been happening");
		renderHeatmap(heatCard, entries, this.plugin.settings.heatmapWeeks, this.tooltip);

		const trendCard = this.card(root, "Severity trend (weekly average)");
		renderSeverityTrend(trendCard, entries, 16, Math.max(280, root.clientWidth - 64), this.tooltip);

		const triggers = triggerCounts(entries);
		if (triggers.length > 0) {
			const trigCard = this.card(root, "Triggers, by how often they show up");
			renderTriggerBars(trigCard, triggers);
		}

		this.renderRecent(root, entries);
	}

	private card(parent: HTMLElement, title: string): HTMLElement {
		const card = parent.createDiv({ cls: "ssl-card" });
		card.createDiv({ cls: "ssl-card-title", text: title });
		return card;
	}

	private renderActions(root: HTMLElement): void {
		const row = root.createDiv({ cls: "ssl-actions" });
		const action = (icon: string, label: string, cls: string, onClick: () => void) => {
			const btn = row.createEl("button", { cls: `ssl-action-btn ${cls}` });
			setIcon(btn.createSpan({ cls: "ssl-btn-icon" }), icon);
			btn.createSpan({ text: label });
			btn.addEventListener("click", onClick);
		};
		action("zap", "Log now", "mod-cta", () => new QuickCaptureModal(this.app, this.plugin).open());
		action("pencil-line", "Jot thoughts", "", () => new ThoughtCaptureModal(this.app, this.plugin).open());
		action("table", "CSV", "ssl-action-small", () => void exportCsv(this.app, this.plugin.settings));
		action("file-text", "Summary", "ssl-action-small", () => void exportSummary(this.app, this.plugin.settings));
	}

	private renderStats(root: HTMLElement, entries: SpiralEntry[]): void {
		const cutoff = moment().subtract(30, "days").format("YYYY-MM-DD");
		const recent = entries.filter((e) => e.date >= cutoff);
		const avg =
			recent.length > 0 ? (recent.reduce((sum, e) => sum + e.severity, 0) / recent.length).toFixed(1) : "—";
		const topTrigger = triggerCounts(recent)[0]?.trigger ?? "—";

		const kindCount = new Map<string, number>();
		for (const e of recent) kindCount.set(e.kind, (kindCount.get(e.kind) ?? 0) + 1);
		const topKind =
			Array.from(kindCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

		const grid = root.createDiv({ cls: "ssl-stats" });
		const tile = (value: string, label: string) => {
			const t = grid.createDiv({ cls: "ssl-stat" });
			t.createDiv({ cls: "ssl-stat-value", text: value });
			t.createDiv({ cls: "ssl-stat-label", text: label });
		};
		tile(String(recent.length), "entries · last 30 days");
		tile(avg, "avg severity · last 30 days");
		tile(topKind ? kindInfo(topKind).label : "—", "most common kind");
		tile(topTrigger, "most common trigger");
	}

	private renderRecent(root: HTMLElement, entries: SpiralEntry[]): void {
		const card = this.card(root, "Recent entries");
		const list = card.createDiv({ cls: "ssl-recent" });
		for (const entry of entries.slice(0, 10)) {
			const row = list.createEl("button", { cls: "ssl-recent-row" });
			const info = kindInfo(entry.kind);

			setIcon(row.createSpan({ cls: "ssl-btn-icon ssl-recent-icon" }), info.icon);

			const main = row.createDiv({ cls: "ssl-recent-main" });
			const head = main.createDiv({ cls: "ssl-recent-head" });
			head.createSpan({ cls: "ssl-recent-kind", text: info.label });
			head.createSpan({
				cls: "ssl-recent-date",
				text: `${moment(entry.date, "YYYY-MM-DD").format("ddd, MMM D")} · ${entry.time}`,
			});
			const triggers = splitTriggers(entry.trigger);
			if (triggers.length > 0) {
				main.createDiv({ cls: "ssl-recent-trigger", text: triggers.join(", ") });
			}

			const sev = row.createDiv({
				cls: "ssl-recent-sev",
				attr: { "aria-label": `Severity ${entry.severity} of 5 — ${SEVERITY_LABELS[entry.severity]}` },
			});
			for (let i = 1; i <= 5; i++) {
				sev.createSpan({ cls: `ssl-sev-dot ${i <= entry.severity ? `is-on ssl-heat-${entry.severity}` : ""}` });
			}
			sev.createSpan({ cls: "ssl-recent-sevnum", text: String(entry.severity) });

			row.addEventListener("click", () => {
				void this.app.workspace.openLinkText(entry.file.path, "", false);
			});
		}
	}

	async onClose(): Promise<void> {
		if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
		this.contentEl.empty();
	}
}
