import { App, Notice, TFile, moment, normalizePath } from "obsidian";
import { SpiralEntry, kindInfo, KINDS } from "./types";
import { getEntries, triggerCounts, factorCounts, ensureFolder } from "./store";
import type { SpiralLoggerSettings } from "./settings";

function csvCell(value: string | number): string {
	const s = String(value);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

export function entriesToCsv(entries: SpiralEntry[]): string {
	const header = [
		"date",
		"time",
		"kind",
		"severity",
		"trigger",
		"warning_signs",
		"thoughts",
		"duration_min",
		"recovery_notes",
		"factors",
		"tags",
		"file",
	];
	const rows = entries.map((e) =>
		[
			e.date,
			e.time,
			e.kind,
			e.severity,
			e.trigger,
			e.warning_signs,
			e.thoughts,
			e.duration_min,
			e.recovery_notes,
			e.factors,
			e.tags.join("; "),
			e.file.path,
		]
			.map(csvCell)
			.join(",")
	);
	return [header.join(","), ...rows].join("\n") + "\n";
}

export function buildSummaryMarkdown(entries: SpiralEntry[]): string {
	const lines: string[] = [];
	const generated = moment().format("YYYY-MM-DD HH:mm");
	lines.push("# Spiral & shutdown log — summary", "");
	lines.push(`Generated ${generated}. ${entries.length} entries total.`, "");

	if (entries.length === 0) return lines.join("\n");

	const oldest = entries[entries.length - 1].date;
	const newest = entries[0].date;
	lines.push(`**Date range:** ${oldest} → ${newest}`, "");

	// By kind
	lines.push("## Entries by kind", "");
	lines.push("| Kind | Count | Avg severity |", "| --- | ---: | ---: |");
	for (const k of KINDS) {
		const subset = entries.filter((e) => e.kind === k.value);
		if (subset.length === 0) continue;
		const avg = subset.reduce((sum, e) => sum + e.severity, 0) / subset.length;
		lines.push(`| ${k.label} | ${subset.length} | ${avg.toFixed(1)} |`);
	}
	lines.push("");

	// Top triggers
	const triggers = triggerCounts(entries);
	if (triggers.length > 0) {
		lines.push("## Triggers", "");
		lines.push("| Trigger | Times logged |", "| --- | ---: |");
		for (const { trigger, count } of triggers.slice(0, 20)) {
			lines.push(`| ${trigger} | ${count} |`);
		}
		lines.push("");
	}

	// Background factors
	const factors = factorCounts(entries);
	if (factors.length > 0) {
		lines.push("## Background factors", "");
		lines.push("| Factor | Times logged |", "| --- | ---: |");
		for (const { trigger, count } of factors.slice(0, 20)) {
			lines.push(`| ${trigger} | ${count} |`);
		}
		lines.push("");
	}

	// Monthly counts + average severity
	const byMonth = new Map<string, { count: number; sum: number }>();
	for (const e of entries) {
		const month = e.date.slice(0, 7);
		const acc = byMonth.get(month) ?? { count: 0, sum: 0 };
		acc.count++;
		acc.sum += e.severity;
		byMonth.set(month, acc);
	}
	lines.push("## Month by month", "");
	lines.push("| Month | Entries | Avg severity |", "| --- | ---: | ---: |");
	for (const [month, acc] of Array.from(byMonth.entries()).sort()) {
		lines.push(`| ${month} | ${acc.count} | ${(acc.sum / acc.count).toFixed(1)} |`);
	}
	lines.push("");

	// Full log, oldest first — the appendix a clinician can scan
	lines.push("## All entries", "");
	lines.push("| Date | Time | Kind | Severity | Duration (min) | Trigger | What helped |", "| --- | --- | --- | ---: | ---: | --- | --- |");
	for (const e of [...entries].reverse()) {
		const clean = (s: string) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
		lines.push(
			`| ${e.date} | ${e.time} | ${kindInfo(e.kind).label} | ${e.severity} | ${e.duration_min || ""} | ${clean(e.trigger)} | ${clean(e.recovery_notes)} |`
		);
	}
	lines.push("");
	return lines.join("\n");
}

async function writeExport(app: App, folder: string, filename: string, content: string): Promise<TFile> {
	await ensureFolder(app, folder);
	const path = normalizePath(`${folder}/${filename}`);
	const existing = app.vault.getAbstractFileByPath(path);
	if (existing instanceof TFile) {
		await app.vault.modify(existing, content);
		return existing;
	}
	return await app.vault.create(path, content);
}

export async function exportCsv(app: App, settings: SpiralLoggerSettings): Promise<void> {
	const entries = getEntries(app, settings);
	const stamp = moment().format("YYYY-MM-DD");
	const file = await writeExport(app, settings.exportFolder, `spiral-log-${stamp}.csv`, entriesToCsv(entries));
	new Notice(`Exported ${entries.length} entries to ${file.path}`);
}

export async function exportSummary(app: App, settings: SpiralLoggerSettings): Promise<void> {
	const entries = getEntries(app, settings);
	const stamp = moment().format("YYYY-MM-DD");
	const file = await writeExport(app, settings.exportFolder, `spiral-log-summary-${stamp}.md`, buildSummaryMarkdown(entries));
	await app.workspace.openLinkText(file.path, "", true);
	new Notice("Summary created — export to PDF via the note menu if needed.");
}
