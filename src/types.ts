import type { TFile } from "obsidian";

export const ENTRY_TYPE = "spiral-entry";
export const THOUGHT_TYPE = "spiral-thought";

export type Kind = "shutdown" | "meltdown" | "panic-attack" | "spiral" | "other";

export interface KindInfo {
	value: Kind;
	label: string;
	icon: string;
}

export const KINDS: KindInfo[] = [
	{ value: "shutdown", label: "Shutdown", icon: "moon" },
	{ value: "meltdown", label: "Meltdown", icon: "cloud-lightning" },
	{ value: "panic-attack", label: "Panic attack", icon: "heart-pulse" },
	{ value: "spiral", label: "Spiral", icon: "tornado" },
	{ value: "other", label: "Other", icon: "circle-ellipsis" },
];

export function kindInfo(kind: string): KindInfo {
	return KINDS.find((k) => k.value === kind) ?? KINDS[KINDS.length - 1];
}

export const SEVERITY_LABELS: Record<number, string> = {
	1: "Mild",
	2: "Noticeable",
	3: "Moderate",
	4: "Intense",
	5: "Severe",
};

export interface EntryData {
	date: string; // YYYY-MM-DD
	time: string; // HH:mm
	kind: Kind;
	severity: number; // 1-5
	trigger: string;
	sensory: string; // sensory issues present, from the maintained sensitivity list
	warning_signs: string;
	thoughts: string;
	duration_min: number;
	recovery_notes: string;
	factors: string; // background contributors: sleep, food, environment, …
	tags: string[];
}

export interface SpiralEntry extends EntryData {
	file: TFile;
}

/** Split a comma-separated field (triggers, factors, tags) into clean items. */
export function splitList(value: string): string[] {
	return value
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
}
