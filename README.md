# Spiral & Shutdown Logger

An Obsidian plugin for fast, low-friction logging of shutdowns, meltdowns, panic attacks, and anxiety spirals — with trigger, sensory, and factor tracking, a calm dashboard, and automatic daily-note linking.

Built to be usable **during** a shutdown: big touch targets, no required typing, no wizards. One tap saves a timestamped placeholder; detail can always be added later by editing the note.

## Features

- **Quick capture** (`zap` icon or command): tap a kind, tap an intensity (1–5), save — or "Just save a timestamped entry now" with zero decisions. Optional detail behind a disclosure: one-tap chips for **triggers**, **sensory issues** (your maintained sensitivity list), and **background factors** (sleep, food, environment), plus thoughts, duration, recovery notes, and tags. New chip items are remembered automatically.
- **Thought capture** (`pencil-line` icon or command): an instantly-focused textarea for spiraling thoughts, saved as its own timestamped note — even if you just close it.
- **Daily-note linking**: entries and thoughts are linked into that day's daily note. Placement: a `%% spiral-log %%` marker in the note (put it in your daily-note template) wins; else the configured heading, wherever it sits; else appended at the end. Missing daily notes are created from your Daily Notes template (core `{{title}}`/`{{date}}`/`{{time}}` placeholders supported).
- **Dashboard** (`activity` icon or command): heatmap calendar, weekly severity trend, trigger / sensory / factor frequency bars, 30-day stat tiles, recent entries, and recent **thought notes with content previews** — all tap-to-open. Muted single-hue palette, readable in dark mode, no reds.
- **Export**: CSV of all entries, and a markdown summary (kind / trigger / sensory / factor / monthly breakdowns + full log table) for clinician appointments.

## Data format — no lock-in

One markdown note per entry, plain YAML frontmatter, in a folder you choose (default `Spiral Log/`):

```yaml
type: spiral-entry
date: 2026-07-11
time: "21:40"
kind: shutdown          # shutdown | meltdown | panic-attack | spiral | other
severity: 3             # 1-5
trigger: "schedule change"
sensory: "loud noise"
warning_signs: ""
thoughts: ""
duration_min: 0
recovery_notes: ""
factors: "poor sleep"
tags: []
```

Thought notes use `type: spiral-thought` with the text as the body. Notes are discovered by frontmatter type, not path — move and rename them freely; everything stays greppable and Dataview-queryable.

## Install

**BRAT**: add beta plugin `SilentNinja06/AHeatmap_obs` (a GitHub token is needed in BRAT settings while this repo is private).
**Manual**: copy `manifest.json`, `main.js`, `styles.css` from the latest release into `<vault>/.obsidian/plugins/spiral-shutdown-logger/`.

On mobile, add the "Log an entry (quick capture)" command to the toolbar for one-tap access.

## Developing

```bash
npm install
npm run dev     # watch build
npm run build   # typecheck + production build → main.js
```

Release: bump the version in `manifest.json` / `package.json` / `versions.json`, push, then run the "Release plugin" workflow (or push a matching tag).

## License

MIT
