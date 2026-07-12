# Spiral & Shutdown Logger

An Obsidian plugin for fast, low-friction logging of shutdowns, meltdowns, panic attacks, and anxiety spirals — with trigger tracking, a calm dashboard, and automatic daily-note linking.

Built to be usable **during** a shutdown or panic attack: big touch targets, no required typing, no multi-step wizards. One tap saves a timestamped placeholder entry; detail can always be added later by editing the note.

## What it does

- **Quick capture** (`zap` ribbon icon, command palette, or a mobile toolbar button): tap a kind (shutdown / meltdown / panic attack / spiral / other), tap an intensity (1–5), tap save. Or tap **"Just save a timestamped entry now"** and decide nothing at all. Trigger chips, background-factor chips (sleep, food, environment…), thoughts, duration, recovery notes, and tags are all optional, behind a disclosure.
- **Thought capture**: an instantly-focused textarea for dumping spiraling thoughts. It saves as its own timestamped note — even if you just close the window with text in it.
- **Trigger & factor log**: one-tap chips in the capture form for triggers and for background factors (poor sleep, little food, loud environment, …); new items are remembered automatically. The dashboard shows how often each comes up.
- **Daily-note linking**: every entry and thought note is linked into that day's daily note (uses your Daily Notes plugin folder/format; toggleable). You control *where*: if the note contains the placement marker (`%% spiral-log %%` by default — put it in your daily-note template), links go right there; otherwise they go under the configured heading wherever it sits; the heading is only appended at the end as a last resort.
- **Dashboard** (`activity` ribbon icon): a GitHub-style heatmap of when things have been happening, a weekly severity trend line, trigger and factor frequency bars, 30-day summary tiles, and a recent-entries list with tap-to-open. Charts use a single muted blue ramp — deliberately no reds — and are readable in dark mode.
- **Export**: one command for a CSV of all entries, one for a formatted markdown summary (kind/trigger/monthly breakdowns plus a full log table) ready to bring to a psychiatrist or therapist appointment.

## Data format — no lock-in

Every entry is a plain markdown note with YAML frontmatter, one note per entry, in a folder you choose (default `Spiral Log/`):

```yaml
type: spiral-entry
date: 2026-07-11
time: "21:40"
kind: shutdown          # shutdown | meltdown | panic-attack | spiral | other
severity: 3             # 1-5
trigger: "schedule change"
warning_signs: ""
thoughts: ""
duration_min: 0
recovery_notes: ""
factors: "poor sleep, little food today"   # background contributors: sleep, food, environment, …
tags: []
```

Thought notes use `type: spiral-thought` with the raw text as the note body. (Entries written by pre-1.0 builds used `sleep_prior` instead of `factors`; those are still read.)

Entries are discovered by the `type: spiral-entry` frontmatter, not by path — you can move, rename, and reorganize notes freely, and everything stays greppable and Dataview-queryable if you ever stop using the plugin.

## Install

### Via BRAT (recommended until this is in the community list)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin.
2. In BRAT settings, choose **Add beta plugin** and enter `SilentNinja06/AHeatmap_obs`.
3. Enable **Spiral & Shutdown Logger** in Community plugins.

### Manual

Copy `manifest.json`, `main.js`, and `styles.css` from the latest release into `<vault>/.obsidian/plugins/spiral-shutdown-logger/` and enable the plugin.

## Mobile setup tip

For true one-tap access on mobile, add the **"Log an entry (quick capture)"** command to the mobile toolbar (Settings → Toolbar). The ribbon icons work on mobile too.

## Settings

- Entry / thoughts / export folder locations
- Filename template (`{{date}} {{time}} {{kind}}`)
- Daily-note linking toggle, heading, placement marker, and create-if-missing behavior
- Known triggers and known factors lists (editable; auto-populated as you log)
- Heatmap history length

## Developing

```bash
npm install
npm run dev     # watch build
npm run build   # typecheck + production build → main.js
```

Releases: tag `x.y.z` (matching `manifest.json`) and the GitHub Action builds and attaches `main.js`, `manifest.json`, and `styles.css` to the release, which is what BRAT consumes.

## License

MIT
