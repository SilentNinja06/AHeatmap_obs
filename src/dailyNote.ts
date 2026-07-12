import { App, TFile, moment, normalizePath } from "obsidian";
import { ensureFolder } from "./store";
import type { SpiralLoggerSettings } from "./settings";

interface DailyNoteConfig {
	folder: string;
	format: string;
}

function getDailyNoteConfig(app: App): DailyNoteConfig {
	// The daily-notes core plugin has no public API; fall back to defaults if its shape changes.
	const anyApp = app as unknown as {
		internalPlugins?: { getPluginById?: (id: string) => { instance?: { options?: { folder?: string; format?: string } } } };
	};
	const options = anyApp.internalPlugins?.getPluginById?.("daily-notes")?.instance?.options ?? {};
	return {
		folder: (options.folder ?? "").trim(),
		format: (options.format ?? "").trim() || "YYYY-MM-DD",
	};
}

/**
 * Insert `line` at the placement marker if the note contains one (right after it,
 * below any links already inserted there), otherwise under the heading. The marker
 * lets a daily-note template pin the exact spot without a visible heading.
 */
export function insertAtPlacement(content: string, marker: string, heading: string, line: string): string {
	if (marker) {
		const lines = content.split("\n");
		const markerIdx = lines.findIndex((l) => l.includes(marker));
		if (markerIdx !== -1) {
			let insertAt = markerIdx + 1;
			while (insertAt < lines.length && /^\s*- /.test(lines[insertAt])) insertAt++;
			lines.splice(insertAt, 0, line);
			return lines.join("\n");
		}
	}
	return insertUnderHeading(content, heading, line);
}

export function insertUnderHeading(content: string, heading: string, line: string): string {
	const lines = content.split("\n");
	const headingText = heading.trim();
	const headingIdx = lines.findIndex((l) => l.trim() === headingText);

	if (headingIdx === -1) {
		const trimmed = content.replace(/\s+$/, "");
		return (trimmed ? trimmed + "\n\n" : "") + `${headingText}\n\n${line}\n`;
	}

	// Insert at the end of this heading's section (before the next heading or EOF).
	let end = lines.length;
	for (let i = headingIdx + 1; i < lines.length; i++) {
		if (/^#{1,6}\s/.test(lines[i])) {
			end = i;
			break;
		}
	}
	while (end > headingIdx + 1 && lines[end - 1].trim() === "") end--;
	lines.splice(end, 0, line);
	return lines.join("\n");
}

/** Add a link to `file` under the configured heading in `date`'s daily note. Never throws. */
export async function linkInDailyNote(
	app: App,
	settings: SpiralLoggerSettings,
	date: string,
	time: string,
	file: TFile,
	label: string
): Promise<void> {
	if (!settings.dailyNoteLinking) return;
	try {
		const config = getDailyNoteConfig(app);
		const name = moment(date, "YYYY-MM-DD").format(config.format);
		const path = normalizePath((config.folder ? config.folder + "/" : "") + name + ".md");

		let daily = app.vault.getAbstractFileByPath(path);
		if (!daily) {
			if (!settings.createDailyNoteIfMissing) return;
			if (config.folder) await ensureFolder(app, config.folder);
			daily = await app.vault.create(path, "");
		}
		if (!(daily instanceof TFile)) return;

		const linktext = app.metadataCache.fileToLinktext(file, daily.path);
		const line = `- ${time} [[${linktext}|${label}]]`;
		await app.vault.process(daily, (content) =>
			insertAtPlacement(content, settings.dailyNoteMarker, settings.dailyNoteHeading, line)
		);
	} catch (e) {
		// Daily-note linking is a convenience; never let it block saving the entry itself.
		console.error("Spiral & Shutdown Logger: daily note linking failed", e);
	}
}
