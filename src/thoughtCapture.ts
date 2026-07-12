import { App, Modal, Notice, moment } from "obsidian";
import { createThoughtNote } from "./store";
import { linkInDailyNote } from "./dailyNote";
import type SpiralLoggerPlugin from "./main";

/**
 * A textarea that opens instantly, already focused, so spiraling thoughts can be
 * dumped without any setup. Closing the modal with text in it still saves —
 * a panic-close must never lose what was written.
 */
export class ThoughtCaptureModal extends Modal {
	private plugin: SpiralLoggerPlugin;
	private textarea!: HTMLTextAreaElement;
	private saved = false;

	constructor(app: App, plugin: SpiralLoggerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("ssl-thoughts");
		this.titleEl.setText("Get it out of your head");

		this.textarea = contentEl.createEl("textarea", {
			cls: "ssl-thoughts-area",
			attr: { placeholder: "Type whatever is spinning. No structure needed. It saves even if you just close this." },
		});
		this.textarea.rows = 8;

		const saveBtn = contentEl.createEl("button", { cls: "ssl-save-btn mod-cta", text: "Save" });
		saveBtn.addEventListener("click", () => {
			void this.save(true);
		});

		// Focus after the modal animation settles so the on-screen keyboard opens reliably.
		window.setTimeout(() => this.textarea.focus(), 50);
	}

	private async save(closeAfter: boolean): Promise<void> {
		const text = this.textarea.value.trim();
		if (this.saved || !text) {
			if (closeAfter) this.close();
			return;
		}
		this.saved = true;
		const now = moment();
		const date = now.format("YYYY-MM-DD");
		const time = now.format("HH:mm");
		try {
			const file = await createThoughtNote(this.app, this.plugin.settings, date, time, text);
			await linkInDailyNote(this.app, this.plugin.settings, date, time, file, `thoughts at ${time}`);
			new Notice("Saved.");
		} catch (e) {
			this.saved = false;
			console.error("Spiral & Shutdown Logger: failed to save thoughts", e);
			new Notice("Couldn't save — check the thoughts folder setting.");
			return;
		}
		if (closeAfter) this.close();
	}

	onClose(): void {
		// Safety net: never discard typed text.
		void this.save(false);
		this.contentEl.empty();
	}
}
