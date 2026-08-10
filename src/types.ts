export type ThemeMode = 'light' | 'dark';

export type SparkTab = {
  id: string;
  label: string;
  title: string;
  createdAt: number;
};

export type PersistedWindowState = {
  tabs: SparkTab[];
  activeTabId: string | null;
  theme: ThemeMode;
};

export type UpdateUiState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'current' }
  | { kind: 'downloading'; version: string; percent: number | null }
  | { kind: 'ready'; version: string }
  | { kind: 'error'; message: string };
