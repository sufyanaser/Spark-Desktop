import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { invoke } from '@tauri-apps/api/core';
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import type { SparkTab } from '../types';

export const SPARK_URL = 'https://gemini.google.com/spark';
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
  const webview = new Webview(parent, tab.label, {
    url: SPARK_URL,
    x: g.x,
    y: g.y,
    width: g.width,
    height: g.height,
    focus: true,
    devtools: false,
    incognito: false,
    zoomHotkeysEnabled: true,
  });

  await new Promise<void>((resolve, reject) => {
    void webview.once('tauri://created', () => resolve());
    void webview.once('tauri://error', (event) => reject(new Error(String(event.payload))));
  });

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

export async function closeTabWebview(tab: SparkTab): Promise<void> {
  const handle = handles.get(tab.id) ?? (await Webview.getByLabel(tab.label));
  handles.delete(tab.id);
  if (handle) await handle.close().catch(() => undefined);
}

export async function createShellWindow(): Promise<void> {
  const label = `window-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const child = new WebviewWindow(label, {
    url: '/',
    title: 'Spark Desktop',
    width: 1280,
    height: 820,
    minWidth: 840,
    minHeight: 560,
    decorations: false,
    resizable: true,
    center: true,
  });

  await new Promise<void>((resolve, reject) => {
    void child.once('tauri://created', () => resolve());
    void child.once('tauri://error', (event) => reject(new Error(String(event.payload))));
  });
}
