import { moment } from "obsidian";
import type { SpiralEntry } from "./types";

/* ------------------------------------------------------------------ *
 * SVG + tooltip primitives                                            *
 * ------------------------------------------------------------------ */

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs: Record<string, string | number> = {},
	parent?: Element
): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
	if (parent) parent.appendChild(el);
	return el;
}

/** One shared tooltip per dashboard; positioned fixed so it survives scroll containers. */
export class Tooltip {
	private el: HTMLElement;

	constructor(parent: HTMLElement) {
		this.el = parent.createDiv({ cls: "ssl-tooltip" });
		this.el.hide();
	}

	show(text: string, x: number, y: number): void {
		this.el.setText(text);
		this.el.show();
		const rect = this.el.getBoundingClientRect();
		const left = Math.min(Math.max(8, x - rect.width / 2), window.innerWidth - rect.width - 8);
		const top = y - rect.height - 12 < 8 ? y + 16 : y - rect.height - 12;
		this.el.style.left = `${left}px`;
		this.el.style.top = `${top}px`;
	}

	hide(): void {
		this.el.hide();
	}
}

function bindTooltip(target: Element, tooltip: Tooltip, text: () => string): void {
	const show = (evt: PointerEvent) => tooltip.show(text(), evt.clientX, evt.clientY);
	target.addEventListener("pointerenter", show as EventListener);
	target.addEventListener("pointermove", show as EventListener);
	target.addEventListener("pointerleave", () => tooltip.hide());
	target.addEventListener("pointerdown", show as EventListener);
}

/* ------------------------------------------------------------------ *
 * Heatmap calendar                                                    *
 * ------------------------------------------------------------------ */

interface DayBucket {
	date: string;
	count: number;
	severitySum: number;
	maxSeverity: number;
}

function bucketByDay(entries: SpiralEntry[]): Map<string, DayBucket> {
	const days = new Map<string, DayBucket>();
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

/** Intensity level 0–5 from a day's combined frequency + severity score. */
function heatLevel(bucket: DayBucket | undefined): number {
	if (!bucket) return 0;
	const score = bucket.severitySum; // one mild entry = 1; a hard day accumulates
	if (score <= 2) return 1;
	if (score <= 4) return 2;
	if (score <= 7) return 3;
	if (score <= 11) return 4;
	return 5;
}

export function renderHeatmap(parent: HTMLElement, entries: SpiralEntry[], weeks: number, tooltip: Tooltip): void {
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
		"aria-label": "Calendar heatmap of logged entries",
	});
	scroller.appendChild(svg);

	// Grid starts on the Monday `weeks` weeks back and ends today.
	const today = moment().startOf("day");
	const start = today.clone().startOf("isoWeek").subtract(weeks - 1, "weeks");

	const dayLabels = [
		{ row: 0, text: "Mon" },
		{ row: 2, text: "Wed" },
		{ row: 4, text: "Fri" },
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
					class: `ssl-heat-cell ssl-heat-${level}`,
				},
				svg
			);
			bindTooltip(rect, tooltip, () => {
				const label = day.format("ddd, MMM D");
				if (!bucket) return `${label} — no entries`;
				const plural = bucket.count === 1 ? "entry" : "entries";
				return `${label} — ${bucket.count} ${plural}, top severity ${bucket.maxSeverity}`;
			});
		}
	}

	// Legend: less → more
	const legend = parent.createDiv({ cls: "ssl-heat-legend" });
	legend.createSpan({ text: "Less" });
	for (let level = 0; level <= 5; level++) {
		legend.createSpan({ cls: `ssl-heat-swatch ssl-heat-${level}` });
	}
	legend.createSpan({ text: "More" });
}

/* ------------------------------------------------------------------ *
 * Severity trend line chart (weekly average)                          *
 * ------------------------------------------------------------------ */

export function renderSeverityTrend(
	parent: HTMLElement,
	entries: SpiralEntry[],
	weeks: number,
	widthPx: number,
	tooltip: Tooltip
): void {
	const today = moment().startOf("day");
	const startWeek = today.clone().startOf("isoWeek").subtract(weeks - 1, "weeks");

	interface WeekPoint {
		index: number;
		label: string;
		avg: number;
		count: number;
	}
	const byWeek = new Map<number, { sum: number; count: number }>();
	for (const e of entries) {
		const m = moment(e.date, "YYYY-MM-DD").startOf("isoWeek");
		const index = m.diff(startWeek, "weeks");
		if (index < 0 || index >= weeks) continue;
		const acc = byWeek.get(index) ?? { sum: 0, count: 0 };
		acc.sum += e.severity;
		acc.count++;
		byWeek.set(index, acc);
	}
	const points: WeekPoint[] = [];
	for (let i = 0; i < weeks; i++) {
		const acc = byWeek.get(i);
		if (!acc) continue;
		points.push({
			index: i,
			label: startWeek.clone().add(i, "weeks").format("MMM D"),
			avg: acc.sum / acc.count,
			count: acc.count,
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
		"aria-label": "Average severity per week",
	});
	parent.appendChild(svg);

	const x = (index: number) => pad.left + (weeks === 1 ? plotW / 2 : (index / (weeks - 1)) * plotW);
	const y = (severity: number) => pad.top + (1 - (severity - 1) / 4) * plotH;

	// Hairline gridlines + y ticks at severity 1..5
	for (let s = 1; s <= 5; s++) {
		svgEl("line", { x1: pad.left, x2: width - pad.right, y1: y(s), y2: y(s), class: "ssl-gridline" }, svg);
		svgEl("text", { x: pad.left - 6, y: y(s) + 3, "text-anchor": "end", class: "ssl-chart-label" }, svg).textContent = String(s);
	}

	// x labels: first and last week with data (plus midpoint if room)
	if (points.length > 0) {
		const first = points[0];
		const last = points[points.length - 1];
		svgEl("text", { x: x(first.index), y: height - 6, "text-anchor": "start", class: "ssl-chart-label" }, svg).textContent =
			first.label;
		if (last !== first) {
			svgEl("text", { x: x(last.index), y: height - 6, "text-anchor": "end", class: "ssl-chart-label" }, svg).textContent =
				last.label;
		}
	}

	// Line path, broken across empty weeks so gaps aren't invented data.
	let path = "";
	let prevIndex: number | null = null;
	for (const p of points) {
		const cmd = prevIndex !== null && p.index - prevIndex === 1 ? "L" : "M";
		path += `${cmd}${x(p.index).toFixed(1)},${y(p.avg).toFixed(1)}`;
		prevIndex = p.index;
	}
	if (path) svgEl("path", { d: path, class: "ssl-line" }, svg);

	for (const p of points) {
		svgEl("circle", { cx: x(p.index), cy: y(p.avg), r: 4, class: "ssl-line-dot" }, svg);
		// Oversized invisible hit target for touch
		const hit = svgEl("circle", { cx: x(p.index), cy: y(p.avg), r: 16, class: "ssl-hit" }, svg);
		bindTooltip(hit, tooltip, () => {
			const plural = p.count === 1 ? "entry" : "entries";
			return `Week of ${p.label} — avg severity ${p.avg.toFixed(1)} (${p.count} ${plural})`;
		});
	}

	// Direct label on the last point
	if (points.length > 0) {
		const last = points[points.length - 1];
		svgEl(
			"text",
			{
				x: Math.min(x(last.index) + 8, width - pad.right),
				y: y(last.avg) - 8,
				"text-anchor": "end",
				class: "ssl-chart-label ssl-chart-label-strong",
			},
			svg
		).textContent = last.avg.toFixed(1);
	}
}

/* ------------------------------------------------------------------ *
 * Trigger frequency bars (plain HTML — responsive for free)           *
 * ------------------------------------------------------------------ */

export function renderTriggerBars(
	parent: HTMLElement,
	counts: { trigger: string; count: number }[],
	maxRows = 10
): void {
	const shown = counts.slice(0, maxRows);
	const max = shown.length > 0 ? shown[0].count : 1;
	const list = parent.createDiv({ cls: "ssl-bars" });

	for (const { trigger, count } of shown) {
		const row = list.createDiv({ cls: "ssl-bar-row" });
		row.createDiv({ cls: "ssl-bar-label", text: trigger, attr: { title: trigger } });
		const track = row.createDiv({ cls: "ssl-bar-track" });
		const fill = track.createDiv({ cls: "ssl-bar-fill" });
		fill.style.width = `${Math.max(4, (count / max) * 100)}%`;
		row.createDiv({ cls: "ssl-bar-count", text: String(count) });
	}

	if (counts.length > maxRows) {
		list.createDiv({ cls: "ssl-bars-more", text: `+ ${counts.length - maxRows} more triggers` });
	}
}
