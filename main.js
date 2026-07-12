/*
Spiral & Shutdown Logger — compiled bundle.
Source: https://github.com/SilentNinja06/AHeatmap_obs (see src/)
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SpiralLoggerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian9 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
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
    "routine disrupted"
  ],
  heatmapWeeks: 20
};
var SpiralLoggerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Storage").setHeading();
    new import_obsidian.Setting(containerEl).setName("Entry folder").setDesc("Where new entry notes are created. Every note in this folder with `type: spiral-entry` frontmatter is picked up, so you can move or rename notes freely.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.entryFolder).setValue(this.plugin.settings.entryFolder).onChange(async (value) => {
        this.plugin.settings.entryFolder = value.trim() || DEFAULT_SETTINGS.entryFolder;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Thoughts folder").setDesc("Where quick thought-capture notes are created.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.thoughtFolder).setValue(this.plugin.settings.thoughtFolder).onChange(async (value) => {
        this.plugin.settings.thoughtFolder = value.trim() || DEFAULT_SETTINGS.thoughtFolder;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Export folder").setDesc("Where CSV exports and markdown summaries are written.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.exportFolder).setValue(this.plugin.settings.exportFolder).onChange(async (value) => {
        this.plugin.settings.exportFolder = value.trim() || DEFAULT_SETTINGS.exportFolder;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Filename template").setDesc("Placeholders: {{date}} (YYYY-MM-DD), {{time}} (HH-mm), {{kind}}. A numeric suffix is added if the name already exists.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.filenameTemplate).setValue(this.plugin.settings.filenameTemplate).onChange(async (value) => {
        this.plugin.settings.filenameTemplate = value.trim() || DEFAULT_SETTINGS.filenameTemplate;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Daily notes").setHeading();
    new import_obsidian.Setting(containerEl).setName("Link entries into the daily note").setDesc("When an entry or thought note is logged, add a link to it under a heading in that day's daily note.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.dailyNoteLinking).onChange(async (value) => {
        this.plugin.settings.dailyNoteLinking = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Create the daily note if it doesn't exist").setDesc("Uses your Daily Notes plugin folder and date format.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.createDailyNoteIfMissing).onChange(async (value) => {
        this.plugin.settings.createDailyNoteIfMissing = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Daily note heading").setDesc("Links are inserted under this heading, wherever it sits in the note \u2014 add it to your daily-note template to control the position. It's only created at the end of the note if it doesn't exist.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.dailyNoteHeading).setValue(this.plugin.settings.dailyNoteHeading).onChange(async (value) => {
        this.plugin.settings.dailyNoteHeading = value.trim() || DEFAULT_SETTINGS.dailyNoteHeading;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Placement marker").setDesc("If this text appears anywhere in the daily note (e.g. from your template), links are inserted right after it instead of under the heading. Useful for pinning an exact spot without a visible heading. Leave empty to disable.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.dailyNoteMarker).setValue(this.plugin.settings.dailyNoteMarker).onChange(async (value) => {
        this.plugin.settings.dailyNoteMarker = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Triggers, factors & dashboard").setHeading();
    new import_obsidian.Setting(containerEl).setName("Known triggers").setDesc("One per line. These show as one-tap chips in the quick-capture form. Triggers typed during capture are added here automatically.").addTextArea((text) => {
      text.setPlaceholder("crowds\nloud noise\nschedule change").setValue(this.plugin.settings.knownTriggers.join("\n")).onChange(async (value) => {
        this.plugin.settings.knownTriggers = value.split("\n").map((t) => t.trim()).filter((t) => t.length > 0);
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 6;
    });
    new import_obsidian.Setting(containerEl).setName("Known factors").setDesc("Background contributors \u2014 sleep, food, environment, and so on. One per line; shown as one-tap chips in the quick-capture form and added here automatically when typed during capture.").addTextArea((text) => {
      text.setPlaceholder("poor sleep\nlittle food today\nloud environment").setValue(this.plugin.settings.knownFactors.join("\n")).onChange(async (value) => {
        this.plugin.settings.knownFactors = value.split("\n").map((t) => t.trim()).filter((t) => t.length > 0);
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 6;
    });
    new import_obsidian.Setting(containerEl).setName("Heatmap range (weeks)").setDesc("How many weeks of history the dashboard heatmap shows.").addSlider(
      (slider) => slider.setLimits(8, 52, 1).setValue(this.plugin.settings.heatmapWeeks).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.heatmapWeeks = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/quickCapture.ts
var import_obsidian4 = require("obsidian");

// src/types.ts
var ENTRY_TYPE = "spiral-entry";
var THOUGHT_TYPE = "spiral-thought";
var KINDS = [
  { value: "shutdown", label: "Shutdown", icon: "moon" },
  { value: "meltdown", label: "Meltdown", icon: "cloud-lightning" },
  { value: "panic-attack", label: "Panic attack", icon: "heart-pulse" },
  { value: "spiral", label: "Spiral", icon: "tornado" },
  { value: "other", label: "Other", icon: "circle-ellipsis" }
];
function kindInfo(kind) {
  var _a;
  return (_a = KINDS.find((k) => k.value === kind)) != null ? _a : KINDS[KINDS.length - 1];
}
var SEVERITY_LABELS = {
  1: "Mild",
  2: "Noticeable",
  3: "Moderate",
  4: "Intense",
  5: "Severe"
};
function splitList(value) {
  return value.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
}

// src/store.ts
var import_obsidian2 = require("obsidian");
function yamlScalar(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;
}
function yamlText(key, value) {
  if (/\r?\n/.test(value)) {
    const body = value.split(/\r?\n/).map((line) => `  ${line}`).join("\n");
    return `${key}: |-
${body}`;
  }
  return `${key}: ${yamlScalar(value)}`;
}
function yamlList(key, values) {
  if (values.length === 0) return `${key}: []`;
  return `${key}:
` + values.map((v) => `  - ${yamlScalar(v)}`).join("\n");
}
function buildEntryContent(data) {
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
    yamlText("factors", data.factors),
    yamlList("tags", data.tags),
    "---"
  ].join("\n");
  const label = kindInfo(data.kind).label;
  const body = [
    "",
    `# ${label} \u2014 ${data.date} ${data.time}`,
    "",
    "> Logged with Spiral & Shutdown Logger. Everything above is editable \u2014 fill in detail whenever you're ready, or leave it as is.",
    "",
    "## Notes",
    ""
  ].join("\n");
  return fm + body;
}
function buildThoughtContent(date, time, text) {
  const fm = ["---", `type: ${THOUGHT_TYPE}`, `date: ${date}`, `time: ${yamlScalar(time)}`, "tags: []", "---"].join("\n");
  return `${fm}

${text.trim()}
`;
}
async function ensureFolder(app, path) {
  const normalized = (0, import_obsidian2.normalizePath)(path);
  if (!normalized || normalized === "/") return;
  if (app.vault.getAbstractFileByPath(normalized)) return;
  await app.vault.createFolder(normalized).catch(() => {
  });
}
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim() || "entry";
}
async function createUniqueNote(app, folder, basename, content) {
  await ensureFolder(app, folder);
  const base = sanitizeFilename(basename);
  for (let i = 0; i < 1e3; i++) {
    const name = i === 0 ? base : `${base} ${i + 1}`;
    const path = (0, import_obsidian2.normalizePath)(`${folder}/${name}.md`);
    if (!app.vault.getAbstractFileByPath(path)) {
      return await app.vault.create(path, content);
    }
  }
  throw new Error("Could not find a unique filename");
}
async function createEntryNote(app, settings, data) {
  const basename = settings.filenameTemplate.replace(/\{\{date\}\}/g, data.date).replace(/\{\{time\}\}/g, data.time.replace(":", "-")).replace(/\{\{kind\}\}/g, data.kind);
  return createUniqueNote(app, settings.entryFolder, basename, buildEntryContent(data));
}
async function createThoughtNote(app, settings, date, time, text) {
  const basename = `${date} ${time.replace(":", "-")} thoughts`;
  return createUniqueNote(app, settings.thoughtFolder, basename, buildThoughtContent(date, time, text));
}
function str(v) {
  if (v === null || v === void 0) return "";
  return String(v);
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function coerceKind(v) {
  const s = str(v);
  return KINDS.some((k) => k.value === s) ? s : "other";
}
function getEntries(app, _settings) {
  var _a;
  const entries = [];
  for (const file of app.vault.getMarkdownFiles()) {
    const fm = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
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
      // `sleep_prior` is the pre-1.0 name for this field; keep reading it.
      factors: str(fm.factors) || str(fm.sleep_prior),
      tags: Array.isArray(fm.tags) ? fm.tags.map(str) : []
    });
  }
  entries.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return entries;
}
function valueCounts(entries, field) {
  var _a;
  const counts = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    for (const t of splitList(field(entry))) {
      const key = t.toLowerCase();
      counts.set(key, ((_a = counts.get(key)) != null ? _a : 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([trigger, count]) => ({ trigger, count })).sort((a, b) => b.count - a.count || a.trigger.localeCompare(b.trigger));
}
function triggerCounts(entries) {
  return valueCounts(entries, (e) => e.trigger);
}
function factorCounts(entries) {
  return valueCounts(entries, (e) => e.factors);
}

// src/dailyNote.ts
var import_obsidian3 = require("obsidian");
function getDailyNoteConfig(app) {
  var _a, _b, _c, _d, _e, _f, _g;
  const anyApp = app;
  const options = (_e = (_d = (_c = (_b = (_a = anyApp.internalPlugins) == null ? void 0 : _a.getPluginById) == null ? void 0 : _b.call(_a, "daily-notes")) == null ? void 0 : _c.instance) == null ? void 0 : _d.options) != null ? _e : {};
  return {
    folder: ((_f = options.folder) != null ? _f : "").trim(),
    format: ((_g = options.format) != null ? _g : "").trim() || "YYYY-MM-DD"
  };
}
function insertAtPlacement(content, marker, heading, line) {
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
function insertUnderHeading(content, heading, line) {
  const lines = content.split("\n");
  const headingText = heading.trim();
  const headingIdx = lines.findIndex((l) => l.trim() === headingText);
  if (headingIdx === -1) {
    const trimmed = content.replace(/\s+$/, "");
    return (trimmed ? trimmed + "\n\n" : "") + `${headingText}

${line}
`;
  }
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
async function linkInDailyNote(app, settings, date, time, file, label) {
  if (!settings.dailyNoteLinking) return;
  try {
    const config = getDailyNoteConfig(app);
    const name = (0, import_obsidian3.moment)(date, "YYYY-MM-DD").format(config.format);
    const path = (0, import_obsidian3.normalizePath)((config.folder ? config.folder + "/" : "") + name + ".md");
    let daily = app.vault.getAbstractFileByPath(path);
    if (!daily) {
      if (!settings.createDailyNoteIfMissing) return;
      if (config.folder) await ensureFolder(app, config.folder);
      daily = await app.vault.create(path, "");
    }
    if (!(daily instanceof import_obsidian3.TFile)) return;
    const linktext = app.metadataCache.fileToLinktext(file, daily.path);
    const line = `- ${time} [[${linktext}|${label}]]`;
    await app.vault.process(
      daily,
      (content) => insertAtPlacement(content, settings.dailyNoteMarker, settings.dailyNoteHeading, line)
    );
  } catch (e) {
    console.error("Spiral & Shutdown Logger: daily note linking failed", e);
  }
}

// src/quickCapture.ts
var QuickCaptureModal = class extends import_obsidian4.Modal {
  constructor(app, plugin) {
    super(app);
    this.kind = null;
    this.severity = null;
    this.selectedTriggers = /* @__PURE__ */ new Set();
    this.selectedFactors = /* @__PURE__ */ new Set();
    this.warningSigns = "";
    this.thoughts = "";
    this.durationMin = 0;
    this.recoveryNotes = "";
    this.tagsText = "";
    this.saved = false;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("ssl-capture");
    this.titleEl.setText("Log what's happening");
    const placeholderBtn = contentEl.createEl("button", { cls: "ssl-placeholder-btn" });
    (0, import_obsidian4.setIcon)(placeholderBtn.createSpan({ cls: "ssl-btn-icon" }), "zap");
    placeholderBtn.createSpan({ text: "Just save a timestamped entry now" });
    placeholderBtn.addEventListener("click", () => {
      var _a, _b;
      this.kind = (_a = this.kind) != null ? _a : "other";
      this.severity = (_b = this.severity) != null ? _b : 3;
      void this.save();
    });
    contentEl.createDiv({ cls: "ssl-field-label", text: "What kind?" });
    const kindGrid = contentEl.createDiv({ cls: "ssl-kind-grid" });
    const kindButtons = /* @__PURE__ */ new Map();
    for (const k of KINDS) {
      const btn = kindGrid.createEl("button", { cls: "ssl-kind-btn" });
      (0, import_obsidian4.setIcon)(btn.createSpan({ cls: "ssl-btn-icon" }), k.icon);
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
    const sevButtons = [];
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
  renderDetails(contentEl) {
    const details = contentEl.createEl("details", { cls: "ssl-details" });
    details.createEl("summary", { text: "Add details (optional \u2014 you can also edit the note later)" });
    const body = details.createDiv();
    this.chipPicker(body, "Trigger", "New trigger\u2026", this.selectedTriggers, () => this.plugin.settings.knownTriggers);
    this.chipPicker(
      body,
      "Background factors (sleep, food, environment\u2026)",
      "New factor\u2026",
      this.selectedFactors,
      () => this.plugin.settings.knownFactors
    );
    new import_obsidian4.Setting(body).setName("Warning signs").addText(
      (t) => t.setPlaceholder("what led up to it").onChange((v) => this.warningSigns = v)
    );
    new import_obsidian4.Setting(body).setName("Thoughts").setDesc("The actual spiral content, if you want to capture it here.").addTextArea((t) => {
      t.setPlaceholder("whatever is going through your head").onChange((v) => this.thoughts = v);
      t.inputEl.rows = 3;
    });
    new import_obsidian4.Setting(body).setName("Duration (minutes)").addText((t) => {
      t.inputEl.type = "number";
      t.inputEl.inputMode = "numeric";
      t.setPlaceholder("0").onChange((v) => this.durationMin = Math.max(0, Number(v) || 0));
    });
    new import_obsidian4.Setting(body).setName("Recovery notes").addText(
      (t) => t.setPlaceholder("what helped").onChange((v) => this.recoveryNotes = v)
    );
    new import_obsidian4.Setting(body).setName("Tags").setDesc("Comma-separated.").addText(
      (t) => t.setPlaceholder("work, sensory").onChange((v) => this.tagsText = v)
    );
  }
  /** A label + toggleable chip row + "add new" input backed by a persisted known-items list. */
  chipPicker(body, label, placeholder, selected, known) {
    body.createDiv({ cls: "ssl-field-label", text: label });
    const chipWrap = body.createDiv({ cls: "ssl-chips" });
    const renderChips = () => {
      chipWrap.empty();
      for (const item of known()) {
        const chip = chipWrap.createEl("button", { cls: "ssl-chip", text: item });
        chip.toggleClass("is-selected", selected.has(item));
        chip.addEventListener("click", () => {
          if (selected.has(item)) selected.delete(item);
          else selected.add(item);
          chip.toggleClass("is-selected", selected.has(item));
        });
      }
    };
    renderChips();
    const addRow = body.createDiv({ cls: "ssl-add-trigger" });
    const addInput = addRow.createEl("input", { type: "text", placeholder, cls: "ssl-text-input" });
    const addBtn = addRow.createEl("button", { cls: "ssl-chip-add", text: "Add" });
    const addItem = async () => {
      const value = addInput.value.trim();
      if (!value) return;
      const list = known();
      if (!list.includes(value)) {
        list.push(value);
        await this.plugin.saveSettings();
      }
      selected.add(value);
      addInput.value = "";
      renderChips();
    };
    addBtn.addEventListener("click", () => void addItem());
    addInput.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        void addItem();
      }
    });
  }
  updateSaveState() {
    const ready = this.kind !== null && this.severity !== null;
    this.saveBtn.disabled = !ready;
    this.saveBtn.setText(ready ? "Save entry" : "Pick a kind and intensity (or just save above)");
  }
  async save() {
    var _a, _b;
    if (this.saved) return;
    this.saved = true;
    const now = (0, import_obsidian4.moment)();
    const data = {
      date: now.format("YYYY-MM-DD"),
      time: now.format("HH:mm"),
      kind: (_a = this.kind) != null ? _a : "other",
      severity: (_b = this.severity) != null ? _b : 3,
      trigger: Array.from(this.selectedTriggers).join(", "),
      warning_signs: this.warningSigns.trim(),
      thoughts: this.thoughts.trim(),
      duration_min: this.durationMin,
      recovery_notes: this.recoveryNotes.trim(),
      factors: Array.from(this.selectedFactors).join(", "),
      tags: splitList(this.tagsText)
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
      new import_obsidian4.Notice("Couldn't save the entry \u2014 check the folder setting.");
    }
  }
  showSavedNotice(file) {
    const notice = new import_obsidian4.Notice("", 6e3);
    notice.messageEl.setText("Logged. You're doing okay. ");
    const open = notice.messageEl.createEl("a", { text: "Open note" });
    open.addEventListener("click", () => {
      void this.app.workspace.openLinkText(file.path, "", false);
      notice.hide();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/thoughtCapture.ts
var import_obsidian5 = require("obsidian");
var ThoughtCaptureModal = class extends import_obsidian5.Modal {
  constructor(app, plugin) {
    super(app);
    this.saved = false;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("ssl-thoughts");
    this.titleEl.setText("Get it out of your head");
    this.textarea = contentEl.createEl("textarea", {
      cls: "ssl-thoughts-area",
      attr: { placeholder: "Type whatever is spinning. No structure needed. It saves even if you just close this." }
    });
    this.textarea.rows = 8;
    const saveBtn = contentEl.createEl("button", { cls: "ssl-save-btn mod-cta", text: "Save" });
    saveBtn.addEventListener("click", () => {
      void this.save(true);
    });
    window.setTimeout(() => this.textarea.focus(), 50);
  }
  async save(closeAfter) {
    const text = this.textarea.value.trim();
    if (this.saved || !text) {
      if (closeAfter) this.close();
      return;
    }
    this.saved = true;
    const now = (0, import_obsidian5.moment)();
    const date = now.format("YYYY-MM-DD");
    const time = now.format("HH:mm");
    try {
      const file = await createThoughtNote(this.app, this.plugin.settings, date, time, text);
      await linkInDailyNote(this.app, this.plugin.settings, date, time, file, `thoughts at ${time}`);
      new import_obsidian5.Notice("Saved.");
    } catch (e) {
      this.saved = false;
      console.error("Spiral & Shutdown Logger: failed to save thoughts", e);
      new import_obsidian5.Notice("Couldn't save \u2014 check the thoughts folder setting.");
      return;
    }
    if (closeAfter) this.close();
  }
  onClose() {
    void this.save(false);
    this.contentEl.empty();
  }
};

// src/dashboard.ts
var import_obsidian8 = require("obsidian");

// src/charts.ts
var import_obsidian6 = require("obsidian");
var SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (parent) parent.appendChild(el);
  return el;
}
var Tooltip = class {
  constructor(parent) {
    this.el = parent.createDiv({ cls: "ssl-tooltip" });
    this.el.hide();
  }
  show(text, x, y) {
    this.el.setText(text);
    this.el.show();
    const rect = this.el.getBoundingClientRect();
    const left = Math.min(Math.max(8, x - rect.width / 2), window.innerWidth - rect.width - 8);
    const top = y - rect.height - 12 < 8 ? y + 16 : y - rect.height - 12;
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }
  hide() {
    this.el.hide();
  }
};
function bindTooltip(target, tooltip, text) {
  const show = (evt) => tooltip.show(text(), evt.clientX, evt.clientY);
  target.addEventListener("pointerenter", show);
  target.addEventListener("pointermove", show);
  target.addEventListener("pointerleave", () => tooltip.hide());
  target.addEventListener("pointerdown", show);
}
function bucketByDay(entries) {
  const days = /* @__PURE__ */ new Map();
  for (const e of entries) {
    let bucket = days.get(e.date);
    if (!bucket) {
      bucket = { date: e.date, count: 0, severitySum: 0, maxSeverity: 0 };
      days.set(e.date, bucket);
    }
    bucket.count++;
    bucket.severitySum += e.severity;
    bucket.maxSeverity = Math.max(bucket.maxSeverity, e.severity);
  }
  return days;
}
function heatLevel(bucket) {
  if (!bucket) return 0;
  const score = bucket.severitySum;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 7) return 3;
  if (score <= 11) return 4;
  return 5;
}
function renderHeatmap(parent, entries, weeks, tooltip) {
  const days = bucketByDay(entries);
  const cell = 13;
  const gap = 3;
  const leftPad = 26;
  const topPad = 18;
  const width = leftPad + weeks * (cell + gap);
  const height = topPad + 7 * (cell + gap);
  const scroller = parent.createDiv({ cls: "ssl-heatmap-scroll" });
  const svg = svgEl("svg", {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    class: "ssl-heatmap",
    role: "img",
    "aria-label": "Calendar heatmap of logged entries"
  });
  scroller.appendChild(svg);
  const today = (0, import_obsidian6.moment)().startOf("day");
  const start = today.clone().startOf("isoWeek").subtract(weeks - 1, "weeks");
  const dayLabels = [
    { row: 0, text: "Mon" },
    { row: 2, text: "Wed" },
    { row: 4, text: "Fri" }
  ];
  for (const { row, text } of dayLabels) {
    svgEl("text", { x: 0, y: topPad + row * (cell + gap) + cell - 3, class: "ssl-chart-label" }, svg).textContent = text;
  }
  let lastMonth = "";
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const day = start.clone().add(w, "weeks").add(d, "days");
      if (day.isAfter(today)) continue;
      const iso = day.format("YYYY-MM-DD");
      const bucket = days.get(iso);
      const level = heatLevel(bucket);
      if (d === 0) {
        const month = day.format("MMM");
        if (month !== lastMonth && day.date() <= 21) {
          svgEl("text", { x: leftPad + w * (cell + gap), y: 11, class: "ssl-chart-label" }, svg).textContent = month;
          lastMonth = month;
        }
      }
      const rect = svgEl(
        "rect",
        {
          x: leftPad + w * (cell + gap),
          y: topPad + d * (cell + gap),
          width: cell,
          height: cell,
          rx: 3,
          class: `ssl-heat-cell ssl-heat-${level}`
        },
        svg
      );
      bindTooltip(rect, tooltip, () => {
        const label = day.format("ddd, MMM D");
        if (!bucket) return `${label} \u2014 no entries`;
        const plural = bucket.count === 1 ? "entry" : "entries";
        return `${label} \u2014 ${bucket.count} ${plural}, top severity ${bucket.maxSeverity}`;
      });
    }
  }
  const legend = parent.createDiv({ cls: "ssl-heat-legend" });
  legend.createSpan({ text: "Less" });
  for (let level = 0; level <= 5; level++) {
    legend.createSpan({ cls: `ssl-heat-swatch ssl-heat-${level}` });
  }
  legend.createSpan({ text: "More" });
}
function renderSeverityTrend(parent, entries, weeks, widthPx, tooltip) {
  var _a;
  const today = (0, import_obsidian6.moment)().startOf("day");
  const startWeek = today.clone().startOf("isoWeek").subtract(weeks - 1, "weeks");
  const byWeek = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const m = (0, import_obsidian6.moment)(e.date, "YYYY-MM-DD").startOf("isoWeek");
    const index = m.diff(startWeek, "weeks");
    if (index < 0 || index >= weeks) continue;
    const acc = (_a = byWeek.get(index)) != null ? _a : { sum: 0, count: 0 };
    acc.sum += e.severity;
    acc.count++;
    byWeek.set(index, acc);
  }
  const points = [];
  for (let i = 0; i < weeks; i++) {
    const acc = byWeek.get(i);
    if (!acc) continue;
    points.push({
      index: i,
      label: startWeek.clone().add(i, "weeks").format("MMM D"),
      avg: acc.sum / acc.count,
      count: acc.count
    });
  }
  const width = Math.max(280, widthPx);
  const height = 160;
  const pad = { left: 26, right: 12, top: 10, bottom: 22 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const svg = svgEl("svg", {
    width: "100%",
    height,
    viewBox: `0 0 ${width} ${height}`,
    class: "ssl-line-chart",
    role: "img",
    "aria-label": "Average severity per week"
  });
  parent.appendChild(svg);
  const x = (index) => pad.left + (weeks === 1 ? plotW / 2 : index / (weeks - 1) * plotW);
  const y = (severity) => pad.top + (1 - (severity - 1) / 4) * plotH;
  for (let s = 1; s <= 5; s++) {
    svgEl("line", { x1: pad.left, x2: width - pad.right, y1: y(s), y2: y(s), class: "ssl-gridline" }, svg);
    svgEl("text", { x: pad.left - 6, y: y(s) + 3, "text-anchor": "end", class: "ssl-chart-label" }, svg).textContent = String(s);
  }
  if (points.length > 0) {
    const first = points[0];
    const last = points[points.length - 1];
    svgEl("text", { x: x(first.index), y: height - 6, "text-anchor": "start", class: "ssl-chart-label" }, svg).textContent = first.label;
    if (last !== first) {
      svgEl("text", { x: x(last.index), y: height - 6, "text-anchor": "end", class: "ssl-chart-label" }, svg).textContent = last.label;
    }
  }
  let path = "";
  let prevIndex = null;
  for (const p of points) {
    const cmd = prevIndex !== null && p.index - prevIndex === 1 ? "L" : "M";
    path += `${cmd}${x(p.index).toFixed(1)},${y(p.avg).toFixed(1)}`;
    prevIndex = p.index;
  }
  if (path) svgEl("path", { d: path, class: "ssl-line" }, svg);
  for (const p of points) {
    svgEl("circle", { cx: x(p.index), cy: y(p.avg), r: 4, class: "ssl-line-dot" }, svg);
    const hit = svgEl("circle", { cx: x(p.index), cy: y(p.avg), r: 16, class: "ssl-hit" }, svg);
    bindTooltip(hit, tooltip, () => {
      const plural = p.count === 1 ? "entry" : "entries";
      return `Week of ${p.label} \u2014 avg severity ${p.avg.toFixed(1)} (${p.count} ${plural})`;
    });
  }
  if (points.length > 0) {
    const last = points[points.length - 1];
    svgEl(
      "text",
      {
        x: Math.min(x(last.index) + 8, width - pad.right),
        y: y(last.avg) - 8,
        "text-anchor": "end",
        class: "ssl-chart-label ssl-chart-label-strong"
      },
      svg
    ).textContent = last.avg.toFixed(1);
  }
}
function renderTriggerBars(parent, counts, maxRows = 10) {
  const shown = counts.slice(0, maxRows);
  const max = shown.length > 0 ? shown[0].count : 1;
  const list = parent.createDiv({ cls: "ssl-bars" });
  for (const { trigger, count } of shown) {
    const row = list.createDiv({ cls: "ssl-bar-row" });
    row.createDiv({ cls: "ssl-bar-label", text: trigger, attr: { title: trigger } });
    const track = row.createDiv({ cls: "ssl-bar-track" });
    const fill = track.createDiv({ cls: "ssl-bar-fill" });
    fill.style.width = `${Math.max(4, count / max * 100)}%`;
    row.createDiv({ cls: "ssl-bar-count", text: String(count) });
  }
  if (counts.length > maxRows) {
    list.createDiv({ cls: "ssl-bars-more", text: `+ ${counts.length - maxRows} more triggers` });
  }
}

// src/export.ts
var import_obsidian7 = require("obsidian");
function csvCell(value) {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function entriesToCsv(entries) {
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
    "file"
  ];
  const rows = entries.map(
    (e) => [
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
      e.file.path
    ].map(csvCell).join(",")
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}
function buildSummaryMarkdown(entries) {
  var _a;
  const lines = [];
  const generated = (0, import_obsidian7.moment)().format("YYYY-MM-DD HH:mm");
  lines.push("# Spiral & shutdown log \u2014 summary", "");
  lines.push(`Generated ${generated}. ${entries.length} entries total.`, "");
  if (entries.length === 0) return lines.join("\n");
  const oldest = entries[entries.length - 1].date;
  const newest = entries[0].date;
  lines.push(`**Date range:** ${oldest} \u2192 ${newest}`, "");
  lines.push("## Entries by kind", "");
  lines.push("| Kind | Count | Avg severity |", "| --- | ---: | ---: |");
  for (const k of KINDS) {
    const subset = entries.filter((e) => e.kind === k.value);
    if (subset.length === 0) continue;
    const avg = subset.reduce((sum, e) => sum + e.severity, 0) / subset.length;
    lines.push(`| ${k.label} | ${subset.length} | ${avg.toFixed(1)} |`);
  }
  lines.push("");
  const triggers = triggerCounts(entries);
  if (triggers.length > 0) {
    lines.push("## Triggers", "");
    lines.push("| Trigger | Times logged |", "| --- | ---: |");
    for (const { trigger, count } of triggers.slice(0, 20)) {
      lines.push(`| ${trigger} | ${count} |`);
    }
    lines.push("");
  }
  const factors = factorCounts(entries);
  if (factors.length > 0) {
    lines.push("## Background factors", "");
    lines.push("| Factor | Times logged |", "| --- | ---: |");
    for (const { trigger, count } of factors.slice(0, 20)) {
      lines.push(`| ${trigger} | ${count} |`);
    }
    lines.push("");
  }
  const byMonth = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    const acc = (_a = byMonth.get(month)) != null ? _a : { count: 0, sum: 0 };
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
  lines.push("## All entries", "");
  lines.push("| Date | Time | Kind | Severity | Duration (min) | Trigger | What helped |", "| --- | --- | --- | ---: | ---: | --- | --- |");
  for (const e of [...entries].reverse()) {
    const clean = (s) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    lines.push(
      `| ${e.date} | ${e.time} | ${kindInfo(e.kind).label} | ${e.severity} | ${e.duration_min || ""} | ${clean(e.trigger)} | ${clean(e.recovery_notes)} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}
async function writeExport(app, folder, filename, content) {
  await ensureFolder(app, folder);
  const path = (0, import_obsidian7.normalizePath)(`${folder}/${filename}`);
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof import_obsidian7.TFile) {
    await app.vault.modify(existing, content);
    return existing;
  }
  return await app.vault.create(path, content);
}
async function exportCsv(app, settings) {
  const entries = getEntries(app, settings);
  const stamp = (0, import_obsidian7.moment)().format("YYYY-MM-DD");
  const file = await writeExport(app, settings.exportFolder, `spiral-log-${stamp}.csv`, entriesToCsv(entries));
  new import_obsidian7.Notice(`Exported ${entries.length} entries to ${file.path}`);
}
async function exportSummary(app, settings) {
  const entries = getEntries(app, settings);
  const stamp = (0, import_obsidian7.moment)().format("YYYY-MM-DD");
  const file = await writeExport(app, settings.exportFolder, `spiral-log-summary-${stamp}.md`, buildSummaryMarkdown(entries));
  await app.workspace.openLinkText(file.path, "", true);
  new import_obsidian7.Notice("Summary created \u2014 export to PDF via the note menu if needed.");
}

// src/dashboard.ts
var DASHBOARD_VIEW_TYPE = "spiral-logger-dashboard";
var DashboardView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.tooltip = null;
    this.renderTimer = null;
    this.plugin = plugin;
  }
  getViewType() {
    return DASHBOARD_VIEW_TYPE;
  }
  getDisplayText() {
    return "Spiral log dashboard";
  }
  getIcon() {
    return "activity";
  }
  async onOpen() {
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRender()));
    this.registerEvent(this.app.vault.on("rename", () => this.scheduleRender()));
    this.render();
  }
  scheduleRender() {
    if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => {
      this.renderTimer = null;
      this.render();
    }, 400);
  }
  render() {
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
        text: "When something happens, tap \u201CLog now\u201D \u2014 kind and intensity are enough, detail can wait."
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
    const factors = factorCounts(entries);
    if (factors.length > 0) {
      const factorCard = this.card(root, "Background factors (sleep, food, environment\u2026)");
      renderTriggerBars(factorCard, factors);
    }
    this.renderRecent(root, entries);
  }
  card(parent, title) {
    const card = parent.createDiv({ cls: "ssl-card" });
    card.createDiv({ cls: "ssl-card-title", text: title });
    return card;
  }
  renderActions(root) {
    const row = root.createDiv({ cls: "ssl-actions" });
    const action = (icon, label, cls, onClick) => {
      const btn = row.createEl("button", { cls: `ssl-action-btn ${cls}` });
      (0, import_obsidian8.setIcon)(btn.createSpan({ cls: "ssl-btn-icon" }), icon);
      btn.createSpan({ text: label });
      btn.addEventListener("click", onClick);
    };
    action("zap", "Log now", "mod-cta", () => new QuickCaptureModal(this.app, this.plugin).open());
    action("pencil-line", "Jot thoughts", "", () => new ThoughtCaptureModal(this.app, this.plugin).open());
    action("table", "CSV", "ssl-action-small", () => void exportCsv(this.app, this.plugin.settings));
    action("file-text", "Summary", "ssl-action-small", () => void exportSummary(this.app, this.plugin.settings));
  }
  renderStats(root, entries) {
    var _a, _b, _c, _d, _e;
    const cutoff = (0, import_obsidian8.moment)().subtract(30, "days").format("YYYY-MM-DD");
    const recent = entries.filter((e) => e.date >= cutoff);
    const avg = recent.length > 0 ? (recent.reduce((sum, e) => sum + e.severity, 0) / recent.length).toFixed(1) : "\u2014";
    const topTrigger = (_b = (_a = triggerCounts(recent)[0]) == null ? void 0 : _a.trigger) != null ? _b : "\u2014";
    const kindCount = /* @__PURE__ */ new Map();
    for (const e of recent) kindCount.set(e.kind, ((_c = kindCount.get(e.kind)) != null ? _c : 0) + 1);
    const topKind = (_e = (_d = Array.from(kindCount.entries()).sort((a, b) => b[1] - a[1])[0]) == null ? void 0 : _d[0]) != null ? _e : null;
    const grid = root.createDiv({ cls: "ssl-stats" });
    const tile = (value, label) => {
      const t = grid.createDiv({ cls: "ssl-stat" });
      t.createDiv({ cls: "ssl-stat-value", text: value });
      t.createDiv({ cls: "ssl-stat-label", text: label });
    };
    tile(String(recent.length), "entries \xB7 last 30 days");
    tile(avg, "avg severity \xB7 last 30 days");
    tile(topKind ? kindInfo(topKind).label : "\u2014", "most common kind");
    tile(topTrigger, "most common trigger");
  }
  renderRecent(root, entries) {
    const card = this.card(root, "Recent entries");
    const list = card.createDiv({ cls: "ssl-recent" });
    for (const entry of entries.slice(0, 10)) {
      const row = list.createEl("button", { cls: "ssl-recent-row" });
      const info = kindInfo(entry.kind);
      (0, import_obsidian8.setIcon)(row.createSpan({ cls: "ssl-btn-icon ssl-recent-icon" }), info.icon);
      const main = row.createDiv({ cls: "ssl-recent-main" });
      const head = main.createDiv({ cls: "ssl-recent-head" });
      head.createSpan({ cls: "ssl-recent-kind", text: info.label });
      head.createSpan({
        cls: "ssl-recent-date",
        text: `${(0, import_obsidian8.moment)(entry.date, "YYYY-MM-DD").format("ddd, MMM D")} \xB7 ${entry.time}`
      });
      const triggers = splitList(entry.trigger);
      if (triggers.length > 0) {
        main.createDiv({ cls: "ssl-recent-trigger", text: triggers.join(", ") });
      }
      const sev = row.createDiv({
        cls: "ssl-recent-sev",
        attr: { "aria-label": `Severity ${entry.severity} of 5 \u2014 ${SEVERITY_LABELS[entry.severity]}` }
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
  async onClose() {
    if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
    this.contentEl.empty();
  }
};

// src/main.ts
var SpiralLoggerPlugin = class extends import_obsidian9.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this));
    this.addRibbonIcon("zap", "Log a spiral / shutdown entry", () => {
      new QuickCaptureModal(this.app, this).open();
    });
    this.addRibbonIcon("pencil-line", "Jot spiraling thoughts", () => {
      new ThoughtCaptureModal(this.app, this).open();
    });
    this.addRibbonIcon("activity", "Open spiral log dashboard", () => {
      void this.activateDashboard();
    });
    this.addCommand({
      id: "quick-capture",
      name: "Log an entry (quick capture)",
      callback: () => new QuickCaptureModal(this.app, this).open()
    });
    this.addCommand({
      id: "thought-capture",
      name: "Jot spiraling thoughts",
      callback: () => new ThoughtCaptureModal(this.app, this).open()
    });
    this.addCommand({
      id: "open-dashboard",
      name: "Open dashboard",
      callback: () => void this.activateDashboard()
    });
    this.addCommand({
      id: "export-csv",
      name: "Export all entries to CSV",
      callback: () => void exportCsv(this.app, this.settings)
    });
    this.addCommand({
      id: "export-summary",
      name: "Export markdown summary (for appointments)",
      callback: () => void exportSummary(this.app, this.settings)
    });
    this.addSettingTab(new SpiralLoggerSettingTab(this.app, this));
  }
  async activateDashboard() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
    }
    void workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    var _a, _b;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.knownTriggers = [...(_a = this.settings.knownTriggers) != null ? _a : []];
    this.settings.knownFactors = [...(_b = this.settings.knownFactors) != null ? _b : DEFAULT_SETTINGS.knownFactors];
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
