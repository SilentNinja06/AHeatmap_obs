import { App, Setting } from "obsidian";
// Copied from obsidian_workspace.obs packages/ui/src/startup.ts (this plugin lives in its own repo).

/**
 * "Open when Obsidian starts" for companion plugins that also work on their own.
 *
 * A dashboard (MERIDIAN Dash or the friendly Daily Dashboard) is the home screen
 * when one is installed: then this setting is hidden and the companion never
 * opens itself at startup. Without a dashboard, the companion can be the first
 * thing that opens.
 *
 * The choice is per device (Obsidian's per-vault local storage), so a phone and a
 * desktop can open different things, and no plugin settings file changes shape.
 */

export const DASHBOARD_PLUGIN_IDS = ["meridian-dash", "daily-dash"];

export function dashboardInstalled(app: App): boolean {
	const enabled = (app as unknown as { plugins?: { enabledPlugins?: Set<string> } }).plugins?.enabledPlugins;
	return DASHBOARD_PLUGIN_IDS.some((id) => enabled?.has?.(id));
}

const key = (pluginId: string) => `${pluginId}:open-on-startup`;

export function opensOnStartup(app: App, pluginId: string): boolean {
	try {
		return app.loadLocalStorage(key(pluginId)) === true;
	} catch {
		return false;
	}
}

/** Add the toggle to a settings tab — only when no dashboard is installed. */
export function startupSetting(container: HTMLElement, app: App, pluginId: string, label: string): void {
	if (dashboardInstalled(app)) return;
	new Setting(container)
		.setName(`Open ${label} when Obsidian starts`)
		.setDesc("On this device. Hidden while a dashboard (MERIDIAN Dash or Daily Dashboard) is installed, since that opens first.")
		.addToggle((t) =>
			t.setValue(opensOnStartup(app, pluginId)).onChange((v) => {
				try {
					app.saveLocalStorage(key(pluginId), v ? true : null);
				} catch {
					/* storage unavailable */
				}
			}),
		);
}

/**
 * Call once the layout is ready. Opens `viewType` as a main tab (reusing one
 * that's already open, or taking over an empty tab) when chosen on this device
 * and no dashboard is installed.
 */
export async function openViewOnStartup(app: App, pluginId: string, viewType: string): Promise<void> {
	if (dashboardInstalled(app) || !opensOnStartup(app, pluginId)) return;
	const ws = app.workspace;
	const existing = ws.getLeavesOfType(viewType)[0];
	if (existing) {
		ws.revealLeaf(existing);
		return;
	}
	const active = ws.getMostRecentLeaf();
	const empty = active && active.view?.getViewType?.() === "empty";
	const leaf = empty ? active : ws.getLeaf("tab");
	await leaf.setViewState({ type: viewType, active: true });
	ws.revealLeaf(leaf);
}
