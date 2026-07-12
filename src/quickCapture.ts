import { App, Modal, Notice, Setting, TFile, moment, setIcon } from "obsidian";
import { EntryData, KINDS, Kind, SEVERITY_LABELS, kindInfo, splitTriggers } from "./types";
import { createEntryNote } from "./store";
import { linkInDailyNote } from "./dailyNote";
import type SpiralLoggerPlugin from "./main";

/**
 * In-the-moment capture. Designed to work mid-shutdown:
 * - "Save placeholder" logs a timestamped entry with zero choices made.
 * - Otherwise: tap a kind, tap a severity, tap save. No typing required.
 * - Everything else lives behind an optional "add details" disclosure.
 */
export class QuickCaptureModal extends Modal {
	private plugin: SpiralLoggerPlugin;
	private kind: Kind | null = null;
	private severity: number | null = null;
	private selectedTriggers = new Set<string>();
	private warningSigns = "";
	private thoughts = "";
	private durationMin = 0;
	private recoveryNotes = "";
	private sleepPrior = "";
	private tagsText = "";
	private saveBtn!: HTMLButtonElement;
	private saved = false;

	constructor(app: App, plugin: SpiralLoggerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("ssl-capture");
		this.titleEl.setText("Log what's happening");

		// Zero-decision escape hatch: timestamped placeholder, details later.
		const placeholderBtn = contentEl.createEl("button", { cls: "ssl-placeholder-btn" });
		setIcon(placeholderBtn.createSpan({ cls: "ssl-btn-icon" }), "zap");
		placeholderBtn.createSpan({ text: "Just save a timestamped entry now" });
		placeholderBtn.addEventListener("click", () => {
			this.kind = this.kind ?? "other";
			this.severity = this.severity ?? 3;
			void this.save();
		});

		contentEl.createDiv({ cls: "ssl-field-label", text: "What kind?" });
		const kindGrid = contentEl.createDiv({ cls: "ssl-kind-grid" });
		const kindButtons = new Map<Kind, HTMLButtonElement>();
		for (const k of KINDS) {
			const btn = kindGrid.createEl("button", { cls: "ssl-kind-btn" });
			setIcon(btn.createSpan({ cls: "ssl-btn-icon" }), k.icon);
			btn.createSpan({ text: k.label });
			kindButtons.set(k.value, btn);
			btn.addEventListener("click", () => {
				this.kind = k.value;
				for (const [value, b] of kindButtons) b.toggleClass("is-selected", value === k.value);
				this.updateSaveState();
			});
		}

		contentEl.createDiv({ cls: "ssl-field-label", text: "How intense?" });
		const sevRow = contentEl.createDiv({ cls: "ssl-severity-row" });
		const sevButtons: HTMLButtonElement[] = [];
		for (let s = 1; s <= 5; s++) {
			const btn = sevRow.createEl("button", { cls: `ssl-sev-btn ssl-sev-${s}` });
			btn.createSpan({ cls: "ssl-sev-num", text: String(s) });
			if (s === 1 || s === 3 || s === 5) {
				btn.createSpan({ cls: "ssl-sev-word", text: SEVERITY_LABELS[s] });
			}
			sevButtons.push(btn);
			btn.addEventListener("click", () => {
				this.severity = s;
				sevButtons.forEach((b, i) => b.toggleClass("is-selected", i + 1 === s));
				this.updateSaveState();
			});
		}

		this.renderDetails(contentEl);

		this.saveBtn = contentEl.createEl("button", { cls: "ssl-save-btn mod-cta", text: "Save entry" });
		this.saveBtn.disabled = true;
		this.saveBtn.addEventListener("click", () => void this.save());
		this.updateSaveState();
	}

	private renderDetails(contentEl: HTMLElement): void {
		const details = contentEl.createEl("details", { cls: "ssl-details" });
		details.createEl("summary", { text: "Add details (optional — you can also edit the note later)" });
		const body = details.createDiv();

		// Trigger chips from the known-trigger list + free text add
		body.createDiv({ cls: "ssl-field-label", text: "Trigger" });
		const chipWrap = body.createDiv({ cls: "ssl-chips" });
		const renderChips = () => {
			chipWrap.empty();
			for (const trigger of this.plugin.settings.knownTriggers) {
				const chip = chipWrap.createEl("button", { cls: "ssl-chip", text: trigger });
				chip.toggleClass("is-selected", this.selectedTriggers.has(trigger));
				chip.addEventListener("click", () => {
					if (this.selectedTriggers.has(trigger)) this.selectedTriggers.delete(trigger);
					else this.selectedTriggers.add(trigger);
					chip.toggleClass("is-selected", this.selectedTriggers.has(trigger));
				});
			}
		};
		renderChips();

		const addRow = body.createDiv({ cls: "ssl-add-trigger" });
		const addInput = addRow.createEl("input", {
			type: "text",
			placeholder: "New trigger…",
			cls: "ssl-text-input",
		});
		const addBtn = addRow.createEl("button", { cls: "ssl-chip-add", text: "Add" });
		const addTrigger = async () => {
			const value = addInput.value.trim();
			if (!value) return;
			if (!this.plugin.settings.knownTriggers.includes(value)) {
				this.plugin.settings.knownTriggers.push(value);
				await this.plugin.saveSettings();
			}
			this.selectedTriggers.add(value);
			addInput.value = "";
			renderChips();
		};
		addBtn.addEventListener("click", () => void addTrigger());
		addInput.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				void addTrigger();
			}
		});

		new Setting(body).setName("Warning signs").addText((t) =>
			t.setPlaceholder("what led up to it").onChange((v) => (this.warningSigns = v))
		);
		new Setting(body)
			.setName("Thoughts")
			.setDesc("The actual spiral content, if you want to capture it here.")
			.addTextArea((t) => {
				t.setPlaceholder("whatever is going through your head").onChange((v) => (this.thoughts = v));
				t.inputEl.rows = 3;
			});
		new Setting(body).setName("Duration (minutes)").addText((t) => {
			t.inputEl.type = "number";
			t.inputEl.inputMode = "numeric";
			t.setPlaceholder("0").onChange((v) => (this.durationMin = Math.max(0, Number(v) || 0)));
		});
		new Setting(body).setName("Recovery notes").addText((t) =>
			t.setPlaceholder("what helped").onChange((v) => (this.recoveryNotes = v))
		);
		new Setting(body).setName("Sleep the night before").addText((t) =>
			t.setPlaceholder("e.g. 5h, restless").onChange((v) => (this.sleepPrior = v))
		);
		new Setting(body).setName("Tags").setDesc("Comma-separated.").addText((t) =>
			t.setPlaceholder("work, sensory").onChange((v) => (this.tagsText = v))
		);
	}

	private updateSaveState(): void {
		const ready = this.kind !== null && this.severity !== null;
		this.saveBtn.disabled = !ready;
		this.saveBtn.setText(ready ? "Save entry" : "Pick a kind and intensity (or just save above)");
	}

	private async save(): Promise<void> {
		if (this.saved) return;
		this.saved = true;
		const now = moment();
		const data: EntryData = {
			date: now.format("YYYY-MM-DD"),
			time: now.format("HH:mm"),
			kind: this.kind ?? "other",
			severity: this.severity ?? 3,
			trigger: Array.from(this.selectedTriggers).join(", "),
			warning_signs: this.warningSigns.trim(),
			thoughts: this.thoughts.trim(),
			duration_min: this.durationMin,
			recovery_notes: this.recoveryNotes.trim(),
			sleep_prior: this.sleepPrior.trim(),
			tags: splitTriggers(this.tagsText),
		};
		try {
			const file = await createEntryNote(this.app, this.plugin.settings, data);
			const label = `${kindInfo(data.kind).label} (severity ${data.severity})`;
			await linkInDailyNote(this.app, this.plugin.settings, data.date, data.time, file, label);
			this.close();
			this.showSavedNotice(file);
		} catch (e) {
			this.saved = false;
			console.error("Spiral & Shutdown Logger: failed to save entry", e);
			new Notice("Couldn't save the entry — check the folder setting.");
		}
	}

	private showSavedNotice(file: TFile): void {
		const notice = new Notice("", 6000);
		notice.messageEl.setText("Logged. You're doing okay. ");
		const open = notice.messageEl.createEl("a", { text: "Open note" });
		open.addEventListener("click", () => {
			void this.app.workspace.openLinkText(file.path, "", false);
			notice.hide();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
