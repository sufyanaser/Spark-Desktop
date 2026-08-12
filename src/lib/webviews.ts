import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { invoke } from '@tauri-apps/api/core';
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { SparkTab } from '../types';
import { SPARK_URL } from './storage';

export { SPARK_URL };
export const TOPBAR_HEIGHT = 40;

const handles = new Map<string, Webview>();

function geometry() {
  return {
    x: 0,
    y: TOPBAR_HEIGHT,
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight - TOPBAR_HEIGHT),
  };
}

export async function ensureTabWebview(tab: SparkTab): Promise<Webview> {
  const existing = handles.get(tab.id) ?? (await Webview.getByLabel(tab.label));
  if (existing) {
    handles.set(tab.id, existing);
    return existing;
  }

  const parent = getCurrentWindow();
  const g = geometry();

  await invoke('create_tab_webview', {
    parentLabel: parent.label,
    label: tab.label,
    url: tab.url || SPARK_URL,
    x: g.x,
    y: g.y,
    width: g.width,
    height: g.height,
  });

  const webview = await Webview.getByLabel(tab.label);
  if (!webview) throw new Error(`Spark tab webview '${tab.label}' was not created.`);
  handles.set(tab.id, webview);
  return webview;
}

export async function activateTab(tab: SparkTab, allTabs: SparkTab[]): Promise<void> {
  await Promise.all(
    allTabs
      .filter((candidate) => candidate.id !== tab.id)
      .map(async (candidate) => {
        const handle = handles.get(candidate.id) ?? (await Webview.getByLabel(candidate.label));
        if (handle) await handle.hide().catch(() => undefined);
      }),
  );

  const active = await ensureTabWebview(tab);
  await resizeTab(tab);
  await active.show();
  await active.setFocus();
}

export async function resizeTab(tab: SparkTab): Promise<void> {
  const handle = handles.get(tab.id) ?? (await Webview.getByLabel(tab.label));
  if (!handle) return;
  const g = geometry();
  await handle.setPosition(new LogicalPosition(g.x, g.y));
  await handle.setSize(new LogicalSize(g.width, g.height));
}

export async function reloadTab(tab: SparkTab): Promise<void> {
  await invoke('reload_webview', { label: tab.label });
}

export async function openGoogleWorkspaceInChrome(url: string): Promise<void> {
  await invoke('open_google_workspace_in_chrome', { url });
}

export async function closeTabWebview(tab: SparkTab): Promise<void> {
  const handle = handles.get(tab.id) ?? (await Webview.getByLabel(tab.label));
  handles.delete(tab.id);
  if (handle) await handle.close().catch(() => undefined);
}

export async function createShellWindow(): Promise<void> {
  const label = `window-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  await invoke('create_shell_window', { label });
}

export type WindowControlAction = 'minimize' | 'toggle-maximize' | 'close' | 'start-dragging';

export async function controlCurrentWindow(action: WindowControlAction): Promise<void> {
  const appWindow = getCurrentWindow();
  await invoke('control_window', { windowLabel: appWindow.label, action });
}
