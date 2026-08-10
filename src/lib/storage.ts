import type { PersistedWindowState, SparkTab, ThemeMode } from '../types';

export const SPARK_URL = 'https://gemini.google.com/spark';

const stateKey = (windowLabel: string) => `spark-desktop:window:${windowLabel}`;
const registryKey = 'spark-desktop:window-registry';

function titleForUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'docs.google.com') {
      if (parsed.pathname.startsWith('/spreadsheets/')) return 'Sheet';
      if (parsed.pathname.startsWith('/document/')) return 'Document';
    }
    if (parsed.hostname === 'drive.google.com') return 'Drive file';
    if (parsed.hostname === 'gemini.google.com') return 'Spark';
    return parsed.hostname.replace(/^www\./, '') || 'Page';
  } catch {
    return 'Spark';
  }
}

export function makeTab(url = SPARK_URL, title?: string): SparkTab {
  const id = crypto.randomUUID().replaceAll('-', '');
  return {
    id,
    label: `spark-${id}`,
    title: title?.trim() || titleForUrl(url),
    url,
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

function normalizeTab(value: Partial<SparkTab>): SparkTab | null {
  if (typeof value.id !== 'string' || typeof value.label !== 'string') return null;
  const url = typeof value.url === 'string' && /^https?:\/\//i.test(value.url) ? value.url : SPARK_URL;
  return {
    id: value.id,
    label: value.label,
    title: typeof value.title === 'string' && value.title.trim() ? value.title : titleForUrl(url),
    url,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  };
}

export function loadWindowState(windowLabel: string): PersistedWindowState {
  const raw = localStorage.getItem(stateKey(windowLabel));
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as PersistedWindowState;
    if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) return defaultState();
    const tabs = parsed.tabs.map((tab) => normalizeTab(tab)).filter((tab): tab is SparkTab => tab !== null);
    if (tabs.length === 0) return defaultState();
    const theme: ThemeMode = parsed.theme === 'light' ? 'light' : 'dark';
    const activeTabId = tabs.some((tab) => tab.id === parsed.activeTabId) ? parsed.activeTabId : tabs[0].id;
    return { ...parsed, tabs, activeTabId, theme };
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
