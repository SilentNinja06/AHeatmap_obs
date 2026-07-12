import { App, TFile, normalizePath } from "obsidian";
import { ENTRY_TYPE, THOUGHT_TYPE, EntryData, SpiralEntry, Kind, KINDS, splitTriggers, kindInfo } from "./types";
import type { SpiralLoggerSettings } from "./settings";

/* ------------------------------------------------------------------ *
 * YAML helpers                                                        *
 * ------------------------------------------------------------------ */

function yamlScalar(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;
}

/** Multi-line strings become YAML block scalars so freeform text survives round-trips. */
function yamlText(key: string, value: string): string {
	if (/\r?\n/.test(value)) {
		const body = value
			.split(/\r?\n/)
			.map((line) => `  ${line}`)
			.join("\n");
		return `${key}: |-\n${body}`;
	}
	return `${key}: ${yamlScalar(value)}`;
}

function yamlList(key: string, values: string[]): string {
	if (values.length === 0) return `${key}: []`;
	return `${key}:\n` + values.map((v) => `  - ${yamlScalar(v)}`).join("\n");
}

export function buildEntryContent(data: EntryData): string {
	const fm = [
		"---",
		`type: ${ENTRY_TYPE}`,
		`date: ${data.date}`,
		`time: ${yamlScalar(data.time)}`,
		`kind: ${data.kind}`,
		`severity: ${data.severity}`,
		yamlText("trigger", data.trigger),
		yamlText("warning_signs", data.warning_signs),
		yamlText("thoughts", data.thoughts),
		`duration_min: ${data.duration_min}`,
		yamlText("recovery_notes", data.recovery_notes),
		yamlText("sleep_prior", data.sleep_prior),
		yamlList("tags", data.tags),
		"---",
	].join("\n");

	const label = kindInfo(data.kind).label;
	const body = [
		"",
		`# ${label} — ${data.date} ${data.time}`,
		"",
		"> Logged with Spiral & Shutdown Logger. Everything above is editable — fill in detail whenever you're ready, or leave it as is.",
		"",
		"## Notes",
		"",
	].join("\n");

	return fm + body;
}

export function buildThoughtContent(date: string, time: string, text: string): string {
	const fm = ["---", `type: ${THOUGHT_TYPE}`, `date: ${date}`, `time: ${yamlScalar(time)}`, "tags: []", "---"].join("\n");
	return `${fm}\n\n${text.trim()}\n`;
}

/* ------------------------------------------------------------------ *
 * File creation                                                       *
 * ------------------------------------------------------------------ */

export async function ensureFolder(app: App, path: string): Promise<void> {
	const normalized = normalizePath(path);
	if (!normalized || normalized === "/") return;
	if (app.vault.getAbstractFileByPath(normalized)) return;
	await app.vault.createFolder(normalized).catch(() => {
		/* already exists (race) */
	});
}

function sanitizeFilename(name: string): string {
	return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim() || "entry";
}

async function createUniqueNote(app: App, folder: string, basename: string, content: string): Promise<TFile> {
	await ensureFolder(app, folder);
	const base = sanitizeFilename(basename);
	for (let i = 0; i < 1000; i++) {
		const name = i === 0 ? base : `${base} ${i + 1}`;
		const path = normalizePath(`${folder}/${name}.md`);
		if (!app.vault.getAbstractFileByPath(path)) {
			return await app.vault.create(path, content);
		}
	}
	throw new Error("Could not find a unique filename");
}

export async function createEntryNote(app: App, settings: SpiralLoggerSettings, data: EntryData): Promise<TFile> {
	const basename = settings.filenameTemplate
		.replace(/\{\{date\}\}/g, data.date)
		.replace(/\{\{time\}\}/g, data.time.replace(":", "-"))
		.replace(/\{\{kind\}\}/g, data.kind);
	return createUniqueNote(app, settings.entryFolder, basename, buildEntryContent(data));
}

export async function createThoughtNote(
	app: App,
	settings: SpiralLoggerSettings,
	date: string,
	time: string,
	text: string
): Promise<TFile> {
	const basename = `${date} ${time.replace(":", "-")} thoughts`;
	return createUniqueNote(app, settings.thoughtFolder, basename, buildThoughtContent(date, time, text));
}

/* ------------------------------------------------------------------ *
 * Reading entries back                                                *
 * ------------------------------------------------------------------ */

function str(v: unknown): string {
	if (v === null || v === undefined) return "";
	return String(v);
}

function num(v: unknown): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
}

function coerceKind(v: unknown): Kind {
	const s = str(v);
	return (KINDS.some((k) => k.value === s) ? s : "other") as Kind;
}

/** All spiral entries in the vault, newest first. Matches on frontmatter type, not path,
 *  so entries keep working if the user reorganizes their folders. */
export function getEntries(app: App, _settings: SpiralLoggerSettings): SpiralEntry[] {
	const entries: SpiralEntry[] = [];
	for (const file of app.vault.getMarkdownFiles()) {
		const fm = app.metadataCache.getFileCache(file)?.frontmatter;
		if (!fm || fm.type !== ENTRY_TYPE) continue;
		const date = str(fm.date).slice(0, 10);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
		entries.push({
			file,
			date,
			time: str(fm.time),
			kind: coerceKind(fm.kind),
			severity: Math.min(5, Math.max(1, num(fm.severity) || 1)),
			trigger: str(fm.trigger),
			warning_signs: str(fm.warning_signs),
			thoughts: str(fm.thoughts),
			duration_min: num(fm.duration_min),
			recovery_notes: str(fm.recovery_notes),
			sleep_prior: str(fm.sleep_prior),
			tags: Array.isArray(fm.tags) ? fm.tags.map(str) : [],
		});
	}
	entries.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
	return entries;
}

/** Trigger frequency across all entries, most frequent first. */
export function triggerCounts(entries: SpiralEntry[]): { trigger: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const entry of entries) {
		for (const t of splitTriggers(entry.trigger)) {
			const key = t.toLowerCase();
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}
	return Array.from(counts.entries())
		.map(([trigger, count]) => ({ trigger, count }))
		.sort((a, b) => b.count - a.count || a.trigger.localeCompare(b.trigger));
}
