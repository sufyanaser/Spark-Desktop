import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import type { UpdateUiState } from '../types';

export async function runAutoUpdate(
  setState: (state: UpdateUiState) => void,
): Promise<void> {
  try {
    setState({ kind: 'checking' });
    const update = await check({ timeout: 12_000 });
    if (!update) {
      setState({ kind: 'current' });
      return;
    }

    let downloaded = 0;
    let total: number | undefined;
    setState({ kind: 'downloading', version: update.version, percent: null });

    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        total = event.data.contentLength ?? undefined;
        downloaded = 0;
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        const percent = total && total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : null;
        setState({ kind: 'downloading', version: update.version, percent });
      }
    });

    setState({ kind: 'ready', version: update.version });
    await relaunch();
  } catch (error) {
    setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}
