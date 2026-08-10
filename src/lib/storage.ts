import type { PersistedWindowState, SparkTab, ThemeMode } from '../types';

const stateKey = (windowLabel: string) => `spark-desktop:window:${windowLabel}`;
const registryKey = 'spark-desktop:window-registry';

export function makeTab(): SparkTab {
  const id = crypto.randomUUID().replaceAll('-', '');
  return {
    id,
    label: `spark-${id}`,
    title: 'Spark',
    createdAt: Date.now(),
  };
}

export function defaultState(): PersistedWindowState {
  const tab = makeTab();
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    tabs: [tab],
    activeTabId: tab.id,
    theme: systemDark ? 'dark' : 'light',
  };
}

export function loadWindowState(windowLabel: string): PersistedWindowState {
  const raw = localStorage.getItem(stateKey(windowLabel));
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as PersistedWindowState;
    if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) return defaultState();
    const theme: ThemeMode = parsed.theme === 'light' ? 'light' : 'dark';
    const activeTabId = parsed.tabs.some((tab) => tab.id === parsed.activeTabId)
      ? parsed.activeTabId
      : parsed.tabs[0].id;
    return { ...parsed, activeTabId, theme };
  } catch {
    return defaultState();
  }
}

export function saveWindowState(windowLabel: string, state: PersistedWindowState): void {
  localStorage.setItem(stateKey(windowLabel), JSON.stringify(state));
}

export function registerWindow(windowLabel: string): void {
  const labels = new Set(loadWindowRegistry());
  labels.add(windowLabel);
  localStorage.setItem(registryKey, JSON.stringify([...labels]));
}

export function unregisterWindow(windowLabel: string): void {
  const labels = loadWindowRegistry().filter((label) => label !== windowLabel);
  localStorage.setItem(registryKey, JSON.stringify(labels));
}

export function loadWindowRegistry(): string[] {
  const raw = localStorage.getItem(registryKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
}
